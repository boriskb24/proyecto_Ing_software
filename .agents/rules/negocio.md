# REGLAS DE NEGOCIO

A continuación se declaran las reglas de negocio aplicables para este proyecto.
Para algunas reglas especifica el criterio de evaluación que permitirá al agente saber con exactitud cuándo se está cumpliendo o violando la regla.
El resto de reglas son autodescriptivas.
El deber del agente será verificar que el códgio implementado cumpla con todas las reglas especificadas aquí.

## RN-01
Un estudiante no puede inscribirse en dos o más instancias de una misma asignatura en un mismo período.

### Criterio de evaluación
El par '(estudiante, oferta)' debe ser único en la tabla 'Inscripcion' de la base de datos.


## RN-02
Un profesor no puede acceder a información de un alumno que no está/estuvo inscrito a una asignatura con él.

### Criterio de evaluación
Dado un profesor que inició sesión, el sistema jamás deberá permitir que el profesor tenga acceso a:
- Un listado de estudiantes que no estén/hayan estado inscritos a una asignatura con él
- Planificaciones de clase de estudiantes que no estén/hayan estado inscritos a una asignatura con él
- Evaluaciones realizadas por los evaluadores a estudiantes que no estén/hayan estado inscritos a una asignatura con él.
- Informes subidos por estudiantes que no estén/hayan estado inscritos a una asignatura con él
- Fichas de estudiantes que no estén/hayan estado inscritos a una asignatura con él


## RN-05
Un estudiante no puede acceder a información de otros estudiantes, sin importar si están inscritos en la misma oferta de asignatura o no.

### Criterio de evaluación
Dado un estudiante que inicia sesión, el sistema jamás deberá permitir que el estudiante tenga acceso a:
- Un listado de estudiantes distintos de sí mismo
- Planificaciones de clase de otros estudiantes distintos de sí mismo
- Evaluaciones realizadas por evaluadores a otros estudiantes distintos de sí mismo
- Informes subidos por estudiantes distintos de sí mismo
- Informes subidos por profesores vinculados aestudiantes distintos de sí mismo
- Fichas de estudiantes distitnos de sí mismo


## RN-06
Para cada inscripción de un estudiante a una oferta de asignatura dictada por un profesor, se contemplan dos informes finales de práctica:
- Un informe subido por el estudiante, y
- Un informe subido por el profesor
Ninguno de ellos tiene permisos para modificar el informe subido por el otro:

### Criterio de evaluación
- Un estudiante no puede modificar ni reemplazar el informe subido por el profesor
- Un profesor no puede modificar ni reemplazar el informe subido por el estudiante


## RN-07
Para cada inscripción de un estudiante a una oferta de asignatura dictada por un profesor, se contemplan dos informes finales de práctica:
- Un informe subido por el estudiante, y
- Un informe subido por el profesor
Ninguno de los dos puede subir más de un informe

### Criterio de evaluación
El par (inscripción, emisor) debe ser único en la tabla "Informe".


## RN-08
Un evaluador no puede acceder a información de estudiantes que no estén/hayan sido asignados a él.

### Criterio de evaluación
Dado un evaluador que inicia sesión, el sistema jamás deberá permitir que el evaluador tenga acceso a:
- Un listado de estudiantes que no estén/hayan estado asignados a él
- La ficha de un estudiante que no este/haya estado asignado a él

Tampoco podrá registrar una evaluación a un estudiante que no esté/haya estado asignado a él.


## RN-09
Un evaluador no puede evaluar una clase que aún no es llevada a cabo por el estudiante.

### Criterio de evaluación
Si el evluador intenta registrar una evaluación de clase cuya fecha se encuentra adelantada a la fecha actual, el sistema debe rechazar la petición.


## RN-10
A un estudiante sólo se le podrán asignar como máximo un evaluador del tipo "TUTOR" y un evaluador del tipo "COLABORADOR" en el contexto de una misma inscripcion.

### Criterio de evaluación
Dado un estudiante que está inscrito a una oferta de asignatura en un período determinado, no puede haber más de un tutor ni más de un colaborador en la tabla "Asignacion"
asociada a la inscripción del estudiante a esa oferta de asignatura. El estudiante podrá tener asignado un tutor y un colaborador al mismo tiempo, pero nunca podrá tener
asignado más de un tutor ni más de un colaborador.


## RN-11
Dos clases serán idénticas si están siendo dictadas por el mismo estudiante en una misma fecha y en una misma práctica y además:
- La hora de inicio de ambas clases son idénticas, o bien
- La hroa de inicio de una se encuentra entre la hora de inicio y la hora de fin de la otra

### Criterio de evaluación
La agrupación '(inscripcion, hora_inicio, fecha)' debe ser única en la tabla "Clase". Además, si un usuario intenta insertar un nuevo registro en la tabla "Clase" cuya inscripcion y 
fecha ya se encuentre registrada en la tabla "Clase" pero la hora de inicio se encuentre entre la hroa de incio y la hora de fin de la clase ya registrada, el sistema evitará 
la inserción de dicho registro y mantendrá aquella clase que ya se encuentra registrada.

## RN-12
Un profesor no puede tener acceso a la información de asignaturas que él no esté dictando o haya dictado en algún momento.
