package com.ubb.dochub.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequestDto(
        Long planificacionId,
        Long sessionId,
        @NotBlank(message = "El mensaje no puede estar vacío") String message
) {}
