package com.ubb.dochub.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "evaluacion_clase")
public class EvaluacionClase {

    public EvaluacionClase() {
    }

    public EvaluacionClase(String archivo, Clase clase, Evaluador evaluador) {
        this.archivo = archivo;
        this.clase = clase;
        this.evaluador = evaluador;
    }

    public EvaluacionClase(String archivo, Clase clase, Evaluador evaluador, Double nota, String observaciones, LocalDateTime fecha) {
        this.archivo = archivo;
        this.clase = clase;
        this.evaluador = evaluador;
        this.nota = nota;
        this.observaciones = observaciones;
        this.fecha = fecha;
    }

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
    
    public void setId(Long id) {
        this.id = id;
    }

    public String getArchivo() {
        return archivo;
    }

    public void setArchivo(String archivo) {
        this.archivo = archivo;
    }

    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
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
