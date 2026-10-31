package com.billsplit.backend.controller;

import com.billsplit.backend.dto.ApiResponse;
import com.billsplit.backend.dto.AuthResponse;
import com.billsplit.backend.dto.UserLoginRequest;
import com.billsplit.backend.dto.UserRegisterRequest;
import com.billsplit.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;
    }

    //POST -> Register
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody UserRegisterRequest userRegisterRequest){
        String message = authService.registerService(userRegisterRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    //POST -> Login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody UserLoginRequest userLoginRequest){
        AuthResponse response = authService.loginService(userLoginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login Successful", response));
    }

    @GetMapping("/me")
    public String me(){
        return "You are logged in";
    }
}
