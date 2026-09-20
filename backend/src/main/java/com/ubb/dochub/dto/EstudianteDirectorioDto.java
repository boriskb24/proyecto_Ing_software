package com.ubb.dochub.dto;

public class EstudianteDirectorioDto {
    private String rut;
    private String nombreCompleto;
    private String correo;
    private String carrera;
    private Long ultimaInscripcionId;
    private Long ofertaId;
    private String practicaActual;
    private String codigoPractica;
    private Integer anio;
    private Integer periodo;
    private String estado; // "En curso", "Finalizada", "Sin práctica"

    public EstudianteDirectorioDto() {}

    public EstudianteDirectorioDto(String rut, String nombreCompleto, String correo, String carrera,
                                   Long ultimaInscripcionId, Long ofertaId, String practicaActual,
                                   String codigoPractica, Integer anio, Integer periodo, String estado) {
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
        this.carrera = carrera;
        this.ultimaInscripcionId = ultimaInscripcionId;
        this.ofertaId = ofertaId;
        this.practicaActual = practicaActual;
        this.codigoPractica = codigoPractica;
        this.anio = anio;
        this.periodo = periodo;
        this.estado = estado;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
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

    public String getCarrera() {
        return carrera;
    }

    public void setCarrera(String carrera) {
        this.carrera = carrera;
    }

    public Long getUltimaInscripcionId() {
        return ultimaInscripcionId;
    }

    public void setUltimaInscripcionId(Long ultimaInscripcionId) {
        this.ultimaInscripcionId = ultimaInscripcionId;
    }

    public Long getOfertaId() {
        return ofertaId;
    }

    public void setOfertaId(Long ofertaId) {
        this.ofertaId = ofertaId;
    }

    public String getPracticaActual() {
        return practicaActual;
    }

    public void setPracticaActual(String practicaActual) {
        this.practicaActual = practicaActual;
    }

    public String getCodigoPractica() {
        return codigoPractica;
    }

    public void setCodigoPractica(String codigoPractica) {
        this.codigoPractica = codigoPractica;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Integer getPeriodo() {
        return periodo;
    }

    public void setPeriodo(Integer periodo) {
        this.periodo = periodo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}

