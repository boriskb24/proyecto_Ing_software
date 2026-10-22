package com.ubb.dochub.ai.engine;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
    
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
    
@Service
public class DocumentParserService {
    
    private static final Logger log = LoggerFactory.getLogger(DocumentParserService.class);

    public ParsedDocument parsePdf(byte[] pdfBytes) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("El archivo PDF recibido está vacío.");
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            return extractContent(document);
        }
    }

    public ParsedDocument parsePdf(InputStream inputStream) throws IOException {
        if (inputStream == null) {
            throw new IllegalArgumentException("El InputStream del PDF no puede ser null.");
        }
        return parsePdf(inputStream.readAllBytes());
    }

    public ParsedDocument parsePdf(File file) throws IOException {
        if (file == null || !file.exists()) {
            throw new IllegalArgumentException("El archivo PDF especificado no existe.");
        }

        try (PDDocument document = Loader.loadPDF(file)) {
            return extractContent(document);
        }
    }

    private ParsedDocument extractContent(PDDocument document) throws IOException {
        int totalPages = document.getNumberOfPages();
        StringBuilder fullContent = new StringBuilder();

        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);

        for (int page = 1; page <= totalPages; page++) {
            stripper.setStartPage(page);
            stripper.setEndPage(page);

            String pageText = stripper.getText(document).trim();
            if (!pageText.isBlank()) {
                fullContent.append(String.format("--- [PÁGINA %d DE %d] ---\n", page, totalPages));
                fullContent.append(pageText).append("\n\n");
            }
        }

        String resultText = fullContent.toString().trim();
        log.info("PDF procesado con éxito: {} páginas, {} caracteres legibles extraídos", 
                totalPages, resultText.length());

        return new ParsedDocument(resultText, totalPages);
    }
}
