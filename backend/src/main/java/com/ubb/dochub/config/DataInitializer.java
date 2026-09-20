package com.ubb.dochub.config;

import com.ubb.dochub.entity.*;
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
        System.out.println("==========================================");
        System.out.println("INICIALIZANDO BASE DE DATOS DOCHUB (FUSION)");
        System.out.println("==========================================");

        // 1. Usuarios RBAC Base
        User admin = userRepository.findByEmail("admin@ubiobio.cl").orElse(new User());
        admin.setFullName("Prof. Boris Arenas");
        admin.setEmail("admin@ubiobio.cl");
        admin.setRole("Administrador");
        admin.setPassword(passwordEncoder.encode("12345678b"));
        userRepository.save(admin);

        User evaluadorUser = userRepository.findByEmail("evaluador@empresa.cl").orElse(new User());
        evaluadorUser.setFullName("Ing. Carlos Mendoza (Evaluador Empresa)");
        evaluadorUser.setEmail("evaluador@empresa.cl");
        evaluadorUser.setRole("Evaluador");
        evaluadorUser.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(evaluadorUser);

        User profesorUser = userRepository.findByEmail("profesor@ubiobio.cl").orElse(new User());
        profesorUser.setFullName("Prof. Juan Pérez (Profesor Guía)");
        profesorUser.setEmail("profesor@ubiobio.cl");
        profesorUser.setRole("Profesor");
        profesorUser.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(profesorUser);

        User estudianteUser = userRepository.findByEmail("estudiante@alumnos.ubiobio.cl").orElse(new User());
        estudianteUser.setFullName("Matías González (Estudiante)");
        estudianteUser.setEmail("estudiante@alumnos.ubiobio.cl");
        estudianteUser.setRole("Estudiante");
        estudianteUser.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(estudianteUser);

        // 2. Semillas de Profesores
        Profesor profBoris = crearProfesor("33333333-3", "Boris", "Alejandro", "Arenas", "Quezada", "boris.profe@ubiobio.cl", "Ingeniero Civil Informático");
        Profesor profJuan = crearProfesor("11111111-1", "Juan", "Carlos", "Perez", "Gomez", "profesor@ubiobio.cl", "Profesor Guía de Práctica");
        Profesor profMaria = crearProfesor("12345678-9", "Maria", "Jose", "Gonzalez", "Soto", "maria.gonzalez@ubiobio.cl", "Profesora de Educación Básica");

        // Crear usuarios para estos profesores
        crearUsuarioSiNoExiste("Prof. Boris Arenas", "boris.profe@ubiobio.cl", "Profesor");
        crearUsuarioSiNoExiste("Prof. Maria Gonzalez", "maria.gonzalez@ubiobio.cl", "Profesor");

        // 3. Semillas de Evaluadores
        Evaluador evalCarlos = crearEvaluador("44444444-4", "Carlos", "Andres", "Munoz", "Vega", "carlos.munoz@ubiobio.cl", TipoEvaluador.TUTOR);
        Evaluador evalMaria = crearEvaluador("55555555-5", "Maria", "Jose", "Contreras", "Rivas", "maria.contreras@ubiobio.cl", TipoEvaluador.COLABORADOR);
        Evaluador evalEmpresa = crearEvaluador("66666666-6", "Carlos", "Alberto", "Mendoza", "Perez", "evaluador@empresa.cl", TipoEvaluador.TUTOR);

        crearUsuarioSiNoExiste("Carlos Muñoz (Tutor)", "carlos.munoz@ubiobio.cl", "Evaluador");
        crearUsuarioSiNoExiste("Maria Contreras (Colaborador)", "maria.contreras@ubiobio.cl", "Evaluador");

        // 4. Semillas de Estudiantes
        Estudiante estDiego = crearEstudiante("20555555-5", "Diego", "Andres", "Martinez", "Soto", "diego.martinez@ubiobio.cl");
        Estudiante estValentina = crearEstudiante("20666666-6", "Valentina", "Isabel", "Rojas", "Perez", "valentina.rojas@ubiobio.cl");
        Estudiante estSebastian = crearEstudiante("20777777-7", "Sebastian", "Ignacio", "Fuentes", "Diaz", "sebastian.fuentes@ubiobio.cl");
        Estudiante estCamila = crearEstudiante("20888888-8", "Camila", "Fernanda", "Navarro", "Silva", "camila.navarro@ubiobio.cl");
        Estudiante estMatiasVargas = crearEstudiante("20999999-9", "Matias", "Sebastian", "Vargas", "Paredes", "matias.vargas@ubiobio.cl");
        Estudiante estLucas = crearEstudiante("21000000-0", "Lucas", "Ignacio", "Gonzalez", "Morales", "lucas.gonzalez@ubiobio.cl");
        Estudiante estAna = crearEstudiante("21.111.111-1", "Ana", "Sofia", "Perez", "Rojas", "ana.perez@alumnos.ubiobio.cl");
        Estudiante estBruno = crearEstudiante("21.222.222-2", "Bruno", "Andres", "Munoz", "Vega", "bruno.munoz@alumnos.ubiobio.cl");
        Estudiante estCarla = crearEstudiante("21.333.333-3", "Carla", "Isabel", "Contreras", "Diaz", "carla.contreras@alumnos.ubiobio.cl");

        crearUsuarioSiNoExiste("Diego Martínez", "diego.martinez@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Valentina Rojas", "valentina.rojas@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Sebastián Fuentes", "sebastian.fuentes@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Camila Navarro", "camila.navarro@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Matías Vargas", "matias.vargas@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Lucas González", "lucas.gonzalez@ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Ana Pérez", "ana.perez@alumnos.ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Bruno Muñoz", "bruno.munoz@alumnos.ubiobio.cl", "Estudiante");
        crearUsuarioSiNoExiste("Carla Contreras", "carla.contreras@alumnos.ubiobio.cl", "Estudiante");

        // 5. Asignaturas de Práctica
        AsignaturaPractica asig1 = crearAsignatura("INF-403", "Práctica Profesional I");
        AsignaturaPractica asig2 = crearAsignatura("INF-404", "Práctica Profesional II");
        AsignaturaPractica asigMat = crearAsignatura("MAT-PRA", "Matemática Aplicada");

        // 6. Ofertas
        Oferta ofBoris1 = crearOferta(2026, 1, asig1, profBoris);
        Oferta ofBoris2 = crearOferta(2026, 1, asig2, profBoris);
        Oferta ofJuan1 = crearOferta(2025, 2, asig1, profJuan);
        Oferta ofMariaMat = crearOferta(2026, 2, asigMat, profMaria);

        // 7. Inscripciones
        Inscripcion inscDiego = crearInscripcion(ofBoris1, estDiego);
        Inscripcion inscVal = crearInscripcion(ofBoris1, estValentina);
        Inscripcion inscSeb = crearInscripcion(ofBoris1, estSebastian);
        Inscripcion inscCam = crearInscripcion(ofBoris2, estCamila);
        Inscripcion inscMat = crearInscripcion(ofBoris2, estMatiasVargas);
        Inscripcion inscAna = crearInscripcion(ofMariaMat, estAna);
        Inscripcion inscBruno = crearInscripcion(ofMariaMat, estBruno);
        Inscripcion inscCarla = crearInscripcion(ofMariaMat, estCarla);

        // 8. Asignaciones Evaluadores
        Asignacion asigDiego = crearAsignacion(inscDiego, evalCarlos);
        Asignacion asigVal = crearAsignacion(inscVal, evalCarlos);
        Asignacion asigSeb = crearAsignacion(inscSeb, evalMaria);
        Asignacion asigAna = crearAsignacion(inscAna, evalEmpresa);
        Asignacion asigBruno = crearAsignacion(inscBruno, evalEmpresa);

        // 9. Planificaciones y Clases
        Planificacion plan1 = crearPlanificacion("/uploads/planificaciones/diego-planificacion.pdf", EstadoPlanificacion.APROBADA, "Planificación de clase de ecuaciones cuadráticas.");
        Planificacion plan2 = crearPlanificacion("/uploads/planificaciones/valentina-planificacion.pdf", EstadoPlanificacion.PENDIENTE, null);
        Planificacion plan3 = crearPlanificacion("/uploads/planificaciones/sebastian-planificacion.pdf", EstadoPlanificacion.RECHAZADA, "Debe incorporar una actividad de cierre.");
        Planificacion planAna = crearPlanificacion("/uploads/planificaciones/ana-planificacion.pdf", EstadoPlanificacion.APROBADA, "Excelente desarrollo metodológico.");
        Planificacion planBruno = crearPlanificacion("/uploads/planificaciones/bruno-planificacion.pdf", EstadoPlanificacion.APROBADA, "Aprobada.");
        Planificacion planCarla = crearPlanificacion("/uploads/planificaciones/carla-planificacion.pdf", EstadoPlanificacion.PENDIENTE, null);

        Clase clase1 = crearClase("Matemática", "Ecuaciones cuadráticas", plan1, inscDiego, LocalDate.of(2026, 9, 10), LocalTime.of(10, 0), LocalTime.of(11, 30));
        Clase clase2 = crearClase("Matemática", "Funciones lineales", plan2, inscVal, LocalDate.of(2026, 9, 11), LocalTime.of(10, 0), LocalTime.of(11, 30));
        Clase clase3 = crearClase("Orientación", "Convivencia escolar", plan3, inscSeb, LocalDate.of(2026, 9, 12), LocalTime.of(12, 0), LocalTime.of(13, 30));
        Clase claseAna = crearClase("Matematica", "Ecuaciones cuadraticas", planAna, inscAna, LocalDate.of(2026, 9, 8), LocalTime.of(9, 0), LocalTime.of(10, 30));
        Clase claseBruno = crearClase("Matematica", "Fracciones y proporciones", planBruno, inscBruno, LocalDate.of(2026, 9, 9), LocalTime.of(11, 0), LocalTime.of(12, 30));
        Clase claseCarla = crearClase("Matematica", "Resolucion de problemas", planCarla, inscCarla, LocalDate.of(2026, 9, 10), LocalTime.of(14, 0), LocalTime.of(15, 30));

        // 10. Evaluaciones de Clase y Semestrales
        crearEvaluacionClase(clase1, evalCarlos, 6.7, "Excelente dominio de grupo.", LocalDateTime.of(2026, 9, 10, 11, 45));
        crearEvaluacionClase(clase2, evalCarlos, 5.9, "Buen manejo pedagógico.", LocalDateTime.of(2026, 9, 11, 11, 45));
        crearEvaluacionClase(clase3, evalMaria, 6.2, "Muy buena disposición.", LocalDateTime.of(2026, 9, 12, 13, 45));
        crearEvaluacionClase(claseAna, evalEmpresa, 6.5, "Excelente participación.", LocalDateTime.of(2026, 9, 8, 10, 45));
        crearEvaluacionClase(claseBruno, evalEmpresa, 5.8, "Debe justificar mejor sus procedimientos.", LocalDateTime.of(2026, 9, 9, 12, 45));
        crearEvaluacionClase(claseCarla, evalEmpresa, 6.1, "Buen progreso.", LocalDateTime.of(2026, 9, 10, 15, 45));

        crearEvaluacionSemestral(asigAna, "Matematica", 6.2, "Cumple los objetivos del semestre.");
        crearEvaluacionSemestral(asigBruno, "Orientacion", 6.0, "Participacion constante.");
        crearEvaluacionSemestral(asigDiego, "Práctica Profesional I", 6.8, "Desempeño sobresaliente en el centro.");

        // 11. Informes
        crearInforme(TipoEmisor.PROFESOR, "/uploads/informes/diego-informe-final.pdf", inscDiego);
        crearInforme(TipoEmisor.PROFESOR, "/uploads/informes/valentina-informe-final.pdf", inscVal);

        entityManager.flush();
        System.out.println("==========================================");
        System.out.println("BASE DE DATOS INICIALIZADA CORRECTAMENTE");
        System.out.println("==========================================");
    }

    private void crearUsuarioSiNoExiste(String fullName, String email, String role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User u = new User();
            u.setFullName(fullName);
            u.setEmail(email);
            u.setRole(role);
            u.setPassword(passwordEncoder.encode("password123"));
            userRepository.save(u);
        }
    }

    private Estudiante crearEstudiante(String rut, String primerNombre, String segundoNombre, String apellidoPaterno, String apellidoMaterno, String correo) {
        Estudiante existente = entityManager.find(Estudiante.class, rut);
        if (existente != null) return existente;

        Estudiante estudiante = new Estudiante(rut, primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo);
        entityManager.persist(estudiante);
        return estudiante;
    }

    private Profesor crearProfesor(String rut, String primerNombre, String segundoNombre, String apellidoPaterno, String apellidoMaterno, String correo, String titulo) {
        Profesor existente = entityManager.find(Profesor.class, rut);
        if (existente != null) return existente;

        Profesor profesor = new Profesor(rut, primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, titulo);
        entityManager.persist(profesor);
        return profesor;
    }

    private Evaluador crearEvaluador(String rut, String primerNombre, String segundoNombre, String apellidoPaterno, String apellidoMaterno, String correo, TipoEvaluador tipo) {
        Evaluador existente = entityManager.find(Evaluador.class, rut);
        if (existente != null) return existente;

        Evaluador evaluador = new Evaluador(rut, primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, tipo);
        entityManager.persist(evaluador);
        return evaluador;
    }

    private AsignaturaPractica crearAsignatura(String codigo, String nombre) {
        AsignaturaPractica existente = entityManager.find(AsignaturaPractica.class, codigo);
        if (existente != null) return existente;

        AsignaturaPractica asignatura = new AsignaturaPractica(codigo, nombre);
        entityManager.persist(asignatura);
        return asignatura;
    }

    private Oferta crearOferta(int anio, int periodo, AsignaturaPractica asignatura, Profesor profesor) {
        Oferta oferta = new Oferta(anio, periodo, asignatura, profesor);
        entityManager.persist(oferta);
        return oferta;
    }

    private Inscripcion crearInscripcion(Oferta oferta, Estudiante estudiante) {
        Inscripcion inscripcion = new Inscripcion(oferta, estudiante);
        entityManager.persist(inscripcion);
        return inscripcion;
    }

    private Asignacion crearAsignacion(Inscripcion inscripcion, Evaluador evaluador) {
        Asignacion asignacion = new Asignacion(inscripcion, evaluador);
        entityManager.persist(asignacion);
        return asignacion;
    }

    private Planificacion crearPlanificacion(String archivo, EstadoPlanificacion estado, String retroalimentacion) {
        Planificacion planificacion = new Planificacion();
        planificacion.setArchivo(archivo);
        planificacion.setEstado(estado);
        planificacion.setRetroalimentacion(retroalimentacion);
        entityManager.persist(planificacion);
        return planificacion;
    }

    private Clase crearClase(String asignatura, String tema, Planificacion planificacion, Inscripcion inscripcion, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        Clase clase = new Clase(asignatura, tema, planificacion, inscripcion, horaInicio);
        clase.setFecha(fecha);
        clase.setHoraFin(horaFin);
        entityManager.persist(clase);
        return clase;
    }

    private void crearEvaluacionClase(Clase clase, Evaluador evaluador, Double nota, String observaciones, LocalDateTime fecha) {
        EvaluacionClase evaluacion = new EvaluacionClase("/uploads/evaluaciones-clase/eval-" + clase.getId() + ".pdf", clase, evaluador, nota, observaciones, fecha);
        entityManager.persist(evaluacion);
    }

    private void crearEvaluacionSemestral(Asignacion asignacion, String asignatura, Double nota, String observaciones) {
        EvaluacionSemestral evaluacion = new EvaluacionSemestral("/uploads/evaluaciones-semestrales/eval-sem-" + asignacion.getId() + ".pdf", asignacion, asignatura, nota, observaciones);
        entityManager.persist(evaluacion);
    }

    private void crearInforme(TipoEmisor emisor, String archivo, Inscripcion inscripcion) {
        Informe informe = new Informe(emisor, archivo, inscripcion);
        entityManager.persist(informe);
    }
}