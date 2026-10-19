package com.ubb.dochub.ai.engine;

/**
 * InferenceBusyException: Excepción para cuando el servidor se sature debido a un exceso de peticiones concurrentes al modelo LLM.
 */
public class InferenceBusyException extends RuntimeException{
    public InferenceBusyException(String message) {
        super(message);
    }
}
