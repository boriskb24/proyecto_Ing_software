package com.ubb.dochub.config;

import com.ubb.dochub.entity.*;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String DEFAULT_PASSWORD = "12345678b";

    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            EntityManager entityManager,
            PasswordEncoder passwordEncoder
    ) {
        this.entityManager = entityManager;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        System.out.println("==========================================");
        System.out.println("INICIALIZANDO BASE DE DATOS DOCHUB");
        System.out.println("==========================================");

        /*
         * ==========================================================
         * 1. PERSONAS
         * ==========================================================
         */

        Profesor profesor = crearProfesor(
                "33333333-3",
                "Boris",
                "Alejandro",
                "Arenas",
                "Quezada",
                "boris.profe@ubiobio.cl",
                "Ingeniero Civil Informático"
        );

        Estudiante estudiante1 = crearEstudiante(
                "20555555-5",
                "Diego",
                "Andrés",
                "Martínez",
                "Soto",
                "diego.martinez@ubiobio.cl"
        );

        Estudiante estudiante2 = crearEstudiante(
                "20666666-6",
                "Valentina",
                "Isabel",
                "Rojas",
                "Pérez",
                "valentina.rojas@ubiobio.cl"
        );

        Estudiante estudiante3 = crearEstudiante(
                "20777777-7",
                "Sebastián",
                "Ignacio",
                "Fuentes",
                "Díaz",
                "sebastian.fuentes@ubiobio.cl"
        );

        Evaluador evaluador1 = crearEvaluador(
                "44444444-4",
                "Carlos",
                "Andrés",
                "Muñoz",
                "Vega",
                "carlos.munoz@ubiobio.cl",
                TipoEvaluador.TUTOR
        );

        Evaluador evaluador2 = crearEvaluador(
                "55555555-5",
                "María",
                "José",
                "Contreras",
                "Rivas",
                "maria.contreras@ubiobio.cl",
                TipoEvaluador.COLABORADOR
        );

        /*
         * ==========================================================
         * 2. ASIGNATURAS DE PRÁCTICA
         * ==========================================================
         */

        AsignaturaPractica asignatura = crearAsignatura(
                "INF-403",
                "Práctica Profesional"
        );

        /*
         * ==========================================================
         * 3. OFERTA
         * ==========================================================
         */

        Oferta oferta = crearOferta(
                2026,
                1,
                asignatura,
                profesor
        );

        /*
         * ==========================================================
         * 4. INSCRIPCIONES
         * ==========================================================
         */

        Inscripcion inscripcion1 = crearInscripcion(
                oferta,
                estudiante1
        );

        Inscripcion inscripcion2 = crearInscripcion(
                oferta,
                estudiante2
        );

        Inscripcion inscripcion3 = crearInscripcion(
                oferta,
                estudiante3
        );

        /*
         * ==========================================================
         * 5. PLANIFICACIONES
         * ==========================================================
         */

        Planificacion planificacion1 = crearPlanificacion(
                "/uploads/planificaciones/diego-planificacion.pdf",
                EstadoPlanificacion.APROBADA,
                "Planificación de clase de ecuaciones cuadráticas."
        );

        Planificacion planificacion2 = crearPlanificacion(
                "/uploads/planificaciones/valentina-planificacion.pdf",
                EstadoPlanificacion.PENDIENTE,
                null
        );

        Planificacion planificacion3 = crearPlanificacion(
                "/uploads/planificaciones/sebastian-planificacion.pdf",
                EstadoPlanificacion.RECHAZADA,
                "Debe incorporar una actividad de cierre."
        );

        /*
         * ==========================================================
         * 6. CLASES
         * ==========================================================
         */

        Clase clase1 = crearClase(
                "Matemática",
                "Ecuaciones cuadráticas",
                planificacion1,
                inscripcion1,
                LocalDate.of(2026, 9, 10),
                LocalTime.of(10, 0),
                LocalTime.of(11, 30)
        );

        Clase clase2 = crearClase(
                "Matemática",
                "Funciones lineales",
                planificacion2,
                inscripcion2,
                LocalDate.of(2026, 9, 11),
                LocalTime.of(10, 0),
                LocalTime.of(11, 30)
        );

        Clase clase3 = crearClase(
                "Orientación",
                "Convivencia escolar",
                planificacion3,
                inscripcion3,
                LocalDate.of(2026, 9, 12),
                LocalTime.of(12, 0),
                LocalTime.of(13, 30)
        );

        /*
         * ==========================================================
         * 7. ASIGNACIONES DE EVALUADORES
         * ==========================================================
         */

        Asignacion asignacion1 = crearAsignacion(
                inscripcion1,
                evaluador1
        );

        Asignacion asignacion2 = crearAsignacion(
                inscripcion2,
                evaluador1
        );

        Asignacion asignacion3 = crearAsignacion(
                inscripcion3,
                evaluador2
        );

        /*
         * ==========================================================
         * 8. EVALUACIONES DE CLASE
         * ==========================================================
         */

        crearEvaluacionClase(
                "/uploads/evaluaciones-clase/diego-clase-1.pdf",
                clase1,
                evaluador1
        );

        crearEvaluacionClase(
                "/uploads/evaluaciones-clase/valentina-clase-1.pdf",
                clase2,
                evaluador1
        );

        crearEvaluacionClase(
                "/uploads/evaluaciones-clase/sebastian-clase-1.pdf",
                clase3,
                evaluador2
        );

        /*
         * ==========================================================
         * 9. EVALUACIONES SEMESTRALES
         * ==========================================================
         *
         * Deshabilitadas porque la entidad genera automáticamente
         * la fecha mediante @PrePersist.
         */

        /*
        crearEvaluacionSemestral(
                "/uploads/evaluaciones-semestrales/diego-matematica-1.pdf",
                asignacion1,
                "Matemática",
                LocalDate.of(2026, 9, 5)
        );

        crearEvaluacionSemestral(
                "/uploads/evaluaciones-semestrales/diego-orientacion-1.pdf",
                asignacion1,
                "Orientación",
                LocalDate.of(2026, 9, 6)
        );

        crearEvaluacionSemestral(
                "/uploads/evaluaciones-semestrales/valentina-matematica-1.pdf",
                asignacion2,
                "Matemática",
                LocalDate.of(2026, 9, 7)
        );

        crearEvaluacionSemestral(
                "/uploads/evaluaciones-semestrales/valentina-orientacion-1.pdf",
                asignacion2,
                "Orientación",
                LocalDate.of(2026, 9, 8)
        );
        */

        /*
         * ==========================================================
         * 10. INFORMES FINALES
         * ==========================================================
         */

        crearInforme(
                TipoEmisor.PROFESOR,
                "/uploads/informes/diego-informe-final.pdf",
                inscripcion1
        );

        crearInforme(
                TipoEmisor.PROFESOR,
                "/uploads/informes/valentina-informe-final.pdf",
                inscripcion2
        );

        /*
         * ==========================================================
         * 11. USUARIOS
         *
         * User utiliza EMAIL como identificador de login.
         *
         * No se crean administradores.
         * Las cuentas corresponden únicamente a personas que
         * existen en las tablas Profesor, Estudiante y Evaluador.
         * ==========================================================
         */

        // ----------------------------------------------------------
        // PROFESOR
        // ----------------------------------------------------------

        crearUsuario(
                nombreCompleto(
                        profesor.getPrimerNombre(),
                        profesor.getSegundoNombre(),
                        profesor.getApellidoPaterno(),
                        profesor.getApellidoMaterno()
                ),
                profesor.getCorreo()
        );

        // ----------------------------------------------------------
        // ESTUDIANTES
        // ----------------------------------------------------------

        crearUsuario(
                nombreCompleto(
                        estudiante1.getPrimerNombre(),
                        estudiante1.getSegundoNombre(),
                        estudiante1.getApellidoPaterno(),
                        estudiante1.getApellidoMaterno()
                ),
                estudiante1.getCorreo()
        );

        crearUsuario(
                nombreCompleto(
                        estudiante2.getPrimerNombre(),
                        estudiante2.getSegundoNombre(),
                        estudiante2.getApellidoPaterno(),
                        estudiante2.getApellidoMaterno()
                ),
                estudiante2.getCorreo()
        );

        crearUsuario(
                nombreCompleto(
                        estudiante3.getPrimerNombre(),
                        estudiante3.getSegundoNombre(),
                        estudiante3.getApellidoPaterno(),
                        estudiante3.getApellidoMaterno()
                ),
                estudiante3.getCorreo()
        );

        // ----------------------------------------------------------
        // EVALUADORES
        // ----------------------------------------------------------

        crearUsuario(
                nombreCompleto(
                        evaluador1.getPrimerNombre(),
                        evaluador1.getSegundoNombre(),
                        evaluador1.getApellidoPaterno(),
                        evaluador1.getApellidoMaterno()
                ),
                evaluador1.getCorreo()
        );

        crearUsuario(
                nombreCompleto(
                        evaluador2.getPrimerNombre(),
                        evaluador2.getSegundoNombre(),
                        evaluador2.getApellidoPaterno(),
                        evaluador2.getApellidoMaterno()
                ),
                evaluador2.getCorreo()
        );

        System.out.println("==========================================");
        System.out.println("BASE DE DATOS INICIALIZADA CORRECTAMENTE");
        System.out.println("==========================================");
    }


    // =============================================================
    // ESTUDIANTE
    // =============================================================

    private Estudiante crearEstudiante(
            String rut,
            String primerNombre,
            String segundoNombre,
            String apellidoPaterno,
            String apellidoMaterno,
            String correo
    ) {

        Estudiante existente = entityManager.find(
                Estudiante.class,
                rut
        );

        if (existente != null) {
            return existente;
        }

        Estudiante estudiante = new Estudiante(
                rut,
                primerNombre,
                segundoNombre,
                apellidoPaterno,
                apellidoMaterno,
                correo
        );

        entityManager.persist(estudiante);

        return estudiante;
    }


    // =============================================================
    // PROFESOR
    // =============================================================

    private Profesor crearProfesor(
            String rut,
            String primerNombre,
            String segundoNombre,
            String apellidoPaterno,
            String apellidoMaterno,
            String correo,
            String titulo
    ) {

        Profesor existente = entityManager.find(
                Profesor.class,
                rut
        );

        if (existente != null) {
            return existente;
        }

        Profesor profesor = new Profesor(
                rut,
                primerNombre,
                segundoNombre,
                apellidoPaterno,
                apellidoMaterno,
                correo,
                titulo
        );

        entityManager.persist(profesor);

        return profesor;
    }


    // =============================================================
    // EVALUADOR
    // =============================================================

    private Evaluador crearEvaluador(
            String rut,
            String primerNombre,
            String segundoNombre,
            String apellidoPaterno,
            String apellidoMaterno,
            String correo,
            TipoEvaluador tipo
    ) {

        Evaluador existente = entityManager.find(
                Evaluador.class,
                rut
        );

        if (existente != null) {
            return existente;
        }

        Evaluador evaluador = new Evaluador(
                rut,
                primerNombre,
                segundoNombre,
                apellidoPaterno,
                apellidoMaterno,
                correo,
                tipo
        );

        entityManager.persist(evaluador);

        return evaluador;
    }


    // =============================================================
    // ASIGNATURA
    // =============================================================

    private AsignaturaPractica crearAsignatura(
            String codigo,
            String nombre
    ) {

        AsignaturaPractica existente = entityManager.find(
                AsignaturaPractica.class,
                codigo
        );

        if (existente != null) {
            return existente;
        }

        AsignaturaPractica asignatura =
                new AsignaturaPractica(codigo, nombre);

        entityManager.persist(asignatura);

        return asignatura;
    }


    // =============================================================
    // OFERTA
    // =============================================================

    private Oferta crearOferta(
            int anio,
            int periodo,
            AsignaturaPractica asignatura,
            Profesor profesor
    ) {

        List<Oferta> resultados = entityManager
                .createQuery(
                        """
                        SELECT o
                        FROM Oferta o
                        WHERE o.anio = :anio
                          AND o.periodo = :periodo
                          AND o.asignaturaPractica = :asignatura
                        """,
                        Oferta.class
                )
                .setParameter("anio", anio)
                .setParameter("periodo", periodo)
                .setParameter("asignatura", asignatura)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        Oferta oferta = new Oferta(
                anio,
                periodo,
                asignatura
        );

        oferta.setProfesor(profesor);

        entityManager.persist(oferta);

        return oferta;
    }


    // =============================================================
    // INSCRIPCION
    // =============================================================

    private Inscripcion crearInscripcion(
            Oferta oferta,
            Estudiante estudiante
    ) {

        List<Inscripcion> resultados = entityManager
                .createQuery(
                        """
                        SELECT i
                        FROM Inscripcion i
                        WHERE i.oferta = :oferta
                          AND i.estudiante = :estudiante
                        """,
                        Inscripcion.class
                )
                .setParameter("oferta", oferta)
                .setParameter("estudiante", estudiante)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        Inscripcion inscripcion =
                new Inscripcion(oferta, estudiante);

        entityManager.persist(inscripcion);

        return inscripcion;
    }


    // =============================================================
    // PLANIFICACION
    // =============================================================

    private Planificacion crearPlanificacion(
            String archivo,
            EstadoPlanificacion estado,
            String retroalimentacion
    ) {

        List<Planificacion> resultados = entityManager
                .createQuery(
                        """
                        SELECT p
                        FROM Planificacion p
                        WHERE p.archivo = :archivo
                        """,
                        Planificacion.class
                )
                .setParameter("archivo", archivo)
                .getResultList();

        if (!resultados.isEmpty()) {

            Planificacion existente = resultados.get(0);

            existente.setEstado(estado);
            existente.setRetroalimentacion(retroalimentacion);

            return existente;
        }

        Planificacion planificacion =
                new Planificacion(archivo);

        planificacion.setEstado(estado);
        planificacion.setRetroalimentacion(retroalimentacion);

        entityManager.persist(planificacion);

        return planificacion;
    }


    // =============================================================
    // CLASE
    // =============================================================

    private Clase crearClase(
            String asignatura,
            String tema,
            Planificacion planificacion,
            Inscripcion inscripcion,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin
    ) {

        List<Clase> resultados = entityManager
                .createQuery(
                        """
                        SELECT c
                        FROM Clase c
                        WHERE c.fecha = :fecha
                          AND c.horaInicio = :horaInicio
                          AND c.inscripcion = :inscripcion
                        """,
                        Clase.class
                )
                .setParameter("fecha", fecha)
                .setParameter("horaInicio", horaInicio)
                .setParameter("inscripcion", inscripcion)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        Clase clase = new Clase(
                asignatura,
                tema,
                planificacion,
                inscripcion,
                horaInicio
        );

        clase.setFecha(fecha);
        clase.setHoraFin(horaFin);

        entityManager.persist(clase);

        return clase;
    }


    // =============================================================
    // ASIGNACION
    // =============================================================

    private Asignacion crearAsignacion(
            Inscripcion inscripcion,
            Evaluador evaluador
    ) {

        List<Asignacion> resultados = entityManager
                .createQuery(
                        """
                        SELECT a
                        FROM Asignacion a
                        WHERE a.inscripcion = :inscripcion
                          AND a.evaluador = :evaluador
                        """,
                        Asignacion.class
                )
                .setParameter("inscripcion", inscripcion)
                .setParameter("evaluador", evaluador)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        Asignacion asignacion =
                new Asignacion(inscripcion, evaluador);

        entityManager.persist(asignacion);

        return asignacion;
    }


    // =============================================================
    // EVALUACION DE CLASE
    // =============================================================

    private EvaluacionClase crearEvaluacionClase(
            String archivo,
            Clase clase,
            Evaluador evaluador
    ) {

        List<EvaluacionClase> resultados = entityManager
                .createQuery(
                        """
                        SELECT e
                        FROM EvaluacionClase e
                        WHERE e.archivo = :archivo
                        """,
                        EvaluacionClase.class
                )
                .setParameter("archivo", archivo)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        EvaluacionClase evaluacion =
                new EvaluacionClase(
                        archivo,
                        clase,
                        evaluador
                );

        entityManager.persist(evaluacion);

        return evaluacion;
    }


    // =============================================================
    // EVALUACION SEMESTRAL
    // =============================================================

    private EvaluacionSemestral crearEvaluacionSemestral(
            String archivo,
            Asignacion asignacion,
            String asignatura,
            LocalDate fecha
    ) {

        List<EvaluacionSemestral> resultados = entityManager
                .createQuery(
                        """
                        SELECT e
                        FROM EvaluacionSemestral e
                        WHERE e.fecha = :fecha
                          AND e.asignatura = :asignatura
                        """,
                        EvaluacionSemestral.class
                )
                .setParameter("fecha", fecha)
                .setParameter("asignatura", asignatura)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        EvaluacionSemestral evaluacion =
                new EvaluacionSemestral(
                        archivo,
                        asignacion,
                        asignatura
                );

        entityManager.persist(evaluacion);

        return evaluacion;
    }


    // =============================================================
    // INFORME
    // =============================================================

    private Informe crearInforme(
            TipoEmisor emisor,
            String archivo,
            Inscripcion inscripcion
    ) {

        List<Informe> resultados = entityManager
                .createQuery(
                        """
                        SELECT i
                        FROM Informe i
                        WHERE i.archivo = :archivo
                        """,
                        Informe.class
                )
                .setParameter("archivo", archivo)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        Informe informe =
                new Informe(
                        emisor,
                        archivo,
                        inscripcion
                );

        entityManager.persist(informe);

        return informe;
    }


    // =============================================================
    // USERS
    // =============================================================

    private User crearUsuario(
            String nombreCompleto,
            String email
    ) {

        List<User> resultados = entityManager
                .createQuery(
                        """
                        SELECT u
                        FROM User u
                        WHERE LOWER(u.email) = LOWER(:email)
                        """,
                        User.class
                )
                .setParameter("email", email)
                .getResultList();

        if (!resultados.isEmpty()) {
            return resultados.get(0);
        }

        User usuario = new User();

        usuario.setFullName(nombreCompleto);
        usuario.setEmail(email);
        usuario.setPassword(
                passwordEncoder.encode(DEFAULT_PASSWORD)
        );

        entityManager.persist(usuario);

        return usuario;
    }


    // =============================================================
    // UTILIDADES
    // =============================================================

    private String nombreCompleto(
            String primerNombre,
            String segundoNombre,
            String apellidoPaterno,
            String apellidoMaterno
    ) {

        return String.join(
                " ",
                primerNombre,
                segundoNombre,
                apellidoPaterno,
                apellidoMaterno
        ).replaceAll("\\s+", " ").trim();
    }
}