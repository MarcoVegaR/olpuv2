---
title: 'Guía de despliegue'
summary: 'Flujo de despliegue de código a producción: desde el commit local hasta la verificación en el servidor.'
icon: material/rocket-launch
tags:
    - how-to
    - devops
    - production
---

# Guía de despliegue

## Flujo de despliegue

```
[Máquina local]                [GitHub]              [Servidor producción]
      │                            │                        │
      ├── git push origin main ───►│                        │
      │                            │                        │
      ├── ssh <SSH_USER>@<IP_SERVIDOR> ────────────────────────────►│
      │                            │    cd /var/www/olpu    │
      │                            │    ./deploy.sh         │
      │                            │        │               │
      │                            │◄── git pull ───────────┤
      │                            │        │               │
      │                            │    composer install    │
      │                            │    npm ci + build:ssr  │
      │                            │    migrate             │
      │                            │    cache + restart     │
      │                            │        │               │
      │                            │    ✓ Site live         │
```

**Regla fundamental:** nunca se edita código directamente en el servidor. Todo pasa por GitHub.

---

## Conexión al servidor

```bash
# Desde tu máquina local (con llave SSH)
ssh -i ~/.ssh/<LLAVE_SSH> <SSH_USER>@<IP_SERVIDOR>

# Desde otra terminal (con contraseña)
ssh <SSH_USER>@<IP_SERVIDOR>
```

---

## Deploy normal (código nuevo)

### 1. En tu máquina local

```bash
# Asegúrate de que todo pasa tests y lint
npm run lint:ci
npm run typecheck
php artisan test

# Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

### 2. En el servidor

```bash
ssh -i ~/.ssh/<LLAVE_SSH> <SSH_USER>@<IP_SERVIDOR>
cd /var/www/olpu
./deploy.sh
```

El script ejecuta automáticamente:

1. `php artisan down` — modo mantenimiento
2. `git pull origin main` — descarga código nuevo
3. `composer install --no-dev` — dependencias PHP
4. `npm ci && npm run build:ssr` — dependencias Node + build de assets y SSR
5. `php artisan migrate --force` — migraciones nuevas
6. Cache de config, rutas y vistas
7. Permisos de storage
8. Reinicio de PHP-FPM, queue worker, SSR, Nginx
9. `php artisan up` — sale del modo mantenimiento
10. Verificación HTTP 200

---

## Deploy con reseed (fase de pruebas)

Durante los primeros 15 días de pruebas, si necesitas resetear la base de datos:

```bash
cd /var/www/olpu
./deploy.sh --fresh
```

Esto ejecuta `php artisan migrate:fresh --seed` que **destruye todos los datos** y vuelve a crear todo desde cero.

> **Importante:** el `TramitesCatalogSeeder` lee de `notes/fases/fase-1-catalogo-tramites.md`. Este archivo no está en el repositorio (está en `.gitignore`). Si necesitas actualizar el catálogo de trámites, copia el archivo manualmente:
>
> ```bash
> # Desde tu máquina local
> scp -i ~/.ssh/<LLAVE_SSH> -r notes/ <SSH_USER>@<IP_SERVIDOR>:/var/www/olpu/
> ```

---

## Transición de pruebas a producción definitiva

Cuando termine el período de pruebas:

1. **Último reseed con datos reales:**

    ```bash
    ./deploy.sh --fresh
    ```

2. **Verificar que todo funciona correctamente**

3. **A partir de ese momento:**

    - Solo usar `./deploy.sh` (sin `--fresh` ni `--seed`)
    - Las migraciones nuevas se aplican de forma incremental
    - **Nunca más** se ejecuta `migrate:fresh` (destruiría datos de producción)
    - Hacer backup antes de cada deploy (ver sección de backups)

4. **Recomendado:** eliminar la opción `--fresh` del script de deploy una vez que se entre en producción definitiva para evitar accidentes.

---

## Solo migraciones (sin rebuild de assets)

Si el cambio no afecta el frontend:

```bash
cd /var/www/olpu
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
sudo systemctl restart php8.3-fpm olpu-queue
```

---

## Solo frontend (sin migraciones)

Si el cambio es solo de frontend/React:

```bash
cd /var/www/olpu
git pull origin main
npm ci
npm run build:ssr
php artisan view:cache
sudo systemctl restart olpu-ssr
```

---

## Verificación post-deploy

```bash
# HTTP status
curl -sk -o /dev/null -w '%{http_code}' https://olpu.chacao.gob.ve/

# Servicios activos
sudo systemctl is-active olpu-queue olpu-ssr nginx php8.3-fpm

# Logs de errores recientes
sudo journalctl -u olpu-queue --since "5 min ago" --no-pager
sudo journalctl -u olpu-ssr --since "5 min ago" --no-pager
tail -20 /var/www/olpu/storage/logs/laravel.log
```

---

## Rollback

Si un deploy causa problemas:

```bash
cd /var/www/olpu

# Ver commits recientes
git log --oneline -5

# Revertir al commit anterior
git checkout <commit-hash>

# Rebuild y restart
composer install --no-dev --optimize-autoloader
npm ci && npm run build:ssr
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart php8.3-fpm olpu-queue olpu-ssr nginx
```

---

## Troubleshooting

### El sitio muestra error 502

```bash
# Verificar que PHP-FPM está corriendo
sudo systemctl status php8.3-fpm

# Verificar el socket
ls -la /run/php/php8.3-fpm.sock

# Reiniciar
sudo systemctl restart php8.3-fpm nginx
```

### SSR no arranca (window is not defined)

Significa que algún código del frontend usa `window` o `document` fuera de `useEffect`. Revisar los logs:

```bash
sudo journalctl -u olpu-ssr -n 50 --no-pager
```

La app sigue funcionando sin SSR (las páginas cargan por client-side rendering). Para desactivar SSR temporalmente:

```bash
sudo systemctl stop olpu-ssr
```

### Queue worker no procesa jobs

```bash
sudo journalctl -u olpu-queue -n 50 --no-pager

# Reiniciar
sudo systemctl restart olpu-queue

# Verificar que hay jobs pendientes
cd /var/www/olpu && php artisan queue:monitor default
```

### Cambios de .env no surten efecto

Después de editar `.env` en producción:

```bash
cd /var/www/olpu
php artisan config:cache
sudo systemctl restart php8.3-fpm olpu-queue olpu-ssr
```

### Certificado SSL expirado

```bash
# Verificar estado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# El timer debería renovar automáticamente
sudo systemctl status certbot.timer
```

---

## Comandos útiles

```bash
# Modo mantenimiento
php artisan down --retry=30
php artisan up

# Limpiar todas las caches
php artisan optimize:clear

# Ver workers de queue activos
php artisan queue:monitor default

# Tinker (consola interactiva)
php artisan tinker

# Estado de la BD
php artisan migrate:status
```
