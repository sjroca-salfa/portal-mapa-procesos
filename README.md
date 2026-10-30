# 📌 PORTAL 01 · MAPA DE PROCESOS (SALFA MONTAJES)
**Guía de Contexto y Operación para Asistentes de IA (Claude / Antigravity)**
*Última actualización: 2026-10-30*

---

## 1. Enlaces Operativos

| Elemento | Enlace |
| :--- | :--- |
| **URL de la Aplicación Web (/exec)** | [Abrir Portal](https://script.google.com/macros/s/AKfycbxWCGH8Fh7qUEn3AwTm4i_Yq3gBxp9bUx6ZXHbm-cBTTiafHAhKsWnqWrLoIDu8Y8Wq/exec) |
| **Panel de Administración (?p=admin)** | [Administrar Accesos y Configuración](https://script.google.com/macros/s/AKfycbxWCGH8Fh7qUEn3AwTm4i_Yq3gBxp9bUx6ZXHbm-cBTTiafHAhKsWnqWrLoIDu8Y8Wq/exec?p=admin) |
| **Planilla de Datos (Google Sheets)** | [Planilla Portal Mapa de Procesos · Datos](https://docs.google.com/spreadsheets/d/1ib87W-3nRlmIg-gCJnA5nKjHCF98Q1xB3uz0dgmenbs/edit) |
| **Carpeta Raíz en Google Drive** | [Portales Salfa / 01 Mapa de Procesos](https://drive.google.com/drive/folders/1tIL46cc_BQn-bbBNcku0QLcYYq5EykQ-) |
| **Repositorio GitHub (Privado)** | [github.com/sroca-ing/portal-mapa-procesos](https://github.com/sroca-ing/portal-mapa-procesos) |

---

## 2. Estructura de Archivos Locales

Todos los archivos de este portal se ubican en:
`E:\Claude\Proyectos\Laboral\Proyectos de P&D\Actividades de Área\Portales Salfa Pilotos\01-portal-mapa-procesos\`

```text
01-portal-mapa-procesos/
├── README.md                      <-- Esta guía
├── .gitignore
├── .github/workflows/desplegar.yml<-- Pipeline CI/CD GitHub Actions
└── proyecto/                      <-- Directorio fuente que sincroniza con Google Apps Script
    ├── Codigo.gs                  <-- Backend: seguridad, sesiones, guardado de versiones, correo
    ├── Envoltorio.html            <-- Plantilla común HTML
    ├── portada.html               <-- Vista de inicio y solicitud de acceso
    ├── admin.html                 <-- Vista de gestión de usuarios, perfiles, bitácora y config
    ├── mapa.html                  <-- Visualizador y editor interactivo del mapa de procesos
    ├── appsscript.json            <-- Manifiesto del proyecto (Scoping y permisos)
    └── .clasp.json                <-- Configuración local de Clasp
```

---

## 3. Lógica de Negocio y Reglas Críticas

1. **Seguridad y Validación de Usuarios:**
   - La función `esDominioValido_(correo)` en `Codigo.gs` valida que el usuario pertenezca al dominio `@salfamontajes.com` o sea la cuenta administradora dueña (`sroca.ot@gmail.com`).
   - Cuentas con perfil `Administrador` permanente: `sroca.ot@gmail.com` y `sjroca@salfamontajes.com`.
   - Cualquier usuario que no esté en la hoja `Accesos` ve la pantalla de **Solicitar Acceso**.
2. **Flujo de Versionado:**
   - Cada guardado crea un archivo JSON inmutable en la carpeta `Versiones/` de Drive y una fila en la hoja `Versiones`.
   - Estados: `Borrador` → `En revisión` → `Validado` → `Aprobado`.
   - Al aprobar: se incrementa la revisión (ej. Rev B a Rev C), se reemplaza la versión anterior y se publican automáticamente el Google Doc y el PDF en la carpeta `Publicadas/`.
   - Segregación de funciones: quien guardó un borrador no puede auto-aprobarlo a menos que en la hoja `Config` la clave `SEGREGACION` esté fijada en `NO`.

---

## 4. Instrucciones para Claude para Realizar Cambios

1. **Editar los archivos:** Modifica directamente los archivos dentro de la subcarpeta `proyecto/`.
2. **Hacer commit y push:**
   ```bash
   git add proyecto/
   git commit -m "descripción del cambio"
   git push origin main
   ```
3. **Despliegue automático:** GitHub Actions detectará el push y subirá los cambios a Google Apps Script automáticamente actualizando la versión de producción sin cambiar la URL `/exec`.
