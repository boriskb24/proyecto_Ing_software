package com.ubb.dochub.dto;

public class InscripcionResponse {
    private Long inscripcionId;
    private String estudianteRut;
    private String nombreCompleto;
    private String correo;

    public InscripcionResponse() {}

    public InscripcionResponse(Long inscripcionId, String estudianteRut, String nombreCompleto, String correo) {
        this.inscripcionId = inscripcionId;
        this.estudianteRut = estudianteRut;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
    }

    public Long getInscripcionId() {
        return inscripcionId;
    }

    public void setInscripcionId(Long inscripcionId) {
        this.inscripcionId = inscripcionId;
    }

    public String getEstudianteRut() {
        return estudianteRut;
    }

    public void setEstudianteRut(String estudianteRut) {
        this.estudianteRut = estudianteRut;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }
}
