package com.trainingplanner.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey accessKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${jwt.access-token.secret}") String accessSecret,
            @Value("${jwt.access-token.expiration-ms}") long accessExpirationMs,
            @Value("${jwt.refresh-token.expiration-ms}") long refreshExpirationMs
    ) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpirationMs)))
                .signWith(accessKey)
                .compact();
    }

    /**
     * Generate a refresh token that embeds the userId as a prefix.
     * Format: "<userId>:<uuid>"
     * This allows the refresh endpoint to locate the user without a separate
     * userId parameter, while still validating against the stored BCrypt hash.
     * A single UUID (122 bits of entropy) keeps the token under BCrypt's 72-byte
     * input limit, which Spring Security 7 enforces strictly.
     */
    public String generateRefreshToken(String userId) {
        return userId + ":" + UUID.randomUUID();
    }

    /** @deprecated Use generateRefreshToken(userId) instead */
    @Deprecated
    public String generateRefreshToken() {
        return UUID.randomUUID().toString() + "-" + UUID.randomUUID();
    }

    /**
     * Extract userId (subject) from an access token.
     *
     * @throws JwtException if the token is invalid or expired
     */
    public String extractUserId(String accessToken) {
        Claims claims = Jwts.parser()
                .verifyWith(accessKey)
                .build()
                .parseSignedClaims(accessToken)
                .getPayload();
        return claims.getSubject();
    }

    public boolean isAccessTokenValid(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }
}
