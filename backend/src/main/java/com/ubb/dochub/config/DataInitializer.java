package com.ubb.dochub.config;

import com.ubb.dochub.entity.Asignacion;
import com.ubb.dochub.entity.AsignaturaPractica;
import com.ubb.dochub.entity.Clase;
import com.ubb.dochub.entity.EstadoPlanificacion;
import com.ubb.dochub.entity.Estudiante;
import com.ubb.dochub.entity.EvaluacionClase;
import com.ubb.dochub.entity.EvaluacionSemestral;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.entity.Oferta;
import com.ubb.dochub.entity.Planificacion;
import com.ubb.dochub.entity.Profesor;
import com.ubb.dochub.entity.User;
import com.ubb.dochub.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           EntityManager entityManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User admin = userRepository.findByEmail("admin@ubiobio.cl").orElse(new User());
        admin.setFullName("Prof. Boris Arenas");
        admin.setEmail("admin@ubiobio.cl");
        admin.setPassword(passwordEncoder.encode("12345678b"));
        userRepository.save(admin);
        System.out.println("✅ Usuario administrador listo: admin@ubiobio.cl / 12345678b");

        String rutProfesor = "12345678-9";
        if (entityManager.find(Profesor.class, rutProfesor) != null) {
            return;
        }

        Profesor profesor = new Profesor();
        profesor.setRut(rutProfesor);
        profesor.setPrimerNombre("Maria");
        profesor.setSegundoNombre("Jose");
        profesor.setApelidoPaterno("Gonzalez");
        profesor.setApellidoMaterno("Soto");
        profesor.setCorreo("maria.gonzalez@ubiobio.cl");
        profesor.setTitulo("Profesora de Educacion General Basica");
        entityManager.persist(profesor);

        Estudiante ana = crearEstudiante(
            "21.111.111-1", "Ana", "Sofia", "Perez", "Rojas",
            "ana.perez@alumnos.ubiobio.cl");
        Estudiante bruno = crearEstudiante(
            "21.222.222-2", "Bruno", "Andres", "Munoz", "Vega",
            "bruno.munoz@alumnos.ubiobio.cl");
        Estudiante carla = crearEstudiante(
            "21.333.333-3", "Carla", "Isabel", "Contreras", "Diaz",
            "carla.contreras@alumnos.ubiobio.cl");

        AsignaturaPractica asignatura = new AsignaturaPractica();
        asignatura.setCodigo("MAT-PRA");
        asignatura.setNombre("Matematica");
        entityManager.persist(asignatura);

        Oferta oferta = new Oferta();
        oferta.setAnio(2026);
        oferta.setPeriodo(2);
        oferta.setAsignaturaPractica(asignatura);
        oferta.setProfesor(profesor);
        entityManager.persist(oferta);

        Inscripcion inscripcionAna = crearInscripcion(oferta, ana);
        Inscripcion inscripcionBruno = crearInscripcion(oferta, bruno);
        Inscripcion inscripcionCarla = crearInscripcion(oferta, carla);

        Asignacion asignacionAna = crearAsignacion(inscripcionAna);
        Asignacion asignacionBruno = crearAsignacion(inscripcionBruno);

        Planificacion planAna = crearPlanificacion(
            "/seed/planificacion-ana.pdf", EstadoPlanificacion.APROBADA);
        Planificacion planBruno = crearPlanificacion(
            "/seed/planificacion-bruno.pdf", EstadoPlanificacion.APROBADA);
        Planificacion planCarla = crearPlanificacion(
            "/seed/planificacion-carla.pdf", EstadoPlanificacion.PENDIENTE);

        Clase claseAna = crearClase(
            "Ecuaciones cuadraticas", planAna, inscripcionAna,
            LocalDate.of(2026, 9, 8), LocalTime.of(9, 0), LocalTime.of(10, 30));
        Clase claseBruno = crearClase(
            "Fracciones y proporciones", planBruno, inscripcionBruno,
            LocalDate.of(2026, 9, 9), LocalTime.of(11, 0), LocalTime.of(12, 30));
        Clase claseCarla = crearClase(
            "Resolucion de problemas", planCarla, inscripcionCarla,
            LocalDate.of(2026, 9, 10), LocalTime.of(14, 0), LocalTime.of(15, 30));

        crearEvaluacionClase(
            claseAna, 6.5, "Excelente participacion.",
            LocalDateTime.of(2026, 9, 8, 10, 45));
        crearEvaluacionClase(
            claseBruno, 5.8, "Debe justificar mejor sus procedimientos.",
            LocalDateTime.of(2026, 9, 9, 12, 45));
        crearEvaluacionClase(
            claseCarla, 6.1, "Buen progreso.",
            LocalDateTime.of(2026, 9, 10, 15, 45));

        crearEvaluacionSemestral(
            asignacionAna, "Matematica", 6.2,
            "Cumple los objetivos del semestre.");
        crearEvaluacionSemestral(
            asignacionBruno, "Orientacion", 6.0,
            "Participacion constante.");

        entityManager.flush();
        System.out.println("Datos de evaluaciones listos para el profesor: " + rutProfesor);
    }

        private Estudiante crearEstudiante(
            String rut,
            String primerNombre,
            String segundoNombre,
            String apellidoPaterno,
            String apellidoMaterno,
            String correo) {
        Estudiante estudiante = new Estudiante();
        estudiante.setRut(rut);
        estudiante.setPrimerNombre(primerNombre);
        estudiante.setSegundoNombre(segundoNombre);
        estudiante.setApelidoPaterno(apellidoPaterno);
        estudiante.setApellidoMaterno(apellidoMaterno);
        estudiante.setCorreo(correo);
        entityManager.persist(estudiante);
        return estudiante;
        }

        private Inscripcion crearInscripcion(Oferta oferta, Estudiante estudiante) {
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setOferta(oferta);
        inscripcion.setEstudiante(estudiante);
        entityManager.persist(inscripcion);
        return inscripcion;
        }

        private Asignacion crearAsignacion(Inscripcion inscripcion) {
        Asignacion asignacion = new Asignacion();
        asignacion.setInscripcion(inscripcion);
        entityManager.persist(asignacion);
        return asignacion;
        }

        private Planificacion crearPlanificacion(String archivo, EstadoPlanificacion estado) {
        Planificacion planificacion = new Planificacion();
        planificacion.setArchivo(archivo);
        planificacion.setEstado(estado);
        entityManager.persist(planificacion);
        return planificacion;
        }

        private Clase crearClase(
            String tema,
            Planificacion planificacion,
            Inscripcion inscripcion,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin) {
        Clase clase = new Clase();
        clase.setAsignatura("Matematica");
        clase.setTema(tema);
        clase.setPlanificacion(planificacion);
        clase.setInscripcion(inscripcion);
        clase.setFecha(fecha);
        clase.setHoraInicio(horaInicio);
        clase.setHoraFin(horaFin);
        entityManager.persist(clase);
        return clase;
        }

        private void crearEvaluacionClase(
            Clase clase,
            Double nota,
            String observaciones,
            LocalDateTime fecha) {
        EvaluacionClase evaluacion = new EvaluacionClase();
        evaluacion.setArchivo("/seed/evaluacion-clase.pdf");
        evaluacion.setClase(clase);
        evaluacion.setNota(nota);
        evaluacion.setObservaciones(observaciones);
        evaluacion.setFecha(fecha);
        entityManager.persist(evaluacion);
        }

        private void crearEvaluacionSemestral(
            Asignacion asignacion,
            String asignatura,
            Double nota,
            String observaciones) {
        EvaluacionSemestral evaluacion = new EvaluacionSemestral();
        evaluacion.setArchivo("/seed/evaluacion-semestral.pdf");
        evaluacion.setAsignacion(asignacion);
        evaluacion.setAsignatura(asignatura);
        evaluacion.setNota(nota);
        evaluacion.setObservaciones(observaciones);
        entityManager.persist(evaluacion);
        }
}
