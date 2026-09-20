package com.ubb.dochub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "oferta", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
       "codigo_asignatura", "anio", "periodo" // la combinación (codigo_asignatura, anio, periodo) debe ser única; una misma asignatura no puede dictarse en el mimso año y período 
        // Esto significa que, para efectos prácticas, consideraremos todas las inscripciones a una oferta determinada corresponden a una sola sección.
    })
})
public class Oferta {

    public Oferta() {
    }
    
    public Oferta(int anio, int periodo, AsignaturaPractica asignaturaPractica) {
        this.anio = anio;
        this.periodo = periodo;
        this.asignaturaPractica = asignaturaPractica;
    }

    public Oferta(int anio, int periodo, AsignaturaPractica asignaturaPractica, Profesor profesor) {
        this.anio = anio;
        this.periodo = periodo;
        this.asignaturaPractica = asignaturaPractica;
        this.profesor = profesor;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anio", nullable = false)
    private int anio;

    @Column(name = "periodo", nullable = false)
    private int periodo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "codigo_asignatura", nullable = false)
    private AsignaturaPractica asignaturaPractica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rut_profesor", nullable = false)
    private Profesor profesor;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getAnio() {
        return anio;
    }

    public void setAnio(int anio) {
        this.anio = anio;
    }

    public int getPeriodo() {
        return periodo;
    }

    public void setPeriodo(int periodo) {
        this.periodo = periodo;
    }

    public AsignaturaPractica getAsignaturaPractica() {
        return asignaturaPractica;
    }

    public void setAsignaturaPractica(AsignaturaPractica asignaturaPractica) {
        this.asignaturaPractica = asignaturaPractica;
    }

    public Profesor getProfesor() {
        return profesor;
    }

    public void setProfesor(Profesor profesor) {
        this.profesor = profesor;
    }
}
