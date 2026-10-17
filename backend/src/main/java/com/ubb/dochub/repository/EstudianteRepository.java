package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EstudianteRepository extends JpaRepository<Estudiante, String> {
    Optional<Estudiante> findByCorreo(String correo);
}

