package com.ubb.dochub.dto;

import java.time.LocalDate;

public class EvaluacionSEMDto {
    private Long id;
    private String rutEstudiante;
    private String nombreCompletoEstudiante;
    private String tipoEvaluacion;
    private Double nota;
    private String observaciones;
    private LocalDate fecha;
    private String archivoUrl;
    private String nombreArchivo;

    private String evaluadorNombre;
    private String evaluadorRut;
    private String evaluadorTipo;
    private Integer anio;
    private Integer periodo;
    private String asignaturaNombre;

    public EvaluacionSEMDto() {}

    public EvaluacionSEMDto(Long id, String rutEstudiante, String nombreCompletoEstudiante, String tipoEvaluacion, Double nota, String observaciones, LocalDate fecha) {
        this(id, rutEstudiante, nombreCompletoEstudiante, tipoEvaluacion, nota, observaciones, fecha, null, null);
    }

    public EvaluacionSEMDto(Long id, String rutEstudiante, String nombreCompletoEstudiante, String tipoEvaluacion, Double nota, String observaciones, LocalDate fecha, String archivoUrl, String nombreArchivo) {
        this(id, rutEstudiante, nombreCompletoEstudiante, tipoEvaluacion, nota, observaciones, fecha, archivoUrl, nombreArchivo, null, null, null, null, null, null);
    }

    public EvaluacionSEMDto(Long id, String rutEstudiante, String nombreCompletoEstudiante, String tipoEvaluacion, Double nota, String observaciones, LocalDate fecha, String archivoUrl, String nombreArchivo, String evaluadorNombre, String evaluadorRut, String evaluadorTipo, Integer anio, Integer periodo, String asignaturaNombre) {
        this.id = id;
        this.rutEstudiante = rutEstudiante;
        this.nombreCompletoEstudiante = nombreCompletoEstudiante;
        this.tipoEvaluacion = tipoEvaluacion;
        this.nota = nota;
        this.observaciones = observaciones;
        this.fecha = fecha;
        this.archivoUrl = archivoUrl;
        this.nombreArchivo = nombreArchivo;
        this.evaluadorNombre = evaluadorNombre;
        this.evaluadorRut = evaluadorRut;
        this.evaluadorTipo = evaluadorTipo;
        this.anio = anio;
        this.periodo = periodo;
        this.asignaturaNombre = asignaturaNombre;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRutEstudiante() { return rutEstudiante; }
    public void setRutEstudiante(String rutEstudiante) { this.rutEstudiante = rutEstudiante; }

    public String getNombreCompletoEstudiante() { return nombreCompletoEstudiante; }
    public void setNombreCompletoEstudiante(String nombreCompletoEstudiante) { this.nombreCompletoEstudiante = nombreCompletoEstudiante; }

    public String getTipoEvaluacion() { return tipoEvaluacion; }
    public void setTipoEvaluacion(String tipoEvaluacion) { this.tipoEvaluacion = tipoEvaluacion; }

    public Double getNota() { return nota; }
    public void setNota(Double nota) { this.nota = nota; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getArchivoUrl() { return archivoUrl; }
    public void setArchivoUrl(String archivoUrl) { this.archivoUrl = archivoUrl; }

    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }

    public String getEvaluadorNombre() { return evaluadorNombre; }
    public void setEvaluadorNombre(String evaluadorNombre) { this.evaluadorNombre = evaluadorNombre; }

    public String getEvaluadorRut() { return evaluadorRut; }
    public void setEvaluadorRut(String evaluadorRut) { this.evaluadorRut = evaluadorRut; }

    public String getEvaluadorTipo() { return evaluadorTipo; }
    public void setEvaluadorTipo(String evaluadorTipo) { this.evaluadorTipo = evaluadorTipo; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public Integer getPeriodo() { return periodo; }
    public void setPeriodo(Integer periodo) { this.periodo = periodo; }

    public String getAsignaturaNombre() { return asignaturaNombre; }
    public void setAsignaturaNombre(String asignaturaNombre) { this.asignaturaNombre = asignaturaNombre; }
}