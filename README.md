# 🧠 Private AI Analysis Suite

Una plataforma integral y **100% offline** (privacy-first) diseñada para extraer, transcribir y analizar información clave desde múltiples fuentes multimedia utilizando Inteligencia Artificial local.

---

## 🚀 ¿Qué podemos hacer hoy? (Capacidades Actuales)

El sistema está operativo y construido en torno a una arquitectura modular que procesa tres canales principales de entrada:

1. **📹 Análisis de YouTube (Scraping & AI)**
   - Ingresa cualquier enlace de YouTube.
   - El sistema de backend extrae automáticamente la transcripción oficial del video (en español o inglés).
   - Envía el texto al modelo de IA local para generar Resúmenes Ejecutivos, Ideas Centrales y tablas de Pros y Contras estructuradas.

2. **📄 Análisis de Documentos Crudos (LegalTech & E-commerce)**
   - Panel de entrada directa para analizar o auditar contratos legales masivos de hasta 50 páginas.
   - Procesa políticas corporativas o miles de reseñas (reviews) extraídas de e-commerce.
   - Contexto de IA dinámicamente adaptado para lectura y extracción de puntos clave u obligaciones contractuales.

3. **🎙️ Transcripción y Análisis de Reuniones (Oídos Privados)**
   - Sube archivos de audio (horas de metraje o llamadas de ventas) directamente desde tu máquina (`.mp3`, `.wav`, `.m4a`).
   - El backend utiliza el motor neuronal **OpenAI Whisper** (offline puro) para generar una transcripción perfecta.
   - Genera minutas automáticas y detecta Acuerdos Clave (Next Steps) manteniendo la privacidad corporativa absoluta.

4. **📄 Generación de Reportes PDF Premium**
   - Integración nativa con `WeasyPrint` en el backend para renderizar archivos PDF estilizados y listos para entregar a C-Levels.
   - El motor PDF es inteligente: maqueta y adapta su diseño automáticamente (formato para YouTube, Texto Libre o Meeting de Audio).

---

## 🔮 ¿Qué haremos en el futuro? (Roadmap Estratégico)

Nuestra visión apunta a convertir este ecosistema en el máximo **Monstruo Analítico Local** para empresas. Las futuras iteraciones incluirán:

1. **🤖 Agentes de "Customer Support Monitoring":**
   - Alimento masivo de horas procedentes del Call Center para que el modelo detecte de forma proactiva el nivel de frustración del cliente y califique al agente.

2. **📈 Inteligencia Competitiva E-commerce Automatizada:**
   - Módulos para arrastrary/deglutir miles de reviews de la competencia y extraer automáticamente los "Top 3 dolores de cabeza del usuario" para capitalizarlos masivamente.

3. **🔌 Pipelines de Integración "Hands-Free":**
   - Transmisión o conexión de captura para conferencias virtuales y llamadas (Zoom/Teams), absorbiendo de manera transparente el material hacia *La Bóveda* sin necesidad de estar subiendo archivos manuales.

4. **🧠 Escalabilidad hacia Infraestructura de Inferencia Pesada:**
   - Soporte "Plug and Play" para modelos más poderosos como **Llama 3 (8B)** o **Qwen 2.5 (14B)** para usuarios que inyecten más VRAM a la arquitectura física del servidor.

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
