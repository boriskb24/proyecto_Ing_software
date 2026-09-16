package com.ubb.dochub.entity;

import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "evaluacion_semestral", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
        "fecha", "asignatura" // por el modelo de negocio sabemos que el evaluador realiza 4 evaluaciones al semestre, dos de Orientación y dos de Matemática, pero todas tienen
                              // fechas distintas, así que no se puede subir dos evaluaciones de una misma asignatura en a misma fecha
    })
})
public class EvaluacionSemestral {

    public EvaluacionSemestral() {
    }

    public EvaluacionSemestral(String archivo, Asignacion asignacion, String asignatura) {
        this.archivo = archivo;
        this.asignacion = asignacion;
        this.asignatura = asignatura;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archivo", nullable = false)
    private String archivo; // ruta al archivo en disco

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignacion")
    private Asignacion asignacion; // la evaluación semestral se da un contexto en el que Estudiante y Evaluador estan relacionados mediante la inscripción de asignatura
    
    @Column(name = "asignatura")
    private String asignatura;

    @Column(name = "fecha", nullable = false, updatable = false) // la fecha de carga del archivo a la base de datos no se puede cambiar
    private LocalDate fecha;


    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDate.now(); // configurar automáticamente la fecha de carga como el momento en el que se creó el registro
    }


    public Long getId() {
        return id;
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


    public LocalDate getFecha() {
        return fecha;
    }

}
