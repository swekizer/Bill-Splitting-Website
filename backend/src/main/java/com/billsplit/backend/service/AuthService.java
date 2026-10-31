package com.billsplit.backend.service;

import com.billsplit.backend.dto.AuthResponse;
import com.billsplit.backend.dto.UserLoginRequest;
import com.billsplit.backend.dto.UserRegisterRequest;
import com.billsplit.backend.entity.User;
import com.billsplit.backend.exception.BadRequestException;
import com.billsplit.backend.repository.UserRepository;
import com.billsplit.backend.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public String registerService(UserRegisterRequest userRegisterRequest){

        Optional<User> existingUser = userRepository.findByEmail(userRegisterRequest.getEmail());

        if(existingUser.isPresent()){
            throw new BadRequestException("Email is already in use please sign in");
        }

        String hashedPassword = passwordEncoder.encode(userRegisterRequest.getPassword());
        User newUser = new User(userRegisterRequest.getName(), userRegisterRequest.getEmail(), hashedPassword);
        userRepository.save(newUser);

        return "User registered successfully";
    }

    public AuthResponse loginService(UserLoginRequest userLoginRequest){

        Optional<User> user = userRepository.findByEmail(userLoginRequest.getEmail());

        if(user.isEmpty()){
            throw new BadRequestException("User does not exist. Please register first.");
        }

        if(!passwordEncoder.matches(userLoginRequest.getPassword(), user.get().getPassword())){
            throw new BadRequestException("Incorrect password. Please try again.");
        }

        String token = jwtUtils.generateToken(user.get().getEmail());
        return new AuthResponse(token, user.get().getEmail(), user.get().getName());
    }
}
