package com.ubb.dochub.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "informe")
public class Informe {
    public Informe() {
    }

    public Informe(TipoEmisor emisor, String archivo, Inscripcion inscripcion) {
        this.emisor = emisor;
        this.archivo = archivo;
        this.inscripcion = inscripcion;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "emisor")
    private TipoEmisor emisor;

    @Column(name = "archivo", nullable = false)
    private String archivo;

    // Campo de solo lectura, inmutable
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    // Se ejecuta automáticamente antes de insertar el registro en la BD
    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDate.now(); 
    }

    @ManyToOne(fetch =  FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion", nullable = false)
    private Inscripcion inscripcion; // La inscripción a la que hace referencia este informe.

    // --- SOLO GETTER (Sin setFecha para garantizar inmutabilidad) ---
    public LocalDate getFecha() {
        return fecha;
    }

    public Long getId() {
        return id;
    }

    public TipoEmisor getEmisor() {
        return emisor;
    }

    public void setEmisor(TipoEmisor emisor) {
        this.emisor = emisor;
    }

    public String getArchivo() {
        return archivo;
    }

    public void setArchivo(String archivo) {
        this.archivo = archivo;
    }

    public Inscripcion getInscripcion() {
        return inscripcion;
    }

    public void setInscripcion(Inscripcion inscripcion) {
        this.inscripcion = inscripcion;
    }
}
