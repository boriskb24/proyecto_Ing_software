package com.ubb.dochub.entity;

import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "evaluacion_semestral")
public class EvaluacionSemestral {

    public EvaluacionSemestral() {
    }

    public EvaluacionSemestral(String archivo, Asignacion asignacion, String asignatura) {
        this.archivo = archivo;
        this.asignacion = asignacion;
        this.asignatura = asignatura;
    }

    public EvaluacionSemestral(String archivo, Asignacion asignacion, String asignatura, Double nota, String observaciones) {
        this.archivo = archivo;
        this.asignacion = asignacion;
        this.asignatura = asignatura;
        this.nota = nota;
        this.observaciones = observaciones;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archivo", nullable = false)
    private String archivo; // ruta al archivo en disco

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignacion")
    private Asignacion asignacion;
    
    @Column(name = "asignatura")
    private String asignatura;

    @Column(name = "nota", nullable = true)
    private Double nota;

    @Column(name = "observaciones", nullable = true) 
    private String observaciones;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDate.now();
        }
    }

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

    public Asignacion getAsignacion() {
        return asignacion;
    }

    public void setAsignacion(Asignacion asignacion) {
        this.asignacion = asignacion;
    }

    public String getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(String asignatura) {
        this.asignatura = asignatura;
    }

    public void setNota(Double nota){
        this.nota = nota;
    }

    public Double getNota(){
        return nota;
    }

    public void setObservaciones(String observaciones){
        this.observaciones = observaciones;
    }

    public String getObservaciones(){
        return observaciones;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }
}
