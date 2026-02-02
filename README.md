# OLPv2 — Sistema de Trámites (Planeamiento Urbano)

Sistema para gestionar trámites administrativos desde su ingreso por taquilla hasta su culminación, con dos objetivos principales:

- **Autenticidad del documento final** mediante **QR** y verificación pública.
- **Seguimiento ciudadano** por **tracking number**, sin acceso al backoffice.

## Punto de partida: qué ya cubre el boilerplate

Este proyecto parte de un boilerplate Laravel 12 + Inertia + React/TypeScript que ya trae resueltos componentes clave para construir el sistema.

Backend:

- **Laravel 12** con estructura modular de rutas.
- **Autenticación** con Fortify (incluye **2FA**) y control de usuarios activos.
- **RBAC** con Spatie Permission (roles/permisos) + policies.
- **Auditoría** con owen-it/laravel-auditing (incluye eventos de login/logout).
- **Rate limiting** para acciones sensibles (auth, exportaciones, bulk).
- **Patrones**: Service/Repository + DTOs + index/export/bulk estandarizados.

Frontend:

- **Inertia.js + React + TypeScript**.
- **Tailwind CSS v4** + shadcn/ui + Radix UI.
- Páginas y patrón de **DataTable** (server-side) listo para módulos.

Módulos base incluidos:

- **Usuarios** (CRUD, export, bulk, setActive).
- **Roles** (CRUD, export, bulk, setActive).
- **Auditoría** (index/export).
- **Settings** (perfil, password, seguridad/sesiones, apariencia).

DevEx / Calidad:

- Lint/format (Pint, ESLint, Prettier), typecheck, tests (Pest, Vitest).
- CI para tests y lint.
- Documentación con MkDocs.
- `make:catalog` para generar módulos full-stack siguiendo convenciones.

## Roadmap conceptual (hacia dónde vamos)

### Fase 0 — Preparación (alineación + diseño)

- Validar catálogo final de trámites (23/24) y requisitos por tipo.
- Definir estados/fases, reglas de retorno por correcciones, tracking y número de recepción.
- Definir contenido mínimo público para tracking y verificación QR (anti-“quishing”).

### Fase 1 — MVP (orden + trazabilidad + portal público básico)

- Backoffice: creación de expediente en taquilla, asignaciones, inspección/evidencias, respuesta y decisión.
- Portal público: requisitos por trámite, consulta por tracking, verificación QR.
- Generación de **QR desde recepción** (descargable como imagen para transición con Word/PDF).

### Fase 2 — Iteración (calidad operativa + documentos + notificaciones)

- Plantillas para planilla/decisión con QR.
- Reglas por fase, retornos controlados, bitácora de correcciones (tracking/n° recepción) por Admin.
- Notificaciones por email y reportes básicos por fase.

### Fase 3 — Escalado (integraciones + endurecimiento)

- Integración con sistema catastral, endurecimiento de privacidad/retención, métricas avanzadas.

## Roadmap técnico / arquitectura (general)

Dominio y módulos principales (backend + frontend):

- **Solicitantes** (natural/jurídico) + representación de “autorizado/tercero” vía recaudo.
- **Trámites/Expedientes** (tracking, n° recepción, fechas, tipo de trámite, estado/fase).
- **Catálogo de trámites** (con requisitos y reglas: inspección aplica/no aplica, tipos con vigencia, copias certificadas).
- **Recaudos/Adjuntos** (checklist + evidencias y documentos habilitantes).
- **Inspección** (0/1 por trámite) + evidencias.
- **Documentos emitidos** (planilla de recepción, decisión final, verificación QR).

Portal público (sin login):

- **Requisitos por trámite** (catálogo público).
- **Tracking público** (estado/fase + fechas relevantes, sin PII).
- **Verificación QR** (contenido mínimo, claro y antifraude).

Seguridad y trazabilidad:

- Policies/permisos por fase y acciones críticas.
- Auditoría/timeline del expediente (eventos de negocio + auditoría técnica).
- Mecanismo de correcciones controladas (solo Admin) para tracking/n° recepción con registro.

Operación:

- Estrategia de almacenamiento de archivos (evidencias/documentos), límites y retención.
- Notificaciones y colas (email/queue).
- Reportes operativos (bandejas por fase, tiempos promedio).

## Documentación

- Fuentes: directorio `docs/` (MkDocs).
- Arquitectura (punto de partida): `docs/arquitectura.md`.
- Servir docs local:

```bash
npm run docs:serve
```

Nota: el roadmap interno detallado se mantiene como documento local y no se versiona.

## Requisitos

- PHP 8.2+ (testeado en 8.3)
- Composer 2.x
- Node.js 20+ y npm

## Instalación mínima

```bash
# Variables de entorno y clave
cp .env.example .env
php artisan key:generate

# Dependencias
composer install
npm install

# Base de datos (PostgreSQL por defecto)
php artisan migrate --seed

# Build inicial de frontend (una vez)
npm run build
```

## Desarrollo local

```bash
# Levanta Laravel + Vite + Queue + Logs
composer run dev
```

- App: http://127.0.0.1:8001
- Vite con recarga en caliente mediante `laravel-vite-plugin`.

## Alcance del README

Este README describe:

- qué es el sistema y el punto de partida del boilerplate,
- en qué estado estamos hoy,
- y el roadmap conceptual + técnico (general).

La documentación detallada (patrones BE/FE, CI/CD, testing, etc.) vive en `docs/`.

## Contribuir

PRs bienvenidas. Revisa la documentación en `docs/` y las convenciones del proyecto.

## Licencia

MIT — ver [LICENSE](LICENSE).

Si encuentras una vulnerabilidad, por favor abre un Issue privado (o un Security Advisory en GitHub cuando esté habilitado). No publiques detalles de explotación antes de un parche.
