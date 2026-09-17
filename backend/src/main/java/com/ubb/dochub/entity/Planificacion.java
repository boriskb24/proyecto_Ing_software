package com.ubb.dochub.entity;

import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import jakarta.persistence.*;

@Entity
@Table(name = "planificacion")
public class Planificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Estado de la planificación: APROBADA, RECHAZADA o PENDIENTE
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPlanificacion estado;

    // Ruta de almacenamiento en disco del PDF
    @Column(name = "archivo", nullable = false)
    private String archivo;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    @Column(name = "retroalimentacion")
    private String retroalimentacion;

    // Relación RBAC con el usuario que subió la planificación
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User usuario;

    public Planificacion() {
    }

    public Planificacion(String archivo) {
        this.archivo = archivo;
    }

    public Planificacion(String archivo, EstadoPlanificacion estado, LocalDateTime fecha, String retroalimentacion, User usuario) {
        this.archivo = archivo;
        this.estado = estado;
        this.fecha = fecha;
        this.retroalimentacion = retroalimentacion;
        this.usuario = usuario;
    }

    @PrePersist
    protected void onCreate() {
        if (this.estado == null) {
            this.estado = EstadoPlanificacion.PENDIENTE;
        }
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
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

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
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
        if (this.fecha == null) return "";
        return this.fecha.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
