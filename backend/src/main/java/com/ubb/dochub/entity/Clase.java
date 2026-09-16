package com.ubb.dochub.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.*;

@Entity
@Table(name = "clase", uniqueConstraints = {
    @UniqueConstraint(columnNames = {
        "hora_inicio", "fecha", "id_inscripcion" // un mismo estudiante no puede estar registrado en dos clases con la misma fecha y hora de hora_inicio;
                                                 // eso significaría que estaría haciendo las dos clases simultánemante 
    })
})
public class Clase {

    public Clase() {
    }

    public Clase(String asignatura, String tema, Planificacion planificacion, Inscripcion inscripcion,
            LocalTime horaInicio) {
        this.asignatura = asignatura;
        this.tema = tema;
        this.planificacion = planificacion;
        this.inscripcion = inscripcion;
        this.horaInicio = horaInicio;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asignatura")
    private String asignatura; // puede ser Orientación o Matemática

    @Column(name = "tema")
    private String tema; // ejemplo; ecuaciones cuadráticas
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_planificacion")  // La PK de la planificación pasa como FK a la clase, así el Estudiante puede subir la planificación desde antes de que la clase 
                                            // exista como tal
    private Planificacion planificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion") // FK a la inscripción del alumno, no al alumno directamente
    private Inscripcion inscripcion;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    @Column(name = "fecha")
    private LocalDate fecha;

    public Long getId() {
        return id;
    }

    public String getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(String asignatura) {
        this.asignatura = asignatura;
    }

    public String getTema() {
        return tema;
    }

    public void setTema(String tema) {
        this.tema = tema;
    }

    public Planificacion getPlanificacion() {
        return planificacion;
    }

    public void setPlanificacion(Planificacion planificacion) {
        this.planificacion = planificacion;
    }

    public Inscripcion getInscripcion() {
        return inscripcion;
    }

    public void setInscripcion(Inscripcion inscripcion) {
        this.inscripcion = inscripcion;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }


}
