package com.ubb.dochub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "asignatura_practica")
public class AsignaturaPractica {
    public AsignaturaPractica() {
    }

    public AsignaturaPractica(String codigo, String nombre) {
        this.codigo = codigo;
        this.nombre = nombre;
    }

    @Id
    @Column(name = "codigo", length = 20)
    private String codigo;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    public String getNombre() {
        return nombre;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
