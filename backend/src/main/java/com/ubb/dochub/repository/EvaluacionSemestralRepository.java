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

    @Query("SELECT es FROM EvaluacionSemestral es " +
           "JOIN es.asignacion a " +
           "JOIN a.inscripcion i " +
           "JOIN i.oferta o " +
           "JOIN o.asignaturaPractica asig " +
           "WHERE (:rutProfesor IS NOT NULL AND o.profesor.rut = :rutProfesor) " +
           "   OR (:correoProfesor IS NOT NULL AND LOWER(o.profesor.correo) = LOWER(:correoProfesor))")
    List<EvaluacionSemestral> findEvaluacionesPorProfesor(
            @Param("rutProfesor") String rutProfesor,
            @Param("correoProfesor") String correoProfesor);

    @Query("SELECT es FROM EvaluacionSemestral es " +
           "JOIN es.asignacion a " +
           "JOIN a.inscripcion i " +
           "JOIN i.oferta o " +
           "JOIN o.asignaturaPractica asig " +
           "WHERE ((:rutProfesor IS NOT NULL AND o.profesor.rut = :rutProfesor) " +
           "    OR (:correoProfesor IS NOT NULL AND LOWER(o.profesor.correo) = LOWER(:correoProfesor))) " +
           "  AND (:rutEstudiante IS NULL OR i.estudiante.rut = :rutEstudiante) " +
           "  AND (:inscripcionId IS NULL OR i.id = :inscripcionId)")
    List<EvaluacionSemestral> findEvaluacionesPorProfesor(
            @Param("rutProfesor") String rutProfesor,
            @Param("correoProfesor") String correoProfesor,
            @Param("rutEstudiante") String rutEstudiante,
            @Param("inscripcionId") Long inscripcionId);

    @Query("SELECT es FROM EvaluacionSemestral es " +
           "JOIN es.asignacion a " +
           "JOIN a.inscripcion i " +
           "WHERE i.id = :inscripcionId")
    List<EvaluacionSemestral> findByInscripcionId(@Param("inscripcionId") Long inscripcionId);

    @Query("SELECT es FROM EvaluacionSemestral es " +
           "JOIN es.asignacion a " +
           "JOIN a.inscripcion i " +
           "WHERE ((:correo IS NOT NULL AND LOWER(i.estudiante.correo) = LOWER(:correo)) " +
           "    OR (:rut IS NOT NULL AND i.estudiante.rut = :rut)) " +
           "  AND (:inscripcionId IS NULL OR i.id = :inscripcionId) " +
           "ORDER BY es.fecha DESC")
    List<EvaluacionSemestral> findEvaluacionesPorEstudiante(
            @Param("correo") String correo,
            @Param("rut") String rut,
            @Param("inscripcionId") Long inscripcionId);
}