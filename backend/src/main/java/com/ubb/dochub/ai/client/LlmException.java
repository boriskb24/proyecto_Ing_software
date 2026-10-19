package com.ubb.dochub.ai.client;

/**
 * LlmException: Excepción especial para el contexto del modelo
 */
public class LlmException extends RuntimeException{
    public LlmException(String message) {
        super(message);
    }

    public LlmException(String message, Throwable cause){
        super(message, cause);
    }
}
