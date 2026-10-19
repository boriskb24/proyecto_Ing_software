package com.ubb.dochub.ai.client;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
    
import java.time.Duration;
import java.util.List;


/**
 * OpenAiCompatClient: Puente traductor (Adapter en patrones de diseño) entre 
 * DocHub y los servidores externos de IA. Sigue el estándar de la industria; la API REST para modelos
 * conversacionales (POST /v1/chat/completions).
 *
 * Permite conexiones a cualquier otro cliente de IA compatible con el estándar OpenAI
 */

@Component 
public class OpenAiCompatClient implements LlmClient{
    
    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatClient.class);
    private final RestClient restClient;
    private final String model, apiKey;
    private final int CONNECTTION_TIMEOUT = 10;

    // Constructor para pruebas unitarias o inyección directa con mock
    public OpenAiCompatClient(RestClient restClient, String model, String apiKey) {
        this.restClient = restClient;
        this.model = model;
        this.apiKey = apiKey;
    }

    @Autowired 
    public OpenAiCompatClient(
            @Value("${ai.llm.base-url:http://localhost:11434/v1}") String baseUrl,
            @Value("${ai.llm.api-key:}") String apiKey,
            @Value("${ai.llm.model:qwen2.5:7b-instruct-q4_K_M}") String model,
            @Value("${ai.llm.timeout-seconds:60}") int timeoutSeconds) 

            {

            this.model = model;
            this.apiKey = apiKey;

            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(CONNECTTION_TIMEOUT));
            requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

            this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
            log.info("LlmClient inicializado apuntando a '{}' con modelo '{}'", baseUrl, model);
    }

    @Override
    public LlmResponse generate(List<LlmMessage> messages, double temperature) {
        ChatCompletionRequest requestPlayload = new ChatCompletionRequest(this.model, messages, temperature, false);
        try{
            RestClient.RequestBodySpec requestSpec = restClient.post().uri("/chat/completions").contentType(MediaType.APPLICATION_JSON).body(requestPlayload);

            if (apiKey != null && !apiKey.isBlank()) {
                requestSpec.header("Authorization", "Bearer " + apiKey.trim());
            }

            ChatCompletionResponse response = requestSpec.retrieve().body(ChatCompletionResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()){
                throw new LlmException("El proveedor LLM devolvió una respuesta vacía o sin alternativas");
            }

            ChatCompletionResponse.Choice choice = response.choices().get(0);
            String content = choice.message() != null ? choice.message().content() : "";
            int promptTokens = response.usage() != null ? response.usage().promptTokens() : 0;
            int completionTokens = response.usage() != null ? response.usage().completionTokens() : 0;

            return new LlmResponse(content, promptTokens, completionTokens, choice.finishReason());

            } catch (RestClientException ex) {
                log.error("Fallo de comunicación con el motor LLM: {}", ex.getMessage());
                throw new LlmException("Error al conectar con el servicio de inferencia IA: " + ex.getMessage(), ex);
            }
    }

    // --- DTOs internos para el protocolo OpenAI ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatCompletionRequest(
            String model,
            List<LlmMessage> messages,
            double temperature,
            boolean stream
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatCompletionResponse(
            String id,
            List<Choice> choices,
            Usage usage
    ) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        record Choice(
                int index,
                LlmMessage message,
                @JsonProperty("finish_reason") String finishReason
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Usage(
                @JsonProperty("prompt_tokens") int promptTokens,
                @JsonProperty("completion_tokens") int completionTokens,
                @JsonProperty("total_tokens") int totalTokens
        ) {}
    }
}
