package com.ubb.dochub.ai.client;
    
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
    
import java.util.List;
    
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
   


/**
 * Clase usada para testear el funcionamiento del cliente de openAi
 *
 * */
class OpenAiCompatClientTest {
    
    private MockRestServiceServer mockServer;
    private OpenAiCompatClient client;
    
    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:11434/v1");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        client = new OpenAiCompatClient(builder.build(), "qwen2.5:7b-instruct-q4_K_M", "test-secret-key");
    }
    
    @Test
    @DisplayName("Debe deserializar correctamente una respuesta exitosa de OpenAI/Ollama")
    void generateSuccess() {
        String jsonMockResponse = """
            {
		 "id": "chatcmpl-123",
		 "choices": [
                {
                  "index": 0,
                  "message": {
			"role": "assistant",
			"content": "Excelente planificación. Cumple con el DUA."
                  },
                  "finish_reason": "stop"
                }
		 ],
		 "usage": {
                "prompt_tokens": 45,
                "completion_tokens": 12,
                "total_tokens": 57
		 }
            }
            """;

        mockServer.expect(requestTo("http://localhost:11434/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-secret-key"))
                .andRespond(withSuccess(jsonMockResponse, MediaType.APPLICATION_JSON));

        List<LlmMessage> messages = List.of(
                LlmMessage.system("Eres un evaluador pedagógico."),
                LlmMessage.user("Revisa esta planificación de 7° básico.")
        );

        LlmResponse response = client.generate(messages, 0.2);

        assertNotNull(response);
        assertEquals("Excelente planificación. Cumple con el DUA.", response.content());
        assertEquals(45, response.promptTokens());
        assertEquals(12, response.completionTokens());
        assertEquals(57, response.totalTokens());
        assertEquals("stop", response.finishReason());

        mockServer.verify();
    }

    @Test
    @DisplayName("Debe lanzar LlmException si el proveedor responde con error 500")
    void generateServerErrorThrowsLlmException() {
        mockServer.expect(requestTo("http://localhost:11434/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        List<LlmMessage> messages = List.of(LlmMessage.user("Hola"));

        assertThrows(LlmException.class, () -> client.generate(messages, 0.2));
        mockServer.verify();
    }
}
