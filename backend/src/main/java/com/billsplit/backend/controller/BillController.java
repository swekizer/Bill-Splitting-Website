package com.billsplit.backend.controller;

import com.billsplit.backend.dto.ApiResponse;
import com.billsplit.backend.dto.BillDetailDto;
import com.billsplit.backend.entity.User;
import com.billsplit.backend.exception.ResourceNotFoundException;
import com.billsplit.backend.repository.UserRepository;
import com.billsplit.backend.service.BillService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/bill")
public class BillController {
    private final BillService billService;
    private final UserRepository userRepository;

    public BillController(BillService billService, UserRepository userRepository) {
        this.billService = billService;
        this.userRepository = userRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<BillDetailDto>> uploadBill(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User hostUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BillDetailDto createdBill = billService.createAndParseBill(file, title, hostUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill uploaded and parsed successfully", createdBill));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BillDetailDto>> getBill(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User currentUser = null;
        if (authentication != null && authentication.getName() != null) {
            currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        }
        BillDetailDto bill = billService.getBillDetails(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Bill retrieved successfully", bill));
    }

    @GetMapping("/my-bills")
    public ResponseEntity<ApiResponse<List<BillDetailDto>>> getMyBills(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<BillDetailDto> bills = billService.getMyBills(user);
        return ResponseEntity.ok(ApiResponse.success("User bills retrieved successfully", bills));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteBill(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        billService.deleteBill(id, user);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted successfully", "Bill " + id + " has been deleted"));
    }
}
