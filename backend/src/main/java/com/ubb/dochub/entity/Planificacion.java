package com.ubb.dochub.entity;

import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "planificacion")
public class Planificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    // Estado de la planificación; APROBADA, RECHAZADA o PENDIENTE
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPlanificacion estado;

    public EstadoPlanificacion getEstado() {
        return estado;
    }

    public void setEstado(EstadoPlanificacion estado) {
        this.estado = estado;
    }

    // El estándar de la industria es que la tabla no guarda el archivo como tal sino su ruta
    // Ejemplo: Planificacion.archivo = "/ruta/a/la/planificacion.pdf"
    @Column(name = "archivo", nullable = false)
    private String archivo;

    public String getArchivo() {
        return archivo;
    }

    public void setArchivo(String archivo) { // Podría ser útil por si el estudiante se equivoca y tiene que cambiar el archivo
        this.archivo = archivo;
    }

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    public LocalDate getFecha() {
        return fecha;
    }

    // Se descarta el setter para la fecha ya que este atributo es la fecha en la que se cargó el documento en el sistema;
    // se crea automaticamente y no debería cambiarse

    // public void setFecha(LocalDate fecha) {
        // this.fecha = fecha;
    // }

    @Column(name = "retroalimentacion", nullable = true)
    private String retroalimentacion;

    public String getRetroalimentacion() {
        return retroalimentacion;
    }

    public void setRetroalimentacion(String retroalimentacion) {
        this.retroalimentacion = retroalimentacion;
    }

    @PrePersist
    protected void onCreate(){

        // Setear el Estado de la planificación en pendiente, pues aún falta que el profesor la apruebe / rechace
        if (this.estado == null) {
            this.estado = EstadoPlanificacion.PENDIENTE;
        }

        // Establecer la fecha de carga como el momento justo de creación del registro
        // No se puede cambiar
        this.fecha = LocalDate.now();
    }
    
}
