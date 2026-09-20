package com.ubb.dochub.repository;

import com.ubb.dochub.entity.EvaluacionClase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EvaluacionClaseRepository extends JpaRepository<EvaluacionClase, Long> {

    @Query("SELECT ec FROM EvaluacionClase ec " +
           "JOIN ec.clase c " +
           "JOIN c.inscripcion i " +
           "JOIN i.oferta o " +
           "JOIN o.asignaturaPractica a " +
           "WHERE o.profesor.rut = :rutProfesor")
    List<EvaluacionClase> findEvaluacionesPorRutProfesor(@Param("rutProfesor") String rutProfesor);
}