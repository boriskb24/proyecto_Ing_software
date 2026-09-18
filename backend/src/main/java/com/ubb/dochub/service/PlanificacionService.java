package com.ubb.dochub.service;

import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Planificacion;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PlanificacionService {

    Planificacion guardarPlanificacion(MultipartFile archivo, Long userId);

    List<Planificacion> obtenerHistorialPorRol(Long userId, String userRole);

    Planificacion evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion);
}
