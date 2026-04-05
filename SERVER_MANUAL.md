# 🖥️ Manual del Servidor "Monstruo" — CachyOS x86_64

> Documento de referencia para todos los proyectos actuales y futuros.
> Última actualización: Abril 2026.

---

## 📋 Especificaciones del Hardware

| Componente | Detalle |
|---|---|
| **OS** | CachyOS (Arch Linux) x86_64 |
| **CPU** | AMD Ryzen 5 5600X — 12 hilos @ 4.65 GHz |
| **GPU** | NVIDIA GeForce RTX 3060 — **12 GB VRAM** (CUDA 13.1) |
| **RAM** | 16 GB DDR4 |
| **Disco** | NVMe SSD 932 GB (BTRFS) — **~915 GB libres** |
| **Red** | Tailscale VPN (`100.105.47.25`) + WiFi local (`192.168.1.113`) |
| **Shell** | Fish 4.5.0 |
| **Acceso remoto** | `ssh oficinadrcv@100.105.47.25` |

---

## 🧩 Servicios Instalados

### 1. 🐳 Docker + Docker Compose
- **Propósito:** Orquestar todos los contenedores de servicios (Supabase, bases de datos, etc.)
- **Versión:** Docker 29.3.1 / Docker Compose 5.1.1
- **Estado:** Habilitado al arranque (`systemctl enable docker`)

```bash
# Verificar estado
docker ps                    # Contenedores activos
docker stats                 # Uso de recursos en tiempo real
```

---

### 2. 🧠 Ollama (Motor de Inteligencia Artificial)
- **Propósito:** Servir modelos LLM localmente usando la GPU (RTX 3060).
- **Puerto:** `http://127.0.0.1:11434`
- **Estado:** Habilitado al arranque (`systemctl enable ollama`)
- **Acceso desde laptop:** `http://100.105.47.25:11434`

```bash
# Comandos esenciales
ollama list                  # Ver modelos instalados
ollama ps                    # Ver modelo activo en GPU
ollama run llama3            # Iniciar chat interactivo
nvidia-smi                   # Verificar uso de VRAM
```

#### Modelos Instalados

| Modelo | Tamaño | Uso principal |
|---|---|---|
| `llama3` (8B) | ~4.7 GB | Análisis general, resúmenes ejecutivos, NLP empresarial |
| `qwen2.5:7b` | ~4.5 GB | Análisis de texto avanzado, mayor precisión que 1.5b |
| `qwen2.5:1.5b` | ~1 GB | Respuestas ultra-rápidas, tareas ligeras, prototipos |
| `qwen2.5-coder:7b` | ~4.5 GB | Generación de código (SQL, TypeScript, Python, Edge Functions) |
| `gemma3:4b` | ~2.5 GB | Clasificación, resúmenes cortos, modelo de Google |

> **Nota:** La RTX 3060 (12 GB VRAM) carga **un modelo a la vez**. Ollama intercambia entre ellos automáticamente en ~2 segundos.

#### ¿Qué modelo usar para cada tarea?

| Tarea | Modelo recomendado |
|---|---|
| Analizar transcripciones de video/audio | `llama3` o `qwen2.5:7b` |
| Resumir minutas y contratos legales | `llama3` |
| Clasificar correos o tickets de soporte | `gemma3:4b` |
| Generar descripciones de productos (B2B) | `qwen2.5:7b` |
| Generar SQL, Edge Functions, scripts | `qwen2.5-coder:7b` |
| Tareas ligeras y prototipos rápidos | `qwen2.5:1.5b` |

---

### 3. 🗄️ Supabase Local (Infraestructura Completa)
- **Propósito:** Base de datos PostgreSQL + Auth + Storage + Edge Functions + Realtime.
- **Ubicación del proyecto:** `~/proyectos/supabase-local/`
- **Sin límites** de almacenamiento, conexiones ni invocaciones.

#### Puertos y URLs

| Servicio | URL | Propósito |
|---|---|---|
| **Studio** (Dashboard) | `http://127.0.0.1:54323` | Administrar tablas, usuarios y storage visualmente |
| **API REST** | `http://127.0.0.1:54321/rest/v1` | CRUD desde el frontend |
| **Edge Functions** | `http://127.0.0.1:54321/functions/v1` | APIs serverless en TypeScript/Deno |
| **PostgreSQL** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Conexión directa a la DB |
| **GraphQL** | `http://127.0.0.1:54321/graphql/v1` | Queries GraphQL |
| **Storage S3** | `http://127.0.0.1:54321/storage/v1/s3` | Almacén de archivos (915 GB disponibles) |
| **Mailpit** | `http://127.0.0.1:54324` | Testing de emails |

> **Acceso desde laptop (Tailscale):** Reemplazar `127.0.0.1` por `100.105.47.25`.

```bash
# Comandos esenciales
cd ~/proyectos/supabase-local
supabase start               # Levantar todos los servicios
supabase stop                 # Detener todos los servicios
supabase status               # Ver URLs y claves activas
supabase db reset             # Resetear la base de datos
supabase functions serve      # Modo dev para Edge Functions
supabase functions deploy     # Desplegar funciones
```

#### Crear un nuevo proyecto Supabase

```bash
mkdir -p ~/proyectos/NOMBRE_PROYECTO && cd ~/proyectos/NOMBRE_PROYECTO
supabase init
# Editar supabase/config.toml para cambiar puertos (evitar conflicto con otros proyectos)
supabase start
```

---

## 🔄 Flujo de Trabajo: Arquitectura "Monster-Hybrid"

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 INTERNET (Usuario Final)                  │
│                                                                 │
│   Usuario → Vercel (Frontend Next.js/Astro)                     │
│                 │                                               │
│                 ▼                                               │
│         Cloudflare Tunnel (HTTPS cifrado, sin abrir puertos)    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│              🖥️ CachyOS "MONSTRUO" (Tu Servidor)                │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐                    │
│   │  Backend/API     │  │  Ollama (LLMs)   │                    │
│   │  FastAPI/NestJS  │──│  Puerto: 11434   │                    │
│   │  Puerto: 8000    │  │  GPU: RTX 3060   │                    │
│   └──────┬───────────┘  └──────────────────┘                    │
│          │                                                      │
│   ┌──────▼───────────────────────────────────────┐              │
│   │          Supabase Local (Docker)              │              │
│   │  PostgreSQL │ Auth │ Storage │ Edge Functions │              │
│   │  Puerto: 54321-54324                         │              │
│   └──────────────────────────────────────────────┘              │
│                                                                 │
│   🔒 Acceso dev desde laptop: Tailscale (100.105.47.25)         │
└─────────────────────────────────────────────────────────────────┘
```

### ¿Cómo fluye una petición en producción?

1. **Usuario** abre la web desplegada en **Vercel**.
2. Frontend hace `fetch()` al túnel de **Cloudflare**.
3. La petición entra cifrada al **CachyOS** vía `cloudflared`.
4. El **Backend** recibe la orden:
   - Guarda datos en **PostgreSQL** (Supabase).
   - Le pide análisis a **Ollama** (RTX 3060).
   - Genera un PDF si es necesario.
5. La respuesta viaja de vuelta por el túnel hasta el usuario.

### ¿Cómo fluye en desarrollo?

1. Desde la **laptop**, conectas vía **Tailscale** (`100.105.47.25`).
2. Accedes al **Dashboard Supabase** en `http://100.105.47.25:54323`.
3. Tu **Next.js local** apunta a las APIs del servidor.
4. No necesitas Cloudflare para desarrollo, Tailscale es suficiente.

---

## 🛠️ Comandos de Mantenimiento

```bash
# === ESTADO GENERAL ===
nvidia-smi                         # GPU y VRAM
docker ps                          # Contenedores Docker
ollama list                        # Modelos de IA
df -h                              # Espacio en disco
htop                               # CPU y RAM en tiempo real

# === REINICIAR SERVICIOS ===
sudo systemctl restart ollama      # Reiniciar Ollama
sudo systemctl restart docker      # Reiniciar Docker
cd ~/proyectos/supabase-local && supabase stop && supabase start  # Reiniciar Supabase

# === ACTUALIZAR ===
sudo pacman -Syu                   # Actualizar todo el sistema
ollama pull llama3                 # Actualizar un modelo específico
```

---

## 💰 Ahorro vs. Servicios en la Nube

| Servicio | Costo en la nube (mensual) | Costo en tu servidor |
|---|---|---|
| GPU para IA (AWS g4dn.xlarge) | ~$380 USD | **$0** |
| Supabase Pro | $25 USD | **$0** |
| PostgreSQL managed (RDS) | $50+ USD | **$0** |
| Storage 100 GB (S3) | $5 USD | **$0** |
| **Total estimado** | **~$460 USD/mes** | **Solo luz eléctrica** 💡 |
