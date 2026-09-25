# DEFINICIÓN DEL FLUJO DE TRABAJO

En esta sección se describe la forma en la que el agente debe trabajar.


## CONCEPTOS PREVIOS

Algunos conceptos que el agente debe conocer antes de proceder con el flujo del trabajo.

- Se define el estado del proyecto como la disposición de todo el directorio de trabajo en algún momento
determinado.
- Se define el estado inicial 'S0' del proyecto como el estado en el que se encuentra antes de que el agente
haga cualquier modificación requerida por el usuario.
- Se define el estado final 'Sf' del proyecto como el estado en el que se cumple con todos los requerimientos
del usuario.
- Un estado es válido si satisface todas las reglas aplicables a este proyecto; las reglas de negocio. 
- Por contraposición, un estado será inválido si viola al menos una de las reglas aplicables a este proyecto
- Una transición entre estados es cualquier modificación que se realice en el directorio de trabajo.


## FLUJO DE TRABAJO

Cada vez que el usuario pida realizar un cambio al proyecto:

1. Define el estado inicial S0 del proyecto (su estado actual ANTES de hacer cualquier modificación).
2. El agente debe verificar que una transición no viole las reglas de negocio o de comportamiento establecidas **antes de implementarla**. Así, el agente ahorrará tiempo descartando caminos conflictivos antes de aplicar cambios.
3. Si una transición lleva al agente a un estado válido, debe pasar a ese estado.
4. Si desde un estado válido no se puede alcanzar ningún otro estado válido ni alcanzar el estado final, ese
estado deberá descartarse.
5. El proceso acaba cuando se alcanza Sf y se cumplen al mismo tiempo:
- Todos los estados intermedios son válidos
- El estado final es válido

