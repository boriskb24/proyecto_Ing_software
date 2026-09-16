package com.ubb.dochub.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "profesor")
public class Profesor {
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
    private String apelidoPaterno;

    public String getApelidoPaterno() {
        return apelidoPaterno;
    }

    public void setApelidoPaterno(String apelidoPaterno) {
        this.apelidoPaterno = apelidoPaterno;
    }

    @Column(name = "apellido_materno", nullable = false)
    private String apellidoMaterno;

    public String getApellidoMaterno() {
        return apellidoMaterno;
    }

    public void setApellidoMaterno(String apellidoMaterno) {
        this.apellidoMaterno = apellidoMaterno;
    }

    @Column(name = "correo", nullable = false, unique = true)
    private String correo;

    @Column(name = "titulo")
    private String titulo;


    public String getRut() {
        return rut;
    }

    public String getCorreo() {
        return correo;
    }

    
    public String getTitulo() {
        return titulo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    
    public void setRut(String rut) {
        this.rut = rut;
    }
    
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }
}
