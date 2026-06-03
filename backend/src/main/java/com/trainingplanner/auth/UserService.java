package com.trainingplanner.auth;

import com.trainingplanner.auth.dto.*;
import com.trainingplanner.domain.OneRmFormula;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String inviteCode;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.invite-code:}") String inviteCode
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.inviteCode = inviteCode;
    }

    public TokenResponse register(RegisterRequest request) {
        // Registration is invite-only: it is disabled unless an invite code is
        // configured (app.invite-code / INVITE_CODE) and the request matches it.
        if (inviteCode == null || inviteCode.isBlank()
                || !inviteCode.equals(request.inviteCode())) {
            throw new InvalidInviteCodeException();
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyUsedException(request.email());
        }

        // Save user first to get the generated id, then attach refresh token
        User user = new User(
                null,
                request.email(),
                passwordEncoder.encode(request.password()),
                request.displayName(),
                OneRmFormula.EPLEY,
                null,
                Instant.now()
        );
        User saved = userRepository.save(user);

        // Now generate a refresh token embedding the userId
        String refreshToken = jwtService.generateRefreshToken(saved.id());
        User withToken = saved.withRefreshTokenHash(passwordEncoder.encode(refreshToken));
        userRepository.save(withToken);

        String accessToken = jwtService.generateAccessToken(saved.id());
        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException());

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new InvalidCredentialsException();
        }

        String refreshToken = jwtService.generateRefreshToken(user.id());
        User updated = user.withRefreshTokenHash(passwordEncoder.encode(refreshToken));
        userRepository.save(updated);

        String accessToken = jwtService.generateAccessToken(user.id());
        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse refresh(RefreshRequest request) {
        // The refresh token contains a userId prefix encoded in our UUID-based token.
        // We find the user by matching the hashed token stored in their document.
        // Since we cannot query by hash, we rely on the caller providing a valid userId
        // claim — but for security we scan only if the token format is valid.
        // For MVP: we require the client to send userId in a custom header or embed it
        // in the refresh token. Here we embed userId in the refresh token as prefix.
        //
        // Refresh token format: "<userId>:<uuid>-<uuid>"
        String token = request.refreshToken();
        int colonIndex = token.indexOf(':');
        if (colonIndex < 0) {
            throw new InvalidTokenException();
        }

        String userId = token.substring(0, colonIndex);
        User user = userRepository.findById(userId)
                .orElseThrow(InvalidTokenException::new);

        if (!passwordEncoder.matches(token, user.refreshTokenHash())) {
            throw new InvalidTokenException();
        }

        // Rotate: generate new pair
        String newRefreshToken = jwtService.generateRefreshToken(userId);
        User updated = user.withRefreshTokenHash(passwordEncoder.encode(newRefreshToken));
        userRepository.save(updated);

        String accessToken = jwtService.generateAccessToken(userId);
        return new TokenResponse(accessToken, newRefreshToken);
    }

    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    public User updateProfile(String userId, UpdateProfileRequest request) {
        User user = getById(userId);
        User updated = user.withProfile(request.displayName(), request.preferredOneRmFormula());
        return userRepository.save(updated);
    }

    // --- Exceptions ---

    public static class EmailAlreadyUsedException extends RuntimeException {
        public EmailAlreadyUsedException(String email) {
            super("Email already registered: " + email);
        }
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid email or password");
        }
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException() {
            super("Invalid or expired refresh token");
        }
    }

    public static class InvalidInviteCodeException extends RuntimeException {
        public InvalidInviteCodeException() {
            super("Registration is invite-only: a valid invite code is required");
        }
    }
}
