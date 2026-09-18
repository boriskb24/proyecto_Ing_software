package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Planificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {

    // 1. Docentes/Admin: Obtener todas las planificaciones ordenadas por fecha reciente
    List<Planificacion> findAllByOrderByFechaDesc();

    // 2. Estudiante: Filtro RBAC WHERE user_id = ?
    List<Planificacion> findByUsuarioIdOrderByFechaDesc(Long userId);

    List<Planificacion> findByUsuarioEmailOrderByFechaDesc(String email);
}
