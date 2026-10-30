# Portal Mapa de Procesos · Guía de instalación

Estado: borrador para prueba piloto · Preparado el 2026-10-29

El portal es una aplicación web de Google Apps Script. Entra solo quien tenga cuenta @salfamontajes.com; la hoja **Accesos** define qué puede hacer cada persona, y el servidor lo verifica en cada acción. Las versiones del mapa se guardan como archivos en Drive y se registran en la hoja **Versiones**.

Carpeta del portal en tu Drive: **Mi unidad › Portales Salfa › 01 Mapa de Procesos**. Al instalar, el portal crea dentro las carpetas **Datos**, **Versiones** y **Publicadas**.

## Archivos

| Archivo | Tipo en Apps Script | Contenido |
| --- | --- | --- |
| Codigo.gs | Secuencia de comandos | Servidor: instalación, accesos, versiones, flujo de aprobación, correo e IA |
| appsscript.json | Manifiesto | Permisos y publicación como aplicación web del dominio |
| Envoltorio.html | HTML | Plantilla común de las páginas |
| portada.html | HTML | Portada con la cuenta Salfa y solicitud de acceso |
| admin.html | HTML | Administración: accesos, solicitudes, perfiles, configuración, bitácora |
| mapa.html | HTML | El mapa de procesos adaptado al portal |

## Instalación (una vez, unos 15 minutos)

1. En Drive abre **Portales Salfa › 01 Mapa de Procesos**. Pulsa **Nuevo › Más › Google Apps Script**. Nombra el proyecto **Portal Mapa de Procesos**.
2. En el editor abre **Configuración del proyecto** (engranaje) y marca **Mostrar el archivo de manifiesto "appsscript.json" en el editor**.
3. Abre `Código.gs`, borra su contenido y pega `Codigo.gs`. Abre `appsscript.json` y reemplázalo por el del paquete.
4. Crea cuatro archivos HTML con **+ › HTML**, con estos nombres exactos (sin `.html`): `Envoltorio`, `portada`, `admin`, `mapa`. Pega en cada uno el archivo del mismo nombre.
5. Guarda. En la barra superior elige la función **instalar** y pulsa **Ejecutar**. Autoriza con tu cuenta Salfa. Al terminar, el registro muestra el enlace de la planilla de datos y tú quedas como Administrador.
6. Pulsa **Implementar › Nueva implementación**. Tipo: **Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario de Salfa Montajes** (el dominio). Pulsa **Implementar** y copia la URL que termina en `/exec`.
7. Esa URL es el enlace que compartes. Ábrela: verás la portada con tu cuenta. Entra a **Administración** y agrega a las personas con su perfil, o espera sus solicitudes.

## Perfiles

| Perfil | Puede |
| --- | --- |
| Visualizador | Ver la revisión vigente, la guía y el comparador; usar el asistente si está activo |
| Colaborador | Además, ver versiones en trabajo, editar en pantalla y guardar propuestas |
| Editor | Además, guardar borradores, enviar a revisión, restaurar versiones y guardar imágenes en Drive |
| Revisor | Ver versiones en trabajo, validarlas o devolverlas con observaciones (no edita) |
| Aprobador | Lo del Revisor, más aprobar y publicar la revisión |
| Administrador | Todo, más accesos, solicitudes, configuración y bitácora |

Quien no está en la hoja entra **sin acceso** y puede pedirlo desde la portada. Para que todo el dominio vea el mapa sin pedir acceso, cambia `ACCESO_POR_DEFECTO` a `Visualizador` en Administración › Configuración.

## Cómo funcionan las versiones

- Cada **Guardar** crea una versión nueva (B v.01, B v.02…) con autor, fecha y comentario. Nunca se sobrescribe una versión anterior.
- Si otra persona guardó antes, el portal avisa y permite comparar o guardar igual como versión nueva.
- Flujo: **Borrador › En revisión › Validado › Aprobado**. El Revisor o el Aprobador pueden devolver con observaciones.
- Al aprobar, la versión pasa a ser la nueva revisión (Rev C), las versiones abiertas de la revisión anterior quedan obsoletas, se publica el documento y el PDF en **Publicadas**, y se avisa por correo.
- Segregación de funciones: quien guardó una versión no puede aprobarla (configurable con `SEGREGACION`).

## Actualizar el código sin cambiar el enlace

Pega los cambios, guarda y usa **Implementar › Administrar implementaciones › Editar (lápiz) › Versión: Nueva versión › Implementar**. La URL `/exec` se mantiene.

## Asistente IA

**Vía B (recomendada para partir, sin costo adicional):** un Gem compartido usa la licencia Gemini de cada persona.

1. En el mapa, como Administrador, abre **Versiones y aprobación** y pulsa **Publicar documento vigente para el Gem**. Se crea el documento en **Publicadas**.
2. Comparte la carpeta **Publicadas** con el dominio en modo lector.
3. En gemini.google.com crea un Gem con las instrucciones del documento **Instrucciones del Gem** de esta carpeta y agrega como conocimiento el documento vigente de **Publicadas**. Compártelo con el dominio.
4. Pega el enlace del Gem en Administración › Configuración › `GEM_URL`. Aparece el botón **Asistente Gemini** en la portada y en el mapa.

Pendiente de verificar en el piloto: si el Gem toma la versión nueva del documento cuando el portal lo actualiza.

**Vía A (asistente dentro de la página):** requiere un proyecto de Google Cloud de la empresa con facturación.

1. TI crea o elige un proyecto de Google Cloud con facturación y activa la API de Vertex AI.
2. La cuenta dueña del portal necesita el rol **Vertex AI User** en ese proyecto.
3. En Apps Script › Configuración del proyecto › Proyecto de Google Cloud, cambia al número de ese proyecto.
4. En Administración › Configuración: `IA_ACTIVA` = `SI`, `IA_PROYECTO` = ID del proyecto, y ajusta `IA_LIMITE_DIARIO`.

El uso de IA debe ajustarse al **Procedimiento Acceso Herramientas IA en SalfaCorp**.

## Seguridad

- La aplicación se ejecuta con la cuenta dueña. No compartas las carpetas **Datos** ni **Versiones**: las personas trabajan a través del portal y así nadie se salta el flujo.
- Conviene que la dueña sea una cuenta corporativa de servicio o que el proyecto pase luego a una unidad compartida, para no depender de una cuenta personal.
- El correo del portal se envía desde la cuenta dueña, con respuesta a quien lo envía.
- Todas las acciones relevantes quedan en la hoja **Bitacora**.

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| "No tienes permiso" o pantalla de Google al abrir el enlace | El navegador usa otra cuenta Google | Usa **Cambiar de cuenta** en la portada, o un perfil de Chrome con la cuenta Salfa |
| "El portal no está instalado" | No se ejecutó `instalar()` | Ejecútala desde el editor |
| No llegan correos | `AVISOS_CORREO` en NO o cuota diaria | Revisa Configuración y la bitácora |
| El asistente no aparece | `IA_ACTIVA` en NO | Usa el Gem (vía B) o activa la vía A |

## Portales futuros

Cada portal nuevo vive en su propia subcarpeta de **Portales Salfa** (02, 03…) con su propio proyecto de Apps Script, su planilla y su enlace.
