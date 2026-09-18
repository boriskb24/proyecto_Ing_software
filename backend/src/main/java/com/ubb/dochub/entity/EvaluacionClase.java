package com.ubb.dochub.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "evaluacion_clase")
public class EvaluacionClase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archivo", nullable = false)
    private String archivo; // ruta al archivo en disco de evaluación de la clase

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_clase")
    private Clase clase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_evaluador")
    private Evaluador evaluador;

    @Column(name = "nota")
    private Double nota;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "fecha")
    private LocalDateTime fecha;

    public Long getId() {
        return id;
    }
    
    public String getArchivo() {
        return archivo;
    }

    public void setArchivo(String archivo) {
        this.archivo = archivo;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }
    
    public Double getNota() {
        return nota;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Clase getClase() {
        return clase;
    }

    public void setClase(Clase clase) {
        this.clase = clase;
    }

    public Evaluador getEvaluador() {
        return evaluador;
    }

    public void setEvaluador(Evaluador evaluador) {
        this.evaluador = evaluador;
    }
}
