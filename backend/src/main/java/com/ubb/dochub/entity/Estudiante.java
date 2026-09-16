package com.ubb.dochub.entity;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "estudiante")
public class Estudiante {

    public Estudiante() {
    }
    
    public Estudiante(String rut, String primerNombre, String segundoNombre, String apellidoPaterno,
            String apellidoMaterno, String correo) {
        this.rut = rut;
        this.primerNombre = primerNombre;
        this.segundoNombre = segundoNombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.correo = correo;
    }

    @Id
    @Column(name = "rut", length = 20)
    private String rut;

    @Column(name = "primer_nombre", nullable = false)
    private String primerNombre;

    @Column(name = "segundo_nombre", nullable = false)
    private String segundoNombre;

    @Column(name = "apellido_paterno", nullable = false)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", nullable = false)
    private String apellidoMaterno;

    @Column(name = "correo", nullable = false, unique = true)
    private String correo;


    public String getCorreo() {
        return correo;
    }

    public String getPrimerNombre() {
        return primerNombre;
    }

    public String getRut() {
        return rut;
    }

    public String getSegundoNombre() {
        return segundoNombre;
    }

    public String getApellidoPaterno() {
        return apellidoPaterno;
    }

    public String getApellidoMaterno() {
        return apellidoMaterno;
    }

    public void setApellidoPaterno(String apelidoPaterno) {
        this.apellidoPaterno = apelidoPaterno;
    }

    public void setApellidoMaterno(String apellidoMaterno) {
        this.apellidoMaterno = apellidoMaterno;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public void setPrimerNombre(String primerNombre) {
        this.primerNombre = primerNombre;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public void setSegundoNombre(String segundoNombre) {
        this.segundoNombre = segundoNombre;
    }
}

