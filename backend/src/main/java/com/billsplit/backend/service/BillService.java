package com.billsplit.backend.service;

import com.billsplit.backend.dto.BillDetailDto;
import com.billsplit.backend.dto.BillItemDetailDto;
import com.billsplit.backend.dto.ClaimDetailDto;
import com.billsplit.backend.dto.ParsedBillDto;
import com.billsplit.backend.dto.ParsedBillItemDto;
import com.billsplit.backend.entity.*;
import com.billsplit.backend.exception.BadRequestException;
import com.billsplit.backend.exception.ResourceNotFoundException;
import com.billsplit.backend.repository.BillItemRepository;
import com.billsplit.backend.repository.BillParticipantRepository;
import com.billsplit.backend.repository.BillRepository;
import com.billsplit.backend.repository.ClaimRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BillService {
    private final CloudinaryService cloudinaryService;
    private final AIService aiService;
    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final ClaimRepository claimRepository;
    private final BillParticipantRepository billParticipantRepository;

    public BillService(CloudinaryService cloudinaryService,
                       AIService aiService,
                       BillRepository billRepository,
                       BillItemRepository billItemRepository,
                       ClaimRepository claimRepository,
                       BillParticipantRepository billParticipantRepository) {
        this.cloudinaryService = cloudinaryService;
        this.aiService = aiService;
        this.billRepository = billRepository;
        this.billItemRepository = billItemRepository;
        this.claimRepository = claimRepository;
        this.billParticipantRepository = billParticipantRepository;
    }

    @Transactional
    public BillDetailDto createAndParseBill(MultipartFile file, String title, User hostUser){
        String imageUrl = cloudinaryService.uploadImage(file);

        ParsedBillDto parsedBill = aiService.parseReceiptImage(imageUrl);

        Bill bill = new Bill();
        bill.setTitle(title);
        bill.setImageUrl(imageUrl);
        bill.setSubTotal(parsedBill.getSubtotal());
        bill.setTaxesTips(parsedBill.getTaxesTips());
        bill.setTotal(parsedBill.getTotal());
        bill.setStatus(Bill.Status.ACTIVE);
        bill.setUser(hostUser);

        Bill savedBill = billRepository.save(bill);

        List<BillItem> itemsToSave = new ArrayList<>();
        for(ParsedBillItemDto itemDto: parsedBill.getItems()){
            BillItem item = new BillItem();
            item.setProductName(itemDto.getName());
            item.setQuantity(itemDto.getQuantity());
            item.setUnitPrice(itemDto.getUnitPrice());
            item.setTotalPrice(itemDto.getTotalPrice());
            item.setBill(savedBill);
            itemsToSave.add(item);
        }
        List<BillItem> savedItems = billItemRepository.saveAll(itemsToSave);

        List<BillItemDetailDto> itemDtos = savedItems.stream().map(item -> BillItemDetailDto.builder()
                .id(item.getId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .claims(new ArrayList<>())
                .build()).collect(Collectors.toList());

        return BillDetailDto.builder()
                .id(savedBill.getId())
                .title(savedBill.getTitle())
                .imageUrl(savedBill.getImageUrl())
                .subTotal(savedBill.getSubTotal())
                .taxesTips(savedBill.getTaxesTips())
                .total(savedBill.getTotal())
                .status(savedBill.getStatus())
                .createdAt(savedBill.getCreatedAt())
                .hostUserId(hostUser.getId())
                .hostUserName(hostUser.getName())
                .hostUserEmail(hostUser.getEmail())
                .isHost(true)
                .myShare(BigDecimal.ZERO)
                .participantCount(1)
                .items(itemDtos)
                .build();
    }

    @Transactional
    public BillDetailDto getBillDetails(Long billId, User currentUser) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        // Automatically register participant if currentUser is not the host
        if (currentUser != null && !bill.getUser().getId().equals(currentUser.getId())) {
            billParticipantRepository.findByBillIdAndUserId(billId, currentUser.getId())
                    .orElseGet(() -> billParticipantRepository.save(new BillParticipant(bill, currentUser)));
        }

        List<BillItem> items = billItemRepository.findByBillId(billId);
        List<Claim> claims = claimRepository.findByBillItemBillId(billId);

        Map<Long, List<Claim>> claimsByItemId = claims.stream()
                .collect(Collectors.groupingBy(c -> c.getBillItem().getId()));

        List<BillItemDetailDto> itemDtos = items.stream().map(item -> {
            List<Claim> itemClaims = claimsByItemId.getOrDefault(item.getId(), Collections.emptyList());
            List<ClaimDetailDto> claimDtos = itemClaims.stream().map(c -> ClaimDetailDto.builder()
                    .id(c.getId())
                    .billItemId(item.getId())
                    .userId(c.getUser().getId())
                    .userName(c.getUser().getName())
                    .userEmail(c.getUser().getEmail())
                    .percentageClaimed(c.getPercentageClaimed())
                    .amountDue(c.getAmountDue())
                    .createdAt(c.getCreatedAt())
                    .build()).collect(Collectors.toList());

            return BillItemDetailDto.builder()
                    .id(item.getId())
                    .productName(item.getProductName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .claims(claimDtos)
                    .build();
        }).collect(Collectors.toList());

        boolean isHost = currentUser != null && bill.getUser().getId().equals(currentUser.getId());

        // Count unique participants
        Set<Long> participantUserIds = new HashSet<>();
        participantUserIds.add(bill.getUser().getId());
        claims.forEach(c -> participantUserIds.add(c.getUser().getId()));
        billParticipantRepository.findByBillId(billId).forEach(bp -> participantUserIds.add(bp.getUser().getId()));

        // Calculate current user's share if claimed
        BigDecimal myShare = BigDecimal.ZERO;
        if (currentUser != null) {
            BigDecimal myItemsSum = claims.stream()
                    .filter(c -> c.getUser().getId().equals(currentUser.getId()))
                    .map(Claim::getAmountDue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (myItemsSum.compareTo(BigDecimal.ZERO) > 0 && bill.getSubTotal().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal ratio = myItemsSum.divide(bill.getSubTotal(), 6, RoundingMode.HALF_UP);
                BigDecimal taxTipShare = bill.getTaxesTips().multiply(ratio);
                myShare = myItemsSum.add(taxTipShare).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return BillDetailDto.builder()
                .id(bill.getId())
                .title(bill.getTitle())
                .imageUrl(bill.getImageUrl())
                .subTotal(bill.getSubTotal())
                .taxesTips(bill.getTaxesTips())
                .total(bill.getTotal())
                .status(bill.getStatus())
                .createdAt(bill.getCreatedAt())
                .hostUserId(bill.getUser().getId())
                .hostUserName(bill.getUser().getName())
                .hostUserEmail(bill.getUser().getEmail())
                .isHost(isHost)
                .myShare(myShare)
                .participantCount(participantUserIds.size())
                .items(itemDtos)
                .build();
    }

    public List<BillDetailDto> getMyBills(User user) {
        // Fetches all bills where user is Host OR Participant OR has Claims
        List<Bill> bills = billRepository.findAllUserBills(user.getId());

        return bills.stream().map(b -> {
            boolean isHost = b.getUser().getId().equals(user.getId());

            List<Claim> claims = claimRepository.findByBillItemBillId(b.getId());

            Set<Long> participantUserIds = new HashSet<>();
            participantUserIds.add(b.getUser().getId());
            claims.forEach(c -> participantUserIds.add(c.getUser().getId()));
            billParticipantRepository.findByBillId(b.getId()).forEach(bp -> participantUserIds.add(bp.getUser().getId()));

            BigDecimal myItemsSum = claims.stream()
                    .filter(c -> c.getUser().getId().equals(user.getId()))
                    .map(Claim::getAmountDue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal myShare = BigDecimal.ZERO;
            if (myItemsSum.compareTo(BigDecimal.ZERO) > 0 && b.getSubTotal().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal ratio = myItemsSum.divide(b.getSubTotal(), 6, RoundingMode.HALF_UP);
                BigDecimal taxTipShare = b.getTaxesTips().multiply(ratio);
                myShare = myItemsSum.add(taxTipShare).setScale(2, RoundingMode.HALF_UP);
            }

            return BillDetailDto.builder()
                    .id(b.getId())
                    .title(b.getTitle())
                    .imageUrl(b.getImageUrl())
                    .subTotal(b.getSubTotal())
                    .taxesTips(b.getTaxesTips())
                    .total(b.getTotal())
                    .status(b.getStatus())
                    .createdAt(b.getCreatedAt())
                    .hostUserId(b.getUser().getId())
                    .hostUserName(b.getUser().getName())
                    .hostUserEmail(b.getUser().getEmail())
                    .isHost(isHost)
                    .myShare(myShare)
                    .participantCount(participantUserIds.size())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteBill(Long billId, User user) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if (!bill.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to delete this bill");
        }

        billParticipantRepository.deleteByBillId(billId);
        claimRepository.deleteByBillItemBillId(billId);
        billItemRepository.deleteByBillId(billId);
        billRepository.delete(bill);
    }
}
