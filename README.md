# 🧠 Private AI Analysis Suite

Una plataforma integral y **100% offline** (privacy-first) diseñada para extraer, transcribir y analizar información clave desde múltiples fuentes multimedia utilizando Inteligencia Artificial local.

---

## 🚀 Capacidades Principales

El sistema está construido en torno a una arquitectura modular que procesa tres tipos de entrada distintos:

1. **📹 Análisis de YouTube (Scraping & AI)**
   - Ingresa cualquier enlace de YouTube.
   - El sistema de backend extrae automáticamente la transcripción oficial del video (en español o inglés).
   - Envía el texto al modelo de IA local para generar Resúmenes Ejecutivos, Ideas Centrales y tablas de Pros y Contras estructuradas.

2. **📄 Análisis de Documentos Crudos**
   - Panel de entrada directa para pegar contratos legales, políticas de recursos humanos, artículos de noticias largas o un mar de reseñas de usuarios.
   - Contexto de IA dinámicamente adaptado para procesamiento de lectura y extracción analítica de data plana.

3. **🎙️ Transcripción y Análisis de Audio Local**
   - Sube archivos locales directamente desde tu máquina (`.mp3`, `.wav`, `.m4a`).
   - El backend utiliza el motor neuronal **OpenAI Whisper** (corriendo localmente, sin enviar ni un solo dato a la nube) para generar una transcripción perfecta.
   - Pasa automáticamente el texto extraído al motor de IA para su respectivo análisis ejecutivo.

4. **📄 Generación de Reportes PDF Premium**
   - Integración nativa con `WeasyPrint` en el backend para renderizar archivos PDF estilizados y listos para entregar a clientes o directivos.
   - El motor PDF es inteligente: maqueta y adapta su esquema de diseño dependiendo del origen de los datos (formato dinámico para YouTube, Texto Libre o Meeting de Audio).

---

## 🛠️ Stack Tecnológico

El proyecto rompe el monolito tradicional dividiéndose en tres engranajes principales que se comunican nativamente de forma asíncrona:

### Frontend (User Interface)
- **Framework:** Next.js 14+ con App Router.
- **Estilos:** Tailwind CSS con variables semánticas HSL y adaptaciones de componentes de **Shadcn UI**.
- **Diseño:** Interfaz minimalista fijada en Modo Oscuro absoluto, tablero de 3 pestañas y alertas interactivas.
- **Orquestador IA:** Los endpoints de `api/youtube` y `api/analyze-text` se encargan de hacer la ingeniería de prompt y comunicarse internamente con Ollama.

### Backend (Python Flask)
- **Framework REST:** Flask + Flask-CORS (`app.py`).
- **Scraping de Subs:** `youtube-transcript-api`.
- **Motor In-House Audio:** `openai-whisper` + manejo de binarios temporales.
- **Motor Print:** `WeasyPrint` renderizando plantillas de lenguaje de marcas HTML directamente a la memoria (BytesIO) del servidor, logrando PDFs al vuelo sin escribir en disco.

### Motor de Inteligencia (Local-Host)
- **Engine:** `Ollama` corriendo nativamente.
- **Modelo LLM:** `qwen2.5:1.5b` (optimizado en penalización de repetición y temperatura exacta para evitar bucles o alucinaciones y mantener máxima velocidad de respuesta).

---

## ⚙️ Despliegue en Producción (Arquitectura V2)

Esta versión V2 rompió la dependencia de `localhost` estricta para adoptar un aislamiento de grado B2B usando base de datos propia, proxy de Cloudflare, Autenticación y Cifrado Remoto.

### 1. Variables de Entorno `.env`
El núcleo de la aplicación depende de este archivo en la raíz del proyecto para ensamblar los componentes de Next.js.
```bash
NEXT_PUBLIC_SUPABASE_URL=https://db.tu-dominio.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey... (Suministrada por Supabase)
NEXT_PUBLIC_PYTHON_API_URL=https://backend.tu-dominio.com

OLLAMA_URL=http://localhost:11434/api/generate
MODEL_NAME=qwen2.5:1.5b
```

### 2. Capa de Base de Datos (Supabase Local Docker)
En el servidor Cachy OS, nos aseguramos que el clúster de base de datos corra constantemente:
```bash
cd ~/proyectos/supabase-local
supabase start
```

### 3. Capa de Procesamiento Físico (Backend de Python)
Abre una terminal, activa el entorno virtual y deja el bloque despachador de inteligencia corriendo:
```bash
cd python-backend
source venv/bin/activate.fish
pip install -r requirements.txt
python app.py
```
*(Corre puramente en Memoria RAM con `io.BytesIO`, evitando latencia de lecturas y escrituras L2 en discos duros al general Pdfs/Audios).*

### 4. Capa Visual y Despliegue Público (Next.js & Cloudflared)
Con los túneles Cloudflare y el entorno listo, se compilan y publican los nodos HTML interactivos de manera definitiva:
```bash
npm install
npm run build
npm start
```
*Si tienes el daemon de `cloudflared service` instalado apuntando a tu puerto 3000, 5000 y 54321, el sistema está oficialmente online accesible por TLS/HTTPS de punta a punta globalmente.*

---

## 🛡️ Seguridad y Enfoque B2B

Este proyecto está diseñado específicamente para entornos corporativos, firmas legales o centros de salud donde **la confidencialidad de la información es crítica**. 

Al procesar todo localmente (incluyendo inferencia de lenguaje, transcripción de audio vocal y ensamblaje de reportes PDF), **0 bytes de datos abandonan el servidor físico**. Esto significa privacidad total con cumplimiento (GDPR, HIPAA friendly) pero contando con el poder de análisis cognitivo de la IA de última generación.
