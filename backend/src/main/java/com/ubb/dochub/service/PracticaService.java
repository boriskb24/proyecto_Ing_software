package com.ubb.dochub.service;

import com.ubb.dochub.dto.EvaluacionesResponseDto;
import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.TipoFiltroEvaluacion;
import org.springframework.web.multipart.MultipartFile;

public interface PracticaService {
    // Guardar informe general / estudiante
    InformeEntregaResponse guardarInformeFinal(MultipartFile archivo);

    // Guardar informe asociado a una inscripcion (usado por profesor)
    InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId);

    // Evaluaciones de profesor (Pablo)
    EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, TipoFiltroEvaluacion tipo);
}
