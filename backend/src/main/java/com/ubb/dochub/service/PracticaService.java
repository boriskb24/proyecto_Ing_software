package com.ubb.dochub.service;

import com.ubb.dochub.dto.EvaluacionesResponseDto;
import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.TipoFiltroEvaluacion;
import org.springframework.web.multipart.MultipartFile;

public interface PracticaService {
    InformeEntregaResponse guardarInformeFinal(MultipartFile archivo);
    EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, TipoFiltroEvaluacion tipo);
}