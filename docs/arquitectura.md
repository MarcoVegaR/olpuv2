# Arquitectura (punto de partida)

## 1. Propósito del boilerplate

Este repositorio sirve como punto de partida para nuevos proyectos, entregando una aplicación Laravel moderna tipo panel administrativo con frontend React vía Inertia (sin API separada por defecto), módulos base listos, patrones reutilizables para CRUD/Index/Export/Bulk y un flujo de trabajo de calidad (lint, tests, docs, releases).

## 2. Stack tecnológico

### 2.1 Backend

- **PHP**: ^8.2
- **Framework**: Laravel 12
- **Autenticación**: Laravel Fortify (incluye 2FA)
- **SPA Bridge**: Inertia Laravel v2
- **Autorización (RBAC)**: spatie/laravel-permission v6
- **Auditoría**: owen-it/laravel-auditing v14
- **Rutas para el frontend**: tightenco/ziggy
- **Testing**: Pest v3
- **Calidad**: Pint, PHPStan/Larastan, Rector

### 2.2 Frontend

- **React**: ^19
- **TypeScript**: ^5.7
- **Inertia React**: v2
- **Build tool**: Vite v6 + laravel-vite-plugin
- **Styling**: Tailwind CSS v4 + tokens por variables CSS
- **UI kit**: shadcn/ui + Radix UI
- **Tablas**: TanStack Table (server-side)
- **Notificaciones**: Sonner
- **Testing**: Vitest + Testing Library
- **Calidad**: ESLint + Prettier

### 2.3 Infra por defecto (local)

- **Base de datos**: PostgreSQL
- **Session/Queue/Cache**: database (por defecto)

## 3. Arquitectura y patrones

### 3.1 Flujo principal (por módulo)

Convención dominante:

- **Controller** (Inertia) → **Form Requests / DTOs** → **Service** → **Repository** → **Model**

Objetivo:

- Controladores delgados
- Servicios como capa de lógica de negocio
- Repositorios para consultas y acceso a datos

### 3.2 Módulos con capacidades estándar: Index / Export / Bulk

Los controladores de módulos suelen extender `BaseIndexController` y usar el trait `HandlesIndexAndExport` para estandarizar:

- **Index**: búsqueda, filtros, sorting, paginación
- **Export**: exportación (csv/xlsx/json según configuración)
- **Bulk**: acciones masivas (delete/restore/forceDelete/setActive)
- **Selected**: carga de entidades seleccionadas por id/uuid

### 3.3 Concurrencia y consistencia

- **Optimistic locking** en la capa de servicio (actualizaciones)
- **Pessimistic locking** en la capa de repositorio (operaciones críticas)

### 3.4 Manejo de errores (orientado a Inertia)

- Páginas Inertia para errores HTTP comunes (403/404/500) cuando aplica
- Excepciones de dominio tienden a resolverse con respuesta compatible con Inertia y mensajes flash

## 4. Seguridad

### 4.1 Autenticación

- Fortify con 2FA habilitado
- Registro público deshabilitado por convención (provisión de usuarios por admin)
- Regla adicional: solo usuarios activos pueden autenticarse

### 4.2 Autorización

- RBAC basado en permisos (Spatie)
- Policies registradas para modelos clave
- Middleware `permission` en rutas de módulos

### 4.3 Rate limiting

- Rate limiters para login, reset password, 2FA
- Rate limiters para exportaciones y acciones masivas

## 5. Observabilidad y auditoría

- Auditoría basada en eventos de modelo (created/updated/deleted/restored)
- Auditoría de eventos de autenticación (login/logout)
- `RequestId` middleware para trazar requests y correlacionar logs

## 6. Módulos existentes (base)

- **Usuarios**: gestión CRUD, export, bulk, setActive
- **Roles**: gestión CRUD, export, bulk, setActive
- **Auditoría**: index/export (read-only)
- **Settings**: perfil, password, apariencia, seguridad/sesiones

## 7. Generación de módulos (catálogos)

Existe un comando Artisan para scaffolding de módulos tipo catálogo que genera backend y frontend siguiendo las convenciones del boilerplate (rutas, permisos, requests, policy, controller, service, repository, páginas React, menú).

## 8. Convenciones del proyecto

- Rutas web modulares (`routes/*.php`)
- Permisos modulares (`config/permissions/*.php`) y seeding centralizado
- Props compartidas vía middleware Inertia (usuario, permisos, flash, requestId)

## 9. Workflows (DX/CI)

- Scripts de desarrollo para correr servidor, Vite, queue y logs
- CI para lint + tests
- Docs con MkDocs + guard para exigir actualizaciones cuando se cambian piezas sensibles
- Releases automáticas con semantic-release

## 10. Hoja de ruta (pendiente)

- Por definir.

## 11. Roadmap por fases (pendiente)

- Por definir.
