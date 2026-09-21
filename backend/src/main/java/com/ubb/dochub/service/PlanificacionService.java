package com.ubb.dochub.service;

import com.ubb.dochub.dto.PlanificacionResponseDto;
import com.ubb.dochub.entity.EstadoPlanificacion;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface PlanificacionService {

    PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId);

    PlanificacionResponseDto guardarPlanificacion(MultipartFile archivo, Long userId, LocalDate fechaClase);

    default List<PlanificacionResponseDto> obtenerHistorialPorRol(Long userId, String userRole) {
        return obtenerHistorialPorRol(userId, userRole, null, null);
    }

    List<PlanificacionResponseDto> obtenerHistorialPorRol(Long userId, String userRole, String email, Long inscripcionId);

    PlanificacionResponseDto evaluarPlanificacion(Long id, EstadoPlanificacion nuevoEstado, String retroalimentacion);
}
