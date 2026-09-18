package com.ubb.dochub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluador")
public class Evaluador {

    public Evaluador() {
    }

    public Evaluador(String rut, String primerNombre, String segundoNombre, String apellidoPaterno,
            String apellidoMaterno, String correo, TipoEvaluador tipo) {
        this.rut = rut;
        this.primerNombre = primerNombre;
        this.segundoNombre = segundoNombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.correo = correo;
        this.tipo = tipo;
    }

    @Id
    @Column(name = "rut", length = 20)
    private String rut;

    @Column(name = "primer_nombre", nullable = false)
    private String primerNombre;
    
    public String getPrimerNombre() {
        return primerNombre;
    }

    public void setPrimerNombre(String primerNombre) {
        this.primerNombre = primerNombre;
    }

    @Column(name = "segundo_nombre", nullable = false)
    private String segundoNombre;
    
    public String getSegundoNombre() {
        return segundoNombre;
    }

    public void setSegundoNombre(String segundoNombre) {
        this.segundoNombre = segundoNombre;
    }

    @Column(name = "apellido_paterno", nullable = false)
    private String apellidoPaterno;
    
    public String getApellidoPaterno() {
        return apellidoPaterno;
    }

    public void setApellidoPaterno(String apellidoPaterno) {
        this.apellidoPaterno = apellidoPaterno;
    }

    @Column(name = "apellido_materno", nullable = false)
    private String apellidoMaterno;

    public String getApellidoMaterno() {
        return apellidoMaterno;
    }

    public void setApellidoMaterno(String apellidoMaterno) {
        this.apellidoMaterno = apellidoMaterno;
    }

    @Column(name = "correo", nullable = false)
    private String correo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoEvaluador tipo;
    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }
}
