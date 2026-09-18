package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    // Busca inscripciones cuyos offers pertenezcan a un profesor identificado por correo
    List<Inscripcion> findByOfertaProfesorCorreo(String correo);
    // Busca inscripciones que pertenezcan a una oferta específica
    List<Inscripcion> findByOfertaId(Long ofertaId);
    Long countByOfertaId(Long ofertaId);
}
