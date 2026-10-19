package com.ubb.dochub.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatSessionDto(
        Long sessionId,
        Long planificacionId,
        String userEmail,
        String rolUsuario,
        Integer totalPaginas,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<ChatMessageDto> messages
) {}
