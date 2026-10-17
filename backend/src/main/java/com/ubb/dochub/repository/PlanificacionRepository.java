package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Planificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {

    List<Planificacion> findAllByOrderByFechaDesc();

    List<Planificacion> findAllByOrderByIdDesc();
}
