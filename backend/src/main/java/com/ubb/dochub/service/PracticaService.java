package com.ubb.dochub.service;

import com.ubb.dochub.dto.*;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PracticaService {

    // 1. Informes
    InformeEntregaResponse guardarInformeFinal(MultipartFile archivo);

    InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId);

    InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId, String userEmail);

    InformeEntregaResponse guardarInformeFinalEstudiante(MultipartFile archivo, String correoEstudiante, Long userId);

    InformeEntregaResponse obtenerUltimoInformeEstudiante(String email);

    ResponseEntity<Resource> verArchivoInforme(Long informeId, String userEmail);

    // 2. Evaluaciones
    default EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, TipoFiltroEvaluacion tipo) {
        return obtenerEvaluacionesPorProfesor(rutProfesor, null, null, null, tipo);
    }

    default EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, String correoProfesor, TipoFiltroEvaluacion tipo) {
        return obtenerEvaluacionesPorProfesor(rutProfesor, correoProfesor, null, null, tipo);
    }

    EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, String correoProfesor, String rutEstudiante, Long inscripcionId, TipoFiltroEvaluacion tipo);

    EvaluacionesResponseDto obtenerEvaluacionesPorEstudiante(String correoEstudiante, String rutEstudiante, Long inscripcionId, TipoFiltroEvaluacion tipo);

    ResponseEntity<Resource> verArchivoEvaluacionClase(Long evaluacionClaseId, String userEmail);

    ResponseEntity<Resource> verArchivoEvaluacionSemestral(Long evaluacionSemestralId, String userEmail);

    // 3. Ofertas e Inscripciones
    List<InscripcionResponse> listarInscripcionesPorProfesor(String profesorEmail);

    List<OfertaResponse> listarOfertas(String userEmail);

    OfertaResponse getOfertaById(Long ofertaId, String userEmail);

    List<InscripcionResponse> listarInscripcionesPorOferta(Long ofertaId, String userEmail);

    // 4. Directorio y Fichas de Estudiantes
    EstudianteDetalleResponse getDetalleInscripcion(Long inscripcionId, String userEmail);

    List<EstudianteDirectorioDto> listarDirectorioAlumnos(String userEmail);

    EstudianteDetalleResponse getDetallePorRutEstudiante(String rut, String userEmail);

    EstudianteDetalleResponse getDetallePorCorreoEstudiante(String correo, String userEmail);

    // 5. Invariantes y Reglas de Negocio
    void validarInscripcionUnicaPorPeriodo(String rutEstudiante, String correoEstudiante, Integer anio, Integer periodo);

    void validarAsignacionEvaluador(Long inscripcionId, String rutEvaluador);
}
