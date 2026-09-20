package com.ubb.dochub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "inscripcion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
        "id_oferta", "rut_estudiante" // Un mismo estudiante no puede estar inscrito a la misma oferta dos veces
    })
})
public class Inscripcion {

    public Inscripcion() {
    }
    
    public Inscripcion(Oferta oferta, Estudiante estudiante) {
        this.oferta = oferta;
        this.estudiante = estudiante;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_oferta")
    private Oferta oferta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_estudiante")
    private Estudiante estudiante;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Oferta getOferta() {
        return oferta;
    }

    public void setOferta(Oferta oferta) {
        this.oferta = oferta;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }
}
