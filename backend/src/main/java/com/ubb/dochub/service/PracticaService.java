package com.ubb.dochub.service;

import com.ubb.dochub.dto.InformeEntregaResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PracticaService {
    InformeEntregaResponse guardarInformeFinal(MultipartFile archivo);
}
