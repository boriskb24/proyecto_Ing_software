package com.ubb.dochub.dto;

import java.util.ArrayList;
import java.util.List;

public class EstudianteDetalleResponse {
    private Long inscripcionId;
    private Long ofertaId;
    private String asignaturaCodigo;
    private String asignaturaNombre;
    private int anio;
    private int periodo;

    private String estudianteRut;
    private String estudianteNombre;
    private String estudianteCorreo;
    private String carrera;

    private String profesorGuiaNombre;
    private String profesorGuiaCorreo;

    private String establecimiento;

    private List<EvaluadorItemDto> evaluadores = new ArrayList<>();
    private List<PracticaHistorialItemDto> historialPracticas = new ArrayList<>();
    private InformeItemDto informeActual;

    public EstudianteDetalleResponse() {}

    public Long getInscripcionId() { return inscripcionId; }
    public void setInscripcionId(Long inscripcionId) { this.inscripcionId = inscripcionId; }

    public Long getOfertaId() { return ofertaId; }
    public void setOfertaId(Long ofertaId) { this.ofertaId = ofertaId; }

    public String getAsignaturaCodigo() { return asignaturaCodigo; }
    public void setAsignaturaCodigo(String asignaturaCodigo) { this.asignaturaCodigo = asignaturaCodigo; }

    public String getAsignaturaNombre() { return asignaturaNombre; }
    public void setAsignaturaNombre(String asignaturaNombre) { this.asignaturaNombre = asignaturaNombre; }

    public int getAnio() { return anio; }
    public void setAnio(int anio) { this.anio = anio; }

    public int getPeriodo() { return periodo; }
    public void setPeriodo(int periodo) { this.periodo = periodo; }

    public String getEstudianteRut() { return estudianteRut; }
    public void setEstudianteRut(String estudianteRut) { this.estudianteRut = estudianteRut; }

    public String getEstudianteNombre() { return estudianteNombre; }
    public void setEstudianteNombre(String estudianteNombre) { this.estudianteNombre = estudianteNombre; }

    public String getEstudianteCorreo() { return estudianteCorreo; }
    public void setEstudianteCorreo(String estudianteCorreo) { this.estudianteCorreo = estudianteCorreo; }

    public String getCarrera() { return carrera; }
    public void setCarrera(String carrera) { this.carrera = carrera; }

    public String getProfesorGuiaNombre() { return profesorGuiaNombre; }
    public void setProfesorGuiaNombre(String profesorGuiaNombre) { this.profesorGuiaNombre = profesorGuiaNombre; }

    public String getProfesorGuiaCorreo() { return profesorGuiaCorreo; }
    public void setProfesorGuiaCorreo(String profesorGuiaCorreo) { this.profesorGuiaCorreo = profesorGuiaCorreo; }

    public String getEstablecimiento() { return establecimiento; }
    public void setEstablecimiento(String establecimiento) { this.establecimiento = establecimiento; }

    public List<EvaluadorItemDto> getEvaluadores() { return evaluadores; }
    public void setEvaluadores(List<EvaluadorItemDto> evaluadores) { this.evaluadores = evaluadores; }

    public List<PracticaHistorialItemDto> getHistorialPracticas() { return historialPracticas; }
    public void setHistorialPracticas(List<PracticaHistorialItemDto> historialPracticas) { this.historialPracticas = historialPracticas; }

    public InformeItemDto getInformeActual() { return informeActual; }
    public void setInformeActual(InformeItemDto informeActual) { this.informeActual = informeActual; }

    public static class EvaluadorItemDto {
        private String rut;
        private String nombreCompleto;
        private String primerNombre;
        private String primerApellido;
        private String segundoApellido;
        private String correo;
        private String tipo;

        public EvaluadorItemDto() {}

        public EvaluadorItemDto(String rut, String nombreCompleto, String correo, String tipo) {
            this.rut = rut;
            this.nombreCompleto = nombreCompleto;
            this.correo = correo;
            this.tipo = tipo;
        }

        public EvaluadorItemDto(String rut, String nombreCompleto, String primerNombre, String primerApellido, String segundoApellido, String correo, String tipo) {
            this.rut = rut;
            this.nombreCompleto = nombreCompleto;
            this.primerNombre = primerNombre;
            this.primerApellido = primerApellido;
            this.segundoApellido = segundoApellido;
            this.correo = correo;
            this.tipo = tipo;
        }

        public String getRut() { return rut; }
        public void setRut(String rut) { this.rut = rut; }
        public String getNombreCompleto() { return nombreCompleto; }
        public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
        public String getPrimerNombre() { return primerNombre; }
        public void setPrimerNombre(String primerNombre) { this.primerNombre = primerNombre; }
        public String getPrimerApellido() { return primerApellido; }
        public void setPrimerApellido(String primerApellido) { this.primerApellido = primerApellido; }
        public String getSegundoApellido() { return segundoApellido; }
        public void setSegundoApellido(String segundoApellido) { this.segundoApellido = segundoApellido; }
        public String getCorreo() { return correo; }
        public void setCorreo(String correo) { this.correo = correo; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }

    public static class PracticaHistorialItemDto {
        private Long inscripcionId;
        private Long ofertaId;
        private String asignaturaCodigo;
        private String asignaturaNombre;
        private int anio;
        private int periodo;
        private boolean esActual;
        private String estado;

        public PracticaHistorialItemDto() {}

        public PracticaHistorialItemDto(Long inscripcionId, Long ofertaId, String asignaturaCodigo, String asignaturaNombre, int anio, int periodo, boolean esActual, String estado) {
            this.inscripcionId = inscripcionId;
            this.ofertaId = ofertaId;
            this.asignaturaCodigo = asignaturaCodigo;
            this.asignaturaNombre = asignaturaNombre;
            this.anio = anio;
            this.periodo = periodo;
            this.esActual = esActual;
            this.estado = estado;
        }

        public Long getInscripcionId() { return inscripcionId; }
        public void setInscripcionId(Long inscripcionId) { this.inscripcionId = inscripcionId; }
        public Long getOfertaId() { return ofertaId; }
        public void setOfertaId(Long ofertaId) { this.ofertaId = ofertaId; }
        public String getAsignaturaCodigo() { return asignaturaCodigo; }
        public void setAsignaturaCodigo(String asignaturaCodigo) { this.asignaturaCodigo = asignaturaCodigo; }
        public String getAsignaturaNombre() { return asignaturaNombre; }
        public void setAsignaturaNombre(String asignaturaNombre) { this.asignaturaNombre = asignaturaNombre; }
        public int getAnio() { return anio; }
        public void setAnio(int anio) { this.anio = anio; }
        public int getPeriodo() { return periodo; }
        public void setPeriodo(int periodo) { this.periodo = periodo; }
        public boolean isEsActual() { return esActual; }
        public void setEsActual(boolean esActual) { this.esActual = esActual; }
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
    }

    public static class InformeItemDto {
        private Long id;
        private String archivo;
        private String archivoUrl;
        private String nombreArchivo;
        private String fecha;
        private String emisor;

        public InformeItemDto() {}

        public InformeItemDto(Long id, String archivo, String nombreArchivo, String fecha, String emisor) {
            this(id, archivo, null, nombreArchivo, fecha, emisor);
        }

        public InformeItemDto(Long id, String archivo, String archivoUrl, String nombreArchivo, String fecha, String emisor) {
            this.id = id;
            this.archivo = archivo;
            this.archivoUrl = archivoUrl;
            this.nombreArchivo = nombreArchivo;
            this.fecha = fecha;
            this.emisor = emisor;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getArchivo() { return archivo; }
        public void setArchivo(String archivo) { this.archivo = archivo; }
        public String getArchivoUrl() { return archivoUrl; }
        public void setArchivoUrl(String archivoUrl) { this.archivoUrl = archivoUrl; }
        public String getNombreArchivo() { return nombreArchivo; }
        public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }
        public String getFecha() { return fecha; }
        public void setFecha(String fecha) { this.fecha = fecha; }
        public String getEmisor() { return emisor; }
        public void setEmisor(String emisor) { this.emisor = emisor; }
    }
}

