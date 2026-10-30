# Prueba del portal con una cuenta Gmail personal

Objetivo: probar el portal completo antes de pedir a TI que habilite Apps Script en Salfa.

## Diferencias con la instalación en Salfa

- Usa `appsscript-prueba.json` como manifiesto (acceso: cualquier cuenta de Google que inicie sesión).
- `instalar()` detecta que la carpeta de Salfa no es accesible y crea `Portales Salfa / 01 Mapa de Procesos` en tu Mi unidad personal.
- El dominio permitido queda como `gmail.com` (se toma de tu cuenta).
- Con cuentas personales, Google no entrega al portal el correo de otras personas. La prueba se hace con tu propia cuenta, simulando cada perfil.

## Pasos

1. Entra a script.google.com con tu cuenta personal y crea un proyecto nuevo: **Portal Mapa de Procesos (prueba)**.
2. Configuración del proyecto: marca **Mostrar el archivo de manifiesto**.
3. Pega `Codigo.gs` en `Código.gs` y `appsscript-prueba.json` en `appsscript.json`.
4. Crea los HTML `Envoltorio`, `portada`, `admin` y `mapa`, y pega cada archivo.
5. Ejecuta **instalar** y autoriza. Google mostrará "Google no verificó esta app": pulsa **Configuración avanzada › Ir a Portal Mapa de Procesos**. Es normal en proyectos propios.
6. **Implementar › Nueva implementación › Aplicación web**. Ejecutar como: **Yo**. Acceso: **Cualquier usuario con una cuenta de Google**. Copia la URL `/exec`.

## Guion de prueba (unos 20 minutos)

1. Abre la URL: portada con tu cuenta y perfil Administrador.
2. Administración › Configuración: `SEGREGACION` = `NO` (para aprobar tú mismo) y `PRUEBA_PERFIL` = `Editor`. Guarda.
3. Abre el mapa: cambia un texto, pulsa **Guardar** con un comentario. Debe quedar **B v.01 · Borrador** y aparecer un archivo en `Versiones/Rev B`.
4. **Versiones y aprobación › Enviar a revisión**.
5. Configuración: `PRUEBA_PERFIL` = `Revisor`. En el mapa: **Validar** (comprueba que no puedes editar).
6. `PRUEBA_PERFIL` = `Aprobador`. **Aprobar**: debe quedar **Rev C vigente**, con documento y PDF en `Publicadas` y un correo de aviso.
7. `PRUEBA_PERFIL` = `Visualizador`: solo ves la Rev C, sin botones de edición.
8. **Comparar versiones** con base **Rev B original**: deben aparecer los cambios.
9. Deja `PRUEBA_PERFIL` vacío y `SEGREGACION` = `SI` al terminar.

Si algo falla, revisa la hoja **Bitacora** de la planilla y el registro de ejecuciones de Apps Script.

## Después de la prueba

Con la prueba lista, pide a TI que habilite Apps Script para tu cuenta Salfa. En Salfa se usa `appsscript.json` (acceso solo del dominio) y la carpeta que ya está creada en tu Drive corporativo.
