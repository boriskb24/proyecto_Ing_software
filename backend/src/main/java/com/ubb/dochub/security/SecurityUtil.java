package com.ubb.dochub.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static Optional<String> getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String email) {
            if (!"anonymousUser".equalsIgnoreCase(email)) {
                return Optional.of(email.trim().toLowerCase());
            }
        }
        return Optional.empty();
    }

    public static boolean isCurrentUser(String email) {
        if (email == null) return false;
        return getCurrentUserEmail()
                .map(current -> current.equalsIgnoreCase(email.trim()))
                .orElse(false);
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        String targetRole = "ROLE_" + role.toUpperCase();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase(targetRole));
    }

    public static boolean isAdminOrCoordinator() {
        return hasRole("ADMINISTRADOR") || getCurrentUserEmail()
                .map("admin@ubiobio.cl"::equalsIgnoreCase)
                .orElse(false);
    }
}
