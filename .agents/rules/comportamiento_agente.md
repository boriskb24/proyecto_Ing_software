# GUÍA DE COMPORTAMIENTO PARA EL AGENTE

A continuación se especifica una serie de reglas que se espera que el agente cumpla en su quehacer como tal.


## EL AGENTE NO PUEDE:

- Modificar entidades JPA definidas en el paquete com.ubb.dochub.entity; queda tajantemente prohibido modificar alguna de las clases java que pertenecen a ese paquete
- La unica excepción a la regla anterior es la entidad "Users". No obstante, el agente deberá notificar al usuario sobre los cambios requeridos y pedir autorización explícita; 
el agente jamás deberá tomar esa decisión por sí mismo.
- En caso de que el agente considere la idea de modificar el esquema de la base de datos (normalización, desnormalización, agregar entidades nuevas, modificar cardinalidades o relaciones), deberá sugerirselo al usuario explícitamente y con una debida justificación de modelado o diseño. La decisión última recaerá sobre el usuario.
- Tomar decisiones relativas a la arquitectura del proyecto, ya sea agregar, eliminar o modificar contenedores de Docker/Podman o modificar los archivos de construccion de 
servicios/contenedores.
- Respecto al punto anterior, si el usuario requiere implementar alguna funcionalidad para la cual sea estrictamente necesario modificar parte de la arquitectura del proyecto, 
entonces el agente deberá notificar explícitamente al usuario sobre la situación y dejar la decisión a su criterio; el agente jamás deberá tomar una decisión por sí mismo.
- Modificar alguna de las reglas establecidas en los archivos de este mismo directorio.
- Eliminar algún archivo de reglas creado en este mismo directorio.
- Agregar un nuevo archivo de reglas en este mismo directorio.


## BUENAS PRÁCTICAS

- Si el usuario pide al agente que realice un merge (comando 'git merge'), el resultado del merge debe satisfacer las reglas de negocio o de comportamiento del agente establecidas. El agente deberá abstenerse de realizar un merge hasta que esté seguro de que ninguna regla de negocioni de comportamiento fué violada ya sea durante el merge o como resultado del mismo.
- La lógica anterior también aplica para los casos en ls que se deba aplicar un rebase ('git rebase').
- Cualquier cambio considerable en términos de la estructura del proyecto como refactorizaciones, reorganización del directorio de trabajo o uso de nuevos frameworks o librerías deberán ser sugeridas explícitamente al usuario primero. Luego, el usuario tendrá la última palabra y la capacidad de decidir si se realiza ese cambio o no.
- Principio de **mínima intervención efectiva**: El agente debe evitar a toda acosta hacer sobre-ingeniería para satisfacer los requerimientos del usuario; si algo puede hacerse de forma simple, directa y rápida usando exclusivamente las herramientas, recursos y patrones que ya existen en el proyecto, el agente priorizará esa solución.
- Una excepción al punto anterior se da cuando los requerimientos del usuario son complejos en sí mismos y requieren de forma **indispensable** de una serie bastante sofisticada de cambios.

Ejemplos donde el agente debe aplicar el principio de mínima intervención efectiva y dónde puede considerar excepciones:
- El usuario pide cambiar el aspecto de un botón de una página: el agente debe explorar primero la posibilidad de cambiar el aspecto con los recursos ya disponibles y abstenerse de modificar otras partes que son innecesarias o irrelevantes para cumplir el requerimiento. De poder hacerse, entonces el agente debería abstenerse de importar librerías externas o paquetes nuevos sólo "porque vendrían bien usarlos".

- El usuario pide implementar una animación gráfica al presionar el botón pero el proyecto no cuenta con ningún recurso que permita establecer animaciones. En este caso está justificado que el agente decida importar / incluír librerías o recursos nuevos.
