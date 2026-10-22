package com.ubb.dochub.ai.client;

/**
 * LlmMessage: Registro inmutable con métodos factría para garantizar
 * fluidez y expresividad al escribir los mensajes
 */
public record LlmMessage(LlmRole role, String content) {

    public static LlmMessage system(String content) {
        return new LlmMessage(LlmRole.SYSTEM, content);
    }
    public static LlmMessage user(String content) {
        return new LlmMessage(LlmRole.USER, content);
    }
    public static LlmMessage assistant(String content) {
        return new LlmMessage(LlmRole.ASSISTANT, content);
    }
}
