package com.ubb.dochub.ai.engine;
    
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
    
import java.io.ByteArrayOutputStream;
import java.io.IOException;
    
import static org.junit.jupiter.api.Assertions.*;
    
class DocumentParserServiceTest {
    
    private final DocumentParserService parserService = new DocumentParserService();
    
    @Test
    @DisplayName("Debe parsear correctamente un PDF de 2 páginas e incluir marcadores de página")
    void parsePdfSuccess() throws IOException {
        byte[] pdfBytes = createSamplePdf();
    
        ParsedDocument result = parserService.parsePdf(pdfBytes);
    
        assertNotNull(result);
        assertEquals(2, result.totalPages());
        assertTrue(result.hasContent());
        assertTrue(result.rawText().contains("--- [PÁGINA 1 DE 2] ---"));
        assertTrue(result.rawText().contains("Planificacion Matematica 7mo Basico"));
        assertTrue(result.rawText().contains("--- [PÁGINA 2 DE 2] ---"));
        assertTrue(result.rawText().contains("Guia de Ejercicios N 1"));
    }
    
    @Test
    @DisplayName("Debe lanzar IllegalArgumentException si el PDF es nulo o vacío")
    void parseEmptyPdfThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parserService.parsePdf((byte[]) null));
        assertThrows(IllegalArgumentException.class, () -> parserService.parsePdf(new byte[0]));
    }
    
    private byte[] createSamplePdf() throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
    
            // Página 1: Planificación
            PDPage page1 = new PDPage();
            document.addPage(page1);
            try (PDPageContentStream cs = new PDPageContentStream(document, page1)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText("Planificacion Matematica 7mo Basico");
                cs.endText();
            }
    
            // Página 2: Guía anexa
            PDPage page2 = new PDPage();
            document.addPage(page2);
            try (PDPageContentStream cs = new PDPageContentStream(document, page2)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText("Guia de Ejercicios N 1");
                cs.endText();
            }
    
            document.save(baos);
            return baos.toByteArray();
        }
    }
}
