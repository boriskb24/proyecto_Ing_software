package com.ubb.dochub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "asignacion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
        "id_inscripcion", "rut_evaluador" // Un mismo evaluador no puede ser asignado a un mismo estudiante (mediante la inscripción) dos veces
    })
})
public class Asignacion {

    public Asignacion() {
    }

    public Asignacion(Inscripcion inscripcion, Evaluador evaluador) {
        this.inscripcion = inscripcion;
        this.evaluador = evaluador;
    }

    public Asignacion(Inscripcion inscripcion, Evaluador evaluador, String establecimiento) {
        this.inscripcion = inscripcion;
        this.evaluador = evaluador;
        this.establecimiento = establecimiento;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Atributo definido formalmente en MER_3
    @Column(name = "establecimiento")
    private String establecimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion")
    private Inscripcion inscripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_evaluador")
    private Evaluador evaluador;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEstablecimiento() {
        return establecimiento;
    }

    public void setEstablecimiento(String establecimiento) {
        this.establecimiento = establecimiento;
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
