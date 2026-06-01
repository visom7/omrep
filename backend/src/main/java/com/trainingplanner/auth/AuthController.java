package com.trainingplanner.auth;

import com.trainingplanner.auth.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        TokenResponse tokens = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tokens);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokens = userService.login(request);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        TokenResponse tokens = userService.refresh(request);
        return ResponseEntity.ok(tokens);
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal String userId) {
        User user = userService.getById(userId);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/users/me")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        User updated = userService.updateProfile(userId, request);
        return ResponseEntity.ok(UserResponse.from(updated));
    }
}
