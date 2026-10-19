package com.ubb.dochub.ai.dto;

import java.time.LocalDateTime;

public record ChatMessageDto(
        Long id,
        String role,
        String content,
        Integer promptTokens,
        Integer completionTokens,
        LocalDateTime createdAt
) {}
