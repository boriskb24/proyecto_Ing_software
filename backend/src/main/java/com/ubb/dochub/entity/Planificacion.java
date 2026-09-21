package com.ubb.dochub.entity;

import java.nio.file.Paths;
import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "planificacion")
public class Planificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Estado de la planificación; APROBADA, RECHAZADA o PENDIENTE
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPlanificacion estado;

    // El estándar de la industria es que la tabla no guarda el archivo como tal sino su ruta
    // Ejemplo: Planificacion.archivo = "/ruta/a/la/planificacion.pdf"
    @Column(name = "archivo", nullable = false)
    private String archivo;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    @Column(name = "retroalimentacion", nullable = true)
    private String retroalimentacion;

    public Planificacion() {
    }

    public Planificacion(String archivo) {
        this.archivo = archivo;
    }

    public Planificacion(String archivo, EstadoPlanificacion estado, LocalDate fecha, String retroalimentacion) {
        this.archivo = archivo;
        this.estado = estado;
        this.fecha = fecha;
        this.retroalimentacion = retroalimentacion;
    }

    @PrePersist
    protected void onCreate() {
        if (this.estado == null) {
            this.estado = EstadoPlanificacion.PENDIENTE;
        }
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

    public EstadoPlanificacion getEstado() {
        return estado;
    }

    public void setEstado(EstadoPlanificacion estado) {
        this.estado = estado;
    }

    public String getArchivo() {
        return archivo;
    }

    public void setArchivo(String archivo) {
        this.archivo = archivo;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    @Transient
    public String getNombreArchivo() {
        if (this.archivo == null) return "";
        try {
            return Paths.get(this.archivo).getFileName().toString();
        } catch (Exception e) {
            return this.archivo;
        }
    }

    @Transient
    public String getTipoArchivo() {
        return "application/pdf";
    }

    @Transient
    public String getFechaCreacion() {
        return this.fecha != null ? this.fecha.toString() : "";
    }
}
