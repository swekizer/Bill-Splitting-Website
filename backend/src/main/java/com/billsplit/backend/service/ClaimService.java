package com.billsplit.backend.service;

import com.billsplit.backend.dto.ClaimDetailDto;
import com.billsplit.backend.dto.ClaimRequestDto;
import com.billsplit.backend.entity.Bill;
import com.billsplit.backend.entity.BillItem;
import com.billsplit.backend.entity.BillParticipant;
import com.billsplit.backend.entity.Claim;
import com.billsplit.backend.entity.User;
import com.billsplit.backend.exception.BadRequestException;
import com.billsplit.backend.exception.ResourceNotFoundException;
import com.billsplit.backend.repository.BillItemRepository;
import com.billsplit.backend.repository.BillParticipantRepository;
import com.billsplit.backend.repository.ClaimRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final BillItemRepository billItemRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final BillParticipantRepository billParticipantRepository;

    public ClaimService(ClaimRepository claimRepository,
                        BillItemRepository billItemRepository,
                        SimpMessagingTemplate messagingTemplate,
                        BillParticipantRepository billParticipantRepository) {
        this.claimRepository = claimRepository;
        this.billItemRepository = billItemRepository;
        this.messagingTemplate = messagingTemplate;
        this.billParticipantRepository = billParticipantRepository;
    }

    @Transactional
    public ClaimDetailDto claimItem(ClaimRequestDto request, User user) {
        // 1. Fetch target BillItem
        BillItem item = billItemRepository.findById(request.getBillItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill Item not found"));

        // 2. Fetch all claims for this item
        List<Claim> existingClaims = claimRepository.findByBillItemId(item.getId());

        // 3. Sum up total percentage already claimed
        double totalClaimedPercentage = existingClaims.stream()
                .mapToDouble(Claim::getPercentageClaimed)
                .sum();

        double remainingPercentage = 100.0 - totalClaimedPercentage;

        // 4. Validate that new claim doesn't exceed 100%
        if (request.getPercentageClaimed() > remainingPercentage) {
            throw new BadRequestException(
                    String.format("Cannot claim %.2f%%. Only %.2f%% is remaining for this item.",
                            request.getPercentageClaimed(), remainingPercentage)
            );
        }

        // 5. Calculate amountDue = totalPrice * (percentage / 100.0)
        BigDecimal amountDue = item.getTotalPrice()
                .multiply(BigDecimal.valueOf(request.getPercentageClaimed() / 100.0));

        // 6. Create & Save Claim Entity
        Claim claim = new Claim();
        claim.setBillItem(item);
        claim.setUser(user);
        claim.setPercentageClaimed(request.getPercentageClaimed());
        claim.setAmountDue(amountDue);

        Claim savedClaim = claimRepository.save(claim);

        // Record participant if not host
        Bill bill = item.getBill();
        if (!bill.getUser().getId().equals(user.getId())) {
            billParticipantRepository.findByBillIdAndUserId(bill.getId(), user.getId())
                    .orElseGet(() -> billParticipantRepository.save(new BillParticipant(bill, user)));
        }

        ClaimDetailDto claimDetailDto = ClaimDetailDto.builder()
                .id(savedClaim.getId())
                .billItemId(item.getId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .percentageClaimed(savedClaim.getPercentageClaimed())
                .amountDue(savedClaim.getAmountDue())
                .createdAt(savedClaim.getCreatedAt())
                .build();

        Long billId = item.getBill().getId();
        messagingTemplate.convertAndSend("/topic/bill/" + billId, claimDetailDto);
        return claimDetailDto;
    }

    @Transactional
    public void unclaimItem(Long claimId, User user) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        // Only the user who claimed or the host who uploaded the bill can unclaim
        boolean isOwner = claim.getUser().getId().equals(user.getId());
        boolean isHost = claim.getBillItem().getBill().getUser().getId().equals(user.getId());

        if (!isOwner && !isHost) {
            throw new BadRequestException("You are not authorized to remove this claim");
        }

        Long billId = claim.getBillItem().getBill().getId();
        claimRepository.delete(claim);

        // Broadcast unclaim event to all connected clients
        messagingTemplate.convertAndSend("/topic/bill/" + billId + "/unclaim", claimId);
    }
}
