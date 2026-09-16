package com.ubb.dochub.service;

import com.ubb.dochub.entity.Planificacion;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PlanificacionService {

    Planificacion guardarPlanificacion(MultipartFile archivo);

    List<Planificacion> obtenerTodas();
}
