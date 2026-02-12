---
title: 'Instalación del servidor de producción'
summary: 'Guía completa para crear y configurar la VM de producción en Proxmox con Ubuntu 24.04, Nginx, PHP-FPM, PostgreSQL, Node.js y SSL.'
icon: material/server
tags:
    - how-to
    - devops
    - production
---

# Instalación del servidor de producción

Esta guía documenta la infraestructura completa del servidor de producción de OLPU.

---

## Arquitectura

```
Internet → Cloudflare (DNS + SSL edge) → IP pública → Firewall (TCP 80,443)
    → <IP_SERVIDOR> (olpu-web VM)
        ├── Nginx :443 (SSL + reverse proxy)
        ├── PHP-FPM 8.3 (unix socket)
        ├── Node.js SSR :13714 (Inertia SSR)
        ├── PostgreSQL 16 :5432
        └── Queue Worker (systemd)
```

---

## Datos del servidor

| Campo            | Valor                                   |
| ---------------- | --------------------------------------- |
| **Proxmox host** | `pve-r450`                              |
| **VMID**         | 104                                     |
| **Nombre**       | `olpu-web`                              |
| **SO**           | Ubuntu 24.04.4 LTS (Noble Numbat)       |
| **IP**           | `<IP_SERVIDOR>`                         |
| **MAC**          | `<MAC_ADDRESS>`                         |
| **Bridge**       | vmbr1 (VLAN producción)                 |
| **CPU**          | 4 vCPU (host passthrough)               |
| **RAM**          | 4 GB                                    |
| **Disco**        | 32 GB SSD (local-lvm, thin provisioned) |
| **Dominio**      | olpu.chacao.gob.ve                      |
| **Usuario SSH**  | `<SSH_USER>`                            |
| **App path**     | /var/www/olpu                           |

---

## Stack instalado

| Componente     | Versión                   | Función                          |
| -------------- | ------------------------- | -------------------------------- |
| **Nginx**      | 1.24                      | Reverse proxy + SSL termination  |
| **PHP-FPM**    | 8.3.6                     | Procesamiento Laravel            |
| **PostgreSQL** | 16                        | Base de datos                    |
| **Node.js**    | 20 LTS                    | Inertia SSR + build de assets    |
| **Composer**   | 2.9.x                     | Gestión de dependencias PHP      |
| **Certbot**    | con plugin Cloudflare DNS | Certificados SSL auto-renovables |

---

## 1. Creación de la VM en Proxmox

La VM fue creada con una imagen cloud de Ubuntu 24.04 y cloud-init:

```bash
# Desde el host Proxmox (como root o con sudo)

# Descargar imagen cloud
wget -O /tmp/noble-cloudimg.img \
  https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img

# Crear VM
qm create 104 \
  --name olpu-web \
  --ostype l26 \
  --memory 4096 \
  --cores 4 \
  --sockets 1 \
  --cpu cputype=host \
  --net0 virtio,bridge=vmbr1 \
  --scsihw virtio-scsi-single \
  --agent enabled=1 \
  --onboot 1

# Importar imagen cloud como disco
qm importdisk 104 /tmp/noble-cloudimg.img local-lvm
qm set 104 --scsi0 local-lvm:vm-104-disk-0,discard=on,iothread=1,ssd=1

# Redimensionar a 32 GB
qm resize 104 scsi0 32G

# Agregar cloud-init
qm set 104 --ide2 local-lvm:cloudinit
qm set 104 --boot order=scsi0
qm set 104 --serial0 socket --vga serial0

# Configurar cloud-init
qm set 104 \
  --ciuser <SSH_USER> \
  --cipassword '<PASSWORD>' \
  --sshkeys /home/<SSH_USER>/.ssh/authorized_keys \
  --ipconfig0 ip=dhcp \
  --nameserver 8.8.8.8 \
  --searchdomain chacao.gob.ve

# Arrancar
qm start 104
```

> **Nota:** La MAC generada por Proxmox debe registrarse en el servidor DHCP para recibir IP en la VLAN de producción.

---

## 2. Acceso SSH

```bash
# Con llave SSH (desde la máquina de desarrollo)
ssh -i ~/.ssh/<LLAVE_SSH> <SSH_USER>@<IP_SERVIDOR>

# Con contraseña (desde otra terminal)
ssh <SSH_USER>@<IP_SERVIDOR>
```

---

## 3. Instalación de paquetes

```bash
# Base
sudo apt update && sudo apt install -y \
  software-properties-common curl wget gnupg2 unzip git acl ufw

# PHP 8.3 + extensiones Laravel
sudo apt install -y \
  php8.3-fpm php8.3-pgsql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-intl php8.3-bcmath php8.3-gd php8.3-readline \
  php8.3-opcache php8.3-cli

# Nginx
sudo apt install -y nginx

# PostgreSQL
sudo apt install -y postgresql postgresql-client

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Composer
curl -sS https://getcomposer.org/installer | sudo php -- \
  --install-dir=/usr/local/bin --filename=composer
```

---

## 4. Configuración de PHP-FPM

Editar `/etc/php/8.3/fpm/php.ini`:

```ini
upload_max_filesize = 20M
post_max_size = 25M
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 0
```

```bash
sudo systemctl restart php8.3-fpm
```

> **Nota:** `opcache.validate_timestamps=0` significa que PHP no revisa si los archivos cambiaron. Después de cada deploy hay que reiniciar PHP-FPM (el script `deploy.sh` lo hace automáticamente).

---

## 5. Configuración de PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER olpu_user WITH PASSWORD '<DB_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE olpu_prod OWNER olpu_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE olpu_prod TO olpu_user;"
```

---

## 6. Certificado SSL (Certbot + Cloudflare DNS)

```bash
# Instalar certbot con plugin Cloudflare
sudo apt install -y certbot python3-certbot-dns-cloudflare

# Configurar token de API de Cloudflare
sudo mkdir -p /root/.secrets/certbot
sudo tee /root/.secrets/certbot/cloudflare.ini > /dev/null << 'EOF'
dns_cloudflare_api_token = <CLOUDFLARE_API_TOKEN>
EOF
sudo chmod 600 /root/.secrets/certbot/cloudflare.ini

# Emitir certificado
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/certbot/cloudflare.ini \
  -d olpu.chacao.gob.ve \
  --non-interactive \
  --agree-tos \
  --email sistemasdti@chacao.gob.ve \
  --key-type ecdsa
```

El certificado se auto-renueva vía timer de systemd (`certbot.timer`).

---

## 7. Configuración de Nginx

Archivo: `/etc/nginx/sites-available/olpu.chacao.gob.ve`

```nginx
server {
    listen 80;
    server_name olpu.chacao.gob.ve;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name olpu.chacao.gob.ve;

    ssl_certificate /etc/letsencrypt/live/olpu.chacao.gob.ve/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/olpu.chacao.gob.ve/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    root /var/www/olpu/public;
    index index.php;

    client_max_body_size 20M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Inertia SSR - large response headers
    fastcgi_buffers 16 16k;
    fastcgi_buffer_size 32k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    # Vite build assets - immutable cache
    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location /storage/ {
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/olpu.chacao.gob.ve /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## 8. Servicios systemd

### Queue Worker (`/etc/systemd/system/olpu-queue.service`)

```ini
[Unit]
Description=OLPU Laravel Queue Worker
After=network.target postgresql.service

[Service]
User=mvega
Group=www-data
WorkingDirectory=/var/www/olpu
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Inertia SSR (`/etc/systemd/system/olpu-ssr.service`)

```ini
[Unit]
Description=OLPU Inertia SSR Server
After=network.target

[Service]
User=mvega
Group=www-data
WorkingDirectory=/var/www/olpu
ExecStart=/usr/bin/php artisan inertia:start-ssr
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now olpu-queue olpu-ssr
```

---

## 9. Deploy inicial de la aplicación

```bash
# Crear directorio
sudo mkdir -p /var/www/olpu
sudo chown mvega:www-data /var/www/olpu

# Generar llave SSH para GitHub deploy key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N '' -C 'sistemasdti@chacao.gob.ve'
# Agregar ~/.ssh/id_ed25519.pub como Deploy Key en GitHub (solo lectura)

# Clonar repositorio
ssh-keyscan github.com >> ~/.ssh/known_hosts
git clone git@github.com:MarcoVegaR/olpuv2.git /var/www/olpu
cd /var/www/olpu

# Instalar dependencias
composer install --no-dev --optimize-autoloader
npm ci
npm run build:ssr

# Configurar entorno
cp .env.example .env
php artisan key:generate
# Editar .env con valores de producción (ver sección .env abajo)

# Base de datos
php artisan migrate --force
php artisan db:seed --force  # Solo durante fase de pruebas

# Permisos y storage
php artisan storage:link
sudo chgrp -R www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 10. Variables de entorno de producción (.env)

```env
APP_NAME=OLPU
APP_ENV=production
APP_DEBUG=false
APP_URL=https://olpu.chacao.gob.ve
APP_TIMEZONE=America/Caracas
APP_LOCALE=es
APP_FALLBACK_LOCALE=es

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=olpu_prod
DB_USERNAME=olpu_user
DB_PASSWORD=<DB_PASSWORD>
DB_TIMEZONE=America/Caracas

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stack
LOG_STACK=daily

MAIL_MAILER=smtp
MAIL_HOST=<MAIL_SERVER_IP>
MAIL_PORT=25
MAIL_FROM_ADDRESS="olpu@chacao.gob.ve"
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 11. Red y firewall

| Componente           | Valor                               |
| -------------------- | ----------------------------------- |
| **VLAN**             | 1100 (10.0.100.0/24)                |
| **Gateway**          | DHCP                                |
| **DNS**              | 8.8.8.8                             |
| **Cloudflare**       | DNS proxy (naranja) → IP pública    |
| **Firewall externo** | TCP 80,443 → `<IP_SERVIDOR>`        |
| **Zimbra (correo)**  | `<MAIL_SERVER_IP>` (SMTP puerto 25) |

---

## 12. Verificación de servicios

```bash
# Estado de todos los servicios
sudo systemctl status olpu-queue olpu-ssr nginx php8.3-fpm postgresql

# Logs del queue worker
sudo journalctl -u olpu-queue -f

# Logs del SSR
sudo journalctl -u olpu-ssr -f

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Logs de Laravel
tail -f /var/www/olpu/storage/logs/laravel.log

# Test HTTP
curl -sk -o /dev/null -w '%{http_code}' https://olpu.chacao.gob.ve/
```

---

## 13. Backups

### Base de datos (cron diario)

```bash
# /etc/cron.d/olpu-backup
0 2 * * * mvega pg_dump -U olpu_user olpu_prod | gzip > /tmp/olpu_db_$(date +\%F).sql.gz
```

### Proxmox snapshots

Se recomienda configurar backups automáticos de la VM 104 en Proxmox apuntando al storage `truenas-backups` (NFS montado en `/mnt/pve/truenas-backups`).
