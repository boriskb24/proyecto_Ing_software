package com.ubb.dochub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "asignacion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
        "id_inscripcion", "rut_evaluador" // Un mismo evaluador no puede ser asignado a un mismo estudiante (mediante la inscripción) dos veces
    })
})
public class Asignacion {

    public Asignacion() {}

    public Asignacion(Inscripcion inscripcion, Evaluador evaluador) {
        this.inscripcion = inscripcion;
        this.evaluador = evaluador;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion")
    private Inscripcion inscripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_evaluador")
    private Evaluador evaluador;

    public Long getId() {
        return id;
    }

    public Inscripcion getInscripcion() {
        return inscripcion;
    }

    public void setInscripcion(Inscripcion inscripcion) {
        this.inscripcion = inscripcion;
    }

    public Evaluador getEvaluador() {
        return evaluador;
    }

    public void setEvaluador(Evaluador evaluador) {
        this.evaluador = evaluador;
    }
}
