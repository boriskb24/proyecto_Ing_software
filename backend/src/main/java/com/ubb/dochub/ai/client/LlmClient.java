package com.ubb.dochub.ai.client;

import java.util.List;

/**
 * LlmClient
 */
public interface LlmClient {
    /**
     * Envía una lista de mensajes al modelo de lenguaje configurado y obtiene su respuesta
     *
     * @param messages Historial de mensajes (system, user, assistant).
     * @param temperature Grado de creatividad (0.1 para evaluación estricta, 0.7 para redacción creativa)
     * @return LlmResponse con el texto generado y metadatos de uso.
     * */
    LlmResponse generate(List<LlmMessage> messages, double temperature);
}
