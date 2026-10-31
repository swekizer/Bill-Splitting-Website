package com.billsplit.backend.controller;

import com.billsplit.backend.dto.ApiResponse;
import com.billsplit.backend.dto.ClaimDetailDto;
import com.billsplit.backend.dto.ClaimRequestDto;
import com.billsplit.backend.entity.User;
import com.billsplit.backend.exception.ResourceNotFoundException;
import com.billsplit.backend.repository.UserRepository;
import com.billsplit.backend.service.ClaimService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;
    private final UserRepository userRepository;

    public ClaimController(ClaimService claimService, UserRepository userRepository) {
        this.claimService = claimService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClaimDetailDto>> claimItem(
            @RequestBody ClaimRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClaimDetailDto claim = claimService.claimItem(request, user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item claimed successfully", claim));
    }

    @DeleteMapping("/{claimId}")
    public ResponseEntity<ApiResponse<String>> unclaimItem(
            @PathVariable Long claimId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        claimService.unclaimItem(claimId, user);

        return ResponseEntity.ok(ApiResponse.success("Item unclaimed successfully", "Claim " + claimId + " deleted"));
    }
}
