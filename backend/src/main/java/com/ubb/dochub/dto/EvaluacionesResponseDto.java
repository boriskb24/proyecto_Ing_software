package com.ubb.dochub.dto;

import java.util.List;

public class EvaluacionesResponseDto {

    private List<EvaluacionCLADto> evaluacionesClase;
    private List<EvaluacionSEMDto> evaluacionesSemestrales;

    public EvaluacionesResponseDto() {}

    public EvaluacionesResponseDto(List<EvaluacionCLADto> evaluacionesClase, 
                                   List<EvaluacionSEMDto> evaluacionesSemestrales) {
        this.evaluacionesClase = evaluacionesClase;
        this.evaluacionesSemestrales = evaluacionesSemestrales;
    }

    public List<EvaluacionCLADto> getEvaluacionesClase() {
        return evaluacionesClase;
    }

    public void setEvaluacionesClase(List<EvaluacionCLADto> evaluacionesClase) {
        this.evaluacionesClase = evaluacionesClase;
    }

    public List<EvaluacionSEMDto> getEvaluacionesSemestrales() {
        return evaluacionesSemestrales;
    }

    public void setEvaluacionesSemestrales(List<EvaluacionSEMDto> evaluacionesSemestrales) {
        this.evaluacionesSemestrales = evaluacionesSemestrales;
    }
}
