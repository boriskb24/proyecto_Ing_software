package com.ubb.dochub.ai.engine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;    
import static org.junit.jupiter.api.Assertions.*;
    
class InferenceRateLimiterTest {
    
    @Test
    @DisplayName("Debe ejecutar la tarea normalmente y liberar el permiso")
    void executeWithLimitSuccess() {
        InferenceRateLimiter limiter = new InferenceRateLimiter(2, 5);

        String result = limiter.executeWithLimit(() -> "Respuesta generada");

        assertEquals("Respuesta generada", result);
        assertEquals(2, limiter.getAvailablePermits());
    }

    @Test
    @DisplayName("Debe liberar el permiso incluso si la tarea lanza una excepción")
    void executeWithLimitReleasesPermitOnError() {
        InferenceRateLimiter limiter = new InferenceRateLimiter(1, 5);

        assertThrows(RuntimeException.class, () ->
                limiter.executeWithLimit(() -> {
			throw new RuntimeException("Fallo en la inferencia");
                })
        );

        // El permiso debe quedar disponible para la siguiente petición
        assertEquals(1, limiter.getAvailablePermits());
    }

    @Test
    @DisplayName("Debe lanzar InferenceBusyException cuando se excede la concurrencia y se vence el timeout")
    void executeWithLimitTimeoutThrowsBusyException() throws InterruptedException {
        // Configuramos capacidad 1 y timeout de 1 segundo
        InferenceRateLimiter limiter = new InferenceRateLimiter(1, 1);

        // Hilo 1: Ocupa el único permiso durante 2 segundos
        Thread busyThread = new Thread(() -> {
            limiter.executeWithLimit(() -> {
                try {
			Thread.sleep(2000);
                } catch (InterruptedException ignored) {}
                return "ok";
            });
        });
        busyThread.start();

        // Damos 100ms para que el hilo 1 tome el permiso
        Thread.sleep(100);

        // Hilo 2 (principal): Intenta entrar, pero como el timeout es 1s y el hilo 1 dura 2s, debe saltar la excepción
        assertThrows(InferenceBusyException.class, () ->
                limiter.executeWithLimit(() -> "No debería entrar")
        );

        busyThread.join();
        assertEquals(1, limiter.getAvailablePermits());
    }
}
