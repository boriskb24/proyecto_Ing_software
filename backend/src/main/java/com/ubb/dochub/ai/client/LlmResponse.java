package com.ubb.dochub.ai.client;

/**
 * LlmResponse: El resultado normalizado que devuelve el cliente de inferencia, incluyendo métricas
 * básicas de uso para monitoreo de tokens
 */
public record LlmResponse(
        String content,
        int promptTokens,
        int completionTokens,
        String finishReason
        ) {

    public int totalTokens() {
        return promptTokens + completionTokens;
    }
}
