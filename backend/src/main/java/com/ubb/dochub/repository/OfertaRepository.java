package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfertaRepository extends JpaRepository<Oferta, Long> {
    List<Oferta> findByProfesorCorreoOrderByAnioDescPeriodoDesc(String correo);
}
