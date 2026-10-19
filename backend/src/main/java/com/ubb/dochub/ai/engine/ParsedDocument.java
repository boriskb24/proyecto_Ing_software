package com.ubb.dochub.ai.engine;

/**
 * ParsedDocument: Contenedor del documento parseado.
 * Almacena el texto íntegro, el total de páginas y si contiene texto legible
 */
public record ParsedDocument(
        String rawText,
        int totalPages
        ) {

    public boolean hasContent(){
        return rawText != null && !rawText().isBlank();
    }

    public int characterCount() {
        return rawText != null ? rawText.length() : 0;
    }
}
