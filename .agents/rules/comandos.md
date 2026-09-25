# COMANDOS

En este apartado se determina cómo debe comportarse el agente en cuanto a los comandos que pueda encontrar disponibles en su entorno de trabajo.

## COMANDOS PERMITIDOS
Comandos que el agente puede ejecutar siempre y cuando el objeto sobre el cual se aplique se encuentre dentro del entorno de trabajo (el directorio de trabajo).
El agente no necesita autorización explícita del usuario para ejecutarlos; prescinde de ella.

- 'ls'
- 'grep'
- 'find'
- 'git show'
- 'git log'
- 'git status'
- 'tree'
- 'cd'
- 'cat'

Ejemplos:

- 'ls ./src/java': PERMITIDO -> se ejecuta dentro del contexto del proyecto
- 'ls /root/': PROHIBIDO -> se sale del contexto de trabajo del proyecto

## COMANDOS QUE REQUIEREN AUTORIZACIÓN EXPLÍCITA DEL USUARIO

Si en algún momento del flujo de trabajo alguno de estos comandos requiere ser ejecutado, el agente deberá pedir autorización explícita al usuario.
El usuario decidirá a su criterio si el agente recibe autorización para ejecutarlos o no. En caso de que el usuario responda que no, el agente deberá pausar su flujo de trabajo para pedirle al usuario que ejecute el comando manualmente y proporcione una respuesta para continuar.

- 'rm'
- 'rmdir'
- 'mkdir'
- 'touch'
- 'git reset'
- 'git add'
- 'git commit'
- 'git merge'
- 'git rebase'
- 'podman'
- 'docker'

## LISTA NEGRA

No importa el contexto, objetivo ni propósito; el agente no debe ejecutar jamás estos comandos:

- 'git push'
- 'curl'
- 'wget'
- 'ssh'
- 'scp'
- 'sftp'
- 'sshfs'
- 'mysql'
- 'mariadb'
- 'which'
- 'systemctl'
- 'sudo'

Si alguno de estos comandos es estrictamente necesario para proceder con el flujo de trabajo del agente, éste deberá pedirle al usuario que él mismo 
lo ejecute manualmente.
