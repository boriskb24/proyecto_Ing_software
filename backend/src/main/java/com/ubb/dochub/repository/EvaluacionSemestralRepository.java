package com.ubb.dochub.repository;

import com.ubb.dochub.entity.EvaluacionSemestral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EvaluacionSemestralRepository extends JpaRepository<EvaluacionSemestral, Long> {

    @Query("SELECT es FROM EvaluacionSemestral es " +
           "JOIN es.asignacion a " +
           "JOIN a.inscripcion i " +
           "JOIN i.oferta o " +
           "JOIN o.asignaturaPractica asig " +
           "WHERE o.profesor.rut = :rutProfesor")
    List<EvaluacionSemestral> findEvaluacionesPorRutProfesor(@Param("rutProfesor") String rutProfesor);
}