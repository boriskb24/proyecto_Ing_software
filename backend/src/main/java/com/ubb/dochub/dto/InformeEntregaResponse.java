package com.ubb.dochub.dto;

import java.time.LocalDateTime;

public class InformeEntregaResponse {

    private String mensaje;
    private String nombreArchivo;
    private long tamanoBytes;
    private String contentType;
    private LocalDateTime fechaEntrega;

    private Long id;
    private String archivoUrl;

    public InformeEntregaResponse() {
    }

    public InformeEntregaResponse(String mensaje, String nombreArchivo, long tamanoBytes, String contentType, LocalDateTime fechaEntrega) {
        this.mensaje = mensaje;
        this.nombreArchivo = nombreArchivo;
        this.tamanoBytes = tamanoBytes;
        this.contentType = contentType;
        this.fechaEntrega = fechaEntrega;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public long getTamanoBytes() {
        return tamanoBytes;
    }

    public void setTamanoBytes(long tamanoBytes) {
        this.tamanoBytes = tamanoBytes;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public LocalDateTime getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDateTime fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }
}
