package com.ubb.dochub.repository;

import com.ubb.dochub.entity.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfertaRepository extends JpaRepository<Oferta, Long> {
    List<Oferta> findByProfesorCorreoOrderByAnioDescPeriodoDesc(String correo);

    @Query("SELECT o FROM Oferta o LEFT JOIN FETCH o.asignaturaPractica LEFT JOIN FETCH o.profesor p WHERE LOWER(p.correo) = LOWER(:correo) ORDER BY o.anio DESC, o.periodo DESC")
    List<Oferta> findByProfesorCorreoIgnoreCaseOrderByAnioDescPeriodoDesc(@Param("correo") String correo);

    @Query("SELECT o FROM Oferta o LEFT JOIN FETCH o.asignaturaPractica LEFT JOIN FETCH o.profesor ORDER BY o.anio DESC, o.periodo DESC")
    List<Oferta> findAllWithDetailsOrderByAnioDescPeriodoDesc();
}
