package com.ubb.dochub.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Component
public class TokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final long EXPIRATION_MILLIS = 1000L * 60 * 60 * 24 * 7; // 7 días

    private final byte[] secretKey;

    public TokenService(@Value("${dochub.security.token-secret:DochubUltraSecureSecretKey2026ForUBBTokens123456789!}") String secret) {
        this.secretKey = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(String email, String role) {
        long expiry = System.currentTimeMillis() + EXPIRATION_MILLIS;
        String payload = email.trim().toLowerCase() + ":" + (role != null ? role.trim() : "Estudiante") + ":" + expiry;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    public String[] validateTokenAndExtract(String token) {
        if (token == null || !token.contains(".")) {
            return null;
        }

        String[] parts = token.split("\\.");
        if (parts.length != 2) {
            return null;
        }

        String encodedPayload = parts[0];
        String signature = parts[1];

        String expectedSignature = sign(encodedPayload);
        if (!expectedSignature.equals(signature)) {
            return null;
        }

        try {
            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            String[] payloadParts = payload.split(":");
            if (payloadParts.length < 3) {
                return null;
            }

            String email = payloadParts[0];
            String role = payloadParts[1];
            long expiry = Long.parseLong(payloadParts[2]);

            if (System.currentTimeMillis() > expiry) {
                return null; // Expirado
            }

            return new String[]{email, role};
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secretKey, HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Error al firmar token", e);
        }
    }
}
