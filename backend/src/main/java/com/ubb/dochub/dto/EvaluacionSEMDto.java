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

    public EvaluacionSEMDto() {}

    public EvaluacionSEMDto(Long id, String rutEstudiante, String nombreCompletoEstudiante, String tipoEvaluacion, Double nota, String observaciones, LocalDate fecha) {
        this.id = id;
        this.rutEstudiante = rutEstudiante;
        this.nombreCompletoEstudiante = nombreCompletoEstudiante;
        this.tipoEvaluacion = tipoEvaluacion;
        this.nota = nota;
        this.observaciones = observaciones;
        this.fecha = fecha;
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
}