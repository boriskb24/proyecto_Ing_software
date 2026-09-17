package com.ubb.dochub.service;

import com.ubb.dochub.dto.InformeEntregaResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PracticaService {
    InformeEntregaResponse guardarInformeFinal(MultipartFile archivo);

    // Guardar informe asociado a una inscripcion (usado por profesor)
    InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId);
}
