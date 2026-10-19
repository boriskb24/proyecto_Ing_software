package com.ubb.dochub.ai.engine;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component 
/**
 * InferenceRateLimiter: Maneja la concurrencia de peticiones LLM con semáforos.
 */
public class InferenceRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(InferenceRateLimiter.class);

    private final Semaphore semaphore;
    private final int queueTimeoutSeconds, maxConcurrency;

    public InferenceRateLimiter(
            @Value("${ai.llm.max-concurrency:2}") int maxConcurrency,
            @Value("${ai.lln.queue-timeout-seconds:30}") int queueTimeoutSeconds
            ) {
        this.queueTimeoutSeconds = queueTimeoutSeconds;
        this.maxConcurrency = maxConcurrency;
        this.semaphore = new Semaphore(maxConcurrency, true);
        log.info("InferenceRateLimiter inicializado: máx concurrencia = {}, timeout espera = {}s", maxConcurrency, queueTimeoutSeconds);
    }

    /**
     * Ejecuta una tarea de inferencia LLM garantizando que no se supere la concurrencia máxima.
     * Si la capacidad está colapsada, espera hasta queueTimeoutSeconds antes de avisar.
     * */
    public <T> T executeWithLimit(Supplier<T> task) {
        boolean acquired = false;
        try {
            acquired = semaphore.tryAcquire(queueTimeoutSeconds, TimeUnit.SECONDS);
            if (!acquired){
                log.warn("Capacidad de inferencia saturada tras {}s de espera", queueTimeoutSeconds);
                throw new InferenceBusyException("RetroPlani está atendiendo la capacidad máxima de consultas simultáneas. Por favor, reintenta en unos instantes."); 
            }
            return task.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new InferenceBusyException("La solicitud de inferencia fue interrumpida");
        } finally {
            if (acquired) {
                semaphore.release();
            }
        }
    }

    public int getAvailablePermits() {
        return semaphore.availablePermits();
    }

    public int getMaxConcurrency() {
        return maxConcurrency;
    }
}
