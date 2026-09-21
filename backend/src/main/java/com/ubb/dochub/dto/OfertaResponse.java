package com.ubb.dochub.dto;

public class OfertaResponse {
    private Long id;
    private int anio;
    private int periodo;
    private String asignaturaCodigo;
    private String asignaturaNombre;
    private Long inscritosCount;
    private Long inscripcionId;
    private String profesorNombre;
    private String profesorCorreo;

    public OfertaResponse() {}

    public OfertaResponse(Long id, int anio, int periodo, String asignaturaCodigo, String asignaturaNombre, Long inscritosCount) {
        this.id = id;
        this.anio = anio;
        this.periodo = periodo;
        this.asignaturaCodigo = asignaturaCodigo;
        this.asignaturaNombre = asignaturaNombre;
        this.inscritosCount = inscritosCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getAnio() { return anio; }
    public void setAnio(int anio) { this.anio = anio; }
    public int getPeriodo() { return periodo; }
    public void setPeriodo(int periodo) { this.periodo = periodo; }
    public String getAsignaturaCodigo() { return asignaturaCodigo; }
    public void setAsignaturaCodigo(String asignaturaCodigo) { this.asignaturaCodigo = asignaturaCodigo; }
    public String getAsignaturaNombre() { return asignaturaNombre; }
    public void setAsignaturaNombre(String asignaturaNombre) { this.asignaturaNombre = asignaturaNombre; }
    public Long getInscritosCount() { return inscritosCount; }
    public void setInscritosCount(Long inscritosCount) { this.inscritosCount = inscritosCount; }
    public Long getInscripcionId() { return inscripcionId; }
    public void setInscripcionId(Long inscripcionId) { this.inscripcionId = inscripcionId; }
    public String getProfesorNombre() { return profesorNombre; }
    public void setProfesorNombre(String profesorNombre) { this.profesorNombre = profesorNombre; }
    public String getProfesorCorreo() { return profesorCorreo; }
    public void setProfesorCorreo(String profesorCorreo) { this.profesorCorreo = profesorCorreo; }
}
