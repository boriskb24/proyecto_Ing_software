package com.ubb.dochub.ai.client;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * LlmRole: Representa los roles estándar de un chat LLM.
 */
public enum LlmRole {
// Las APIs tipo OpenAI esperan roles en minúsculas
    SYSTEM("system"),
    USER("user"),
    ASSISTANT("assistant"),
    TOOL("tool");

    private final String value;

    LlmRole(String value){
        this.value = value;
    }
    
    @JsonValue 
    public String getValue() {
        return value;
    }
}
