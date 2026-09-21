package com.ubb.dochub.entity;

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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pauta de evaluación (archivo PDF de la evaluación en disco) según MER_3
    @Column(name = "archivo", nullable = false)
    private String archivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_clase")
    private Clase clase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_evaluador")
    private Evaluador evaluador;

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

    public String getPautaEvaluacion() {
        return archivo;
    }

    public void setPautaEvaluacion(String pautaEvaluacion) {
        this.archivo = pautaEvaluacion;
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
