package com.ubb.dochub.service.impl;

import com.ubb.dochub.dto.EvaluacionCLADto;
import com.ubb.dochub.dto.EvaluacionSEMDto;
import com.ubb.dochub.dto.EvaluacionesResponseDto;
import com.ubb.dochub.dto.InformeEntregaResponse;
import com.ubb.dochub.dto.TipoFiltroEvaluacion;
import com.ubb.dochub.entity.Estudiante;
import com.ubb.dochub.entity.EvaluacionClase;
import com.ubb.dochub.entity.EvaluacionSemestral;
import com.ubb.dochub.entity.Informe;
import com.ubb.dochub.entity.Inscripcion;
import com.ubb.dochub.entity.TipoEmisor;
import com.ubb.dochub.repository.EvaluacionClaseRepository;
import com.ubb.dochub.repository.EvaluacionSemestralRepository;
import com.ubb.dochub.repository.InformeRepository;
import com.ubb.dochub.repository.InscripcionRepository;
import com.ubb.dochub.service.PracticaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PracticaServiceImpl implements PracticaService {

    private static final String UPLOAD_DIR = "uploads/informes";
    private final InscripcionRepository inscripcionRepository;
    private final InformeRepository informeRepository;

    @Autowired
    private EvaluacionClaseRepository evaluacionClaseRepository;

    @Autowired
    private EvaluacionSemestralRepository evaluacionSemestralRepository;

    public PracticaServiceImpl(InscripcionRepository inscripcionRepository, InformeRepository informeRepository) {
        this.inscripcionRepository = inscripcionRepository;
        this.informeRepository = informeRepository;
    }

    @Override
    public InformeEntregaResponse guardarInformeFinal(MultipartFile archivo) {
        // 1. Validar que el archivo no esté vacío
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un archivo para subir.");
        }

        // 2. Validar estrictamente el Content-Type para PDF
        String contentType = archivo.getContentType();
        String originalFilename = archivo.getOriginalFilename();

        boolean isPdfMime = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");

        if (!isPdfMime || !hasPdfExtension) {
            throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, 
                "Formato inválido. Solo se admiten archivos en formato PDF (application/pdf)."
            );
        }

        // 3. Simular guardado en almacenamiento local
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Nombre único para evitar colisiones
            String safeFileName = UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename.replaceAll("\\s+", "_") : "informe.pdf");
            Path targetLocation = uploadPath.resolve(safeFileName);
            
            Files.copy(archivo.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return new InformeEntregaResponse(
                "¡Informe final de práctica entregado con éxito!",
                originalFilename,
                archivo.getSize(),
                contentType,
                LocalDateTime.now()
            );
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error al procesar y guardar el archivo: " + e.getMessage()
            );
        }
    }

    @Override
    public EvaluacionesResponseDto obtenerEvaluacionesPorProfesor(String rutProfesor, TipoFiltroEvaluacion tipo) {
        List<EvaluacionCLADto> listaClase = new ArrayList<>();
        List<EvaluacionSEMDto> listaSemestral = new ArrayList<>();

        // 1. Recuperar evaluaciones de clase o todas
        if (tipo == TipoFiltroEvaluacion.CLASE || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionClase> evalClases = evaluacionClaseRepository.findEvaluacionesPorRutProfesor(rutProfesor);
            for (EvaluacionClase ec : evalClases) {
                Estudiante est = ec.getClase().getInscripcion().getEstudiante();
                String nombreComp = est.getPrimerNombre() + " " + est.getApellidoPaterno();
                
                listaClase.add(new EvaluacionCLADto(
                    ec.getId(),
                    est.getRut(),
                    nombreComp,
                    "CLASE",
                    ec.getNota(),
                    ec.getObservaciones(),
                    ec.getFecha()
                ));
            }
        }

        // 2. Recuperar todas las evaluaciones semestrales
        if (tipo == TipoFiltroEvaluacion.SEMESTRAL || tipo == TipoFiltroEvaluacion.TODAS) {
            List<EvaluacionSemestral> evalSemestrales = evaluacionSemestralRepository.findEvaluacionesPorRutProfesor(rutProfesor);
            for (EvaluacionSemestral es : evalSemestrales) {
                Estudiante est = es.getAsignacion().getInscripcion().getEstudiante();
                String nombreComp = est.getPrimerNombre() + " " + est.getApellidoPaterno();
                
                listaSemestral.add(new EvaluacionSEMDto(
                    es.getId(),
                    est.getRut(),
                    nombreComp,
                    "SEMESTRAL",
                    es.getNota(),
                    es.getObservaciones(),
                    es.getFecha()
                ));
            }
        }

        return new EvaluacionesResponseDto(listaClase, listaSemestral);
    }

    @Override
    public InformeEntregaResponse guardarInformeFinalParaInscripcion(MultipartFile archivo, Long inscripcionId) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un archivo para subir.");
        }

        String contentType = archivo.getContentType();
        String originalFilename = archivo.getOriginalFilename();

        boolean isPdfMime = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");

        if (!isPdfMime || !hasPdfExtension) {
            throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, 
                "Formato inválido. Solo se admiten archivos en formato PDF (application/pdf)."
            );
        }

        Inscripcion inscripcion = inscripcionRepository.findById(inscripcionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada."));

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String safeFileName = UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename.replaceAll("\\s+", "_") : "informe.pdf");
            Path targetLocation = uploadPath.resolve(safeFileName);
            Path parent = targetLocation.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }
            Files.copy(archivo.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Persistir o actualizar registro de Informe para esta inscripción
            List<Informe> existentes = informeRepository.findByInscripcionIdAndEmisorOrderByIdDesc(inscripcionId, TipoEmisor.PROFESOR);
            Informe informe;
            if (!existentes.isEmpty()) {
                informe = existentes.get(0);
                informe.setArchivo(safeFileName);
            } else {
                informe = new Informe(TipoEmisor.PROFESOR, safeFileName, inscripcion);
            }
            Informe saved = informeRepository.save(informe);

            return new InformeEntregaResponse(
                "Informe subido y registrado (id=" + saved.getId() + ")",
                originalFilename,
                archivo.getSize(),
                contentType,
                LocalDateTime.now()
            );
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error al procesar y guardar el archivo: " + e.getMessage()
            );
        }
    }
}
