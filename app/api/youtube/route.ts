import { NextResponse, NextRequest } from "next/server"
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const OLLAMA_API_URL = "http://localhost:11434/api/generate"
const MODEL_NAME = "qwen2.5:1.5b"
// const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Ya no necesitamos la clave de API de YouTube

const PROMPT_TEMPLATES = {
  summary: `
Eres un asistente experto en resumir.
Resume los subtítulos de este video de YouTube en exactamente 2 oraciones concisas en ESPAÑOL.
Enfócate solo en la conclusión general del video y mantén un tono neutral.
Texto principal (transcripción):
'{text}'
Resumen: `,
  core_idea: `
Eres un experto analista de contenido.
Extrae exactamente la IDEA CENTRAL (el mensaje o tesis principal) del creador del video de YouTube basándote en la siguiente transcripción en ESPAÑOL.
Responde con solo 1 oración potente y directa. No agregues saludos.
Transcripción del video:
'{text}'
Idea Central: `,
  pros_cons: `
Eres un asistente experto evaluador de videos.
Basado estrictamente en la transcripción de este video de YouTube, enumera exhaustivamente los PUNTOS POSITIVOS (Pros) y los PUNTOS NEGATIVOS (Contras) del producto o tema analizado en el video.
Responde en ESPAÑOL siguiendo este formato estricto:

PROS:
- (punto 1)
- (punto 2)

CONTRAS:
- (punto 1)
- (punto 2)

No inventes información que no esté en el video.
Texto (Transcripción): '{text}'
Análisis: `,
}

export async function POST(request: NextRequest) {
  try {
    const { transcriptionFilePath } = await request.json(); // Obtener la ruta del archivo de transcripción del cuerpo de la solicitud

    if (!transcriptionFilePath) {
      return NextResponse.json({ error: "No se proporcionó la ruta del archivo de transcripción." }, { status: 400 });
    }

    // Construir la ruta completa al archivo de transcripción en el directorio público
    const fullTranscriptionFilePath = path.join(process.cwd(), 'public', transcriptionFilePath);

    const fileContent = await readLocalTextFile(fullTranscriptionFilePath);

    if (!fileContent) {
      return NextResponse.json({ error: `No se pudo leer el archivo de transcripción: ${transcriptionFilePath}.` }, { status: 500 });
    }

    const summary = await queryOllama(PROMPT_TEMPLATES.summary.replace("{text}", fileContent.slice(0, 3000)));
    const coreIdea = await queryOllama(PROMPT_TEMPLATES.core_idea.replace("{text}", fileContent.slice(0, 3000)));
    const prosCons = await queryOllama(PROMPT_TEMPLATES.pros_cons.replace("{text}", fileContent.slice(0, 3000)));

    let savedFilePath: string | null = null;
    const textContentForSave = `Análisis de: ${transcriptionFilePath}\n\nResumen:\n${summary}\n\nIdea Central:\n${coreIdea}\n\nPros y Contras:\n${prosCons}`;
    const fileName = `analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const filePathForSave = path.join(process.cwd(), 'public', fileName);
    try {
      await writeFile(filePathForSave, textContentForSave, 'utf-8');
      savedFilePath = `/${fileName}`; // Ruta pública para descarga
      console.log(`Análisis guardado en ${savedFilePath}`);
    } catch (fileError: any) {
      console.error(`Error al guardar el archivo de análisis: ${fileError.message}`);
      savedFilePath = null;
    }

    return NextResponse.json({
      analyzedFile: transcriptionFilePath, // Reflejar la ruta del archivo de entrada
      timestamp: new Date().toISOString(),
      savedFilePath,
      summary,
      coreIdea,
      prosCons
    });
  } catch (error: any) {
    console.error("Error in local text file analysis API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// ------------------ Helpers ------------------

// Eliminamos extractVideoId y fetchSubtitles ya que no estamos procesando videos

async function readLocalTextFile(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error: any) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

async function queryOllama(prompt: string): Promise<string> {
  const payload = {
    model: MODEL_NAME,
    prompt,
    stream: false,
    options: {
      temperature: 0.5,
      repeat_penalty: 1.2,
      num_ctx: 2048,
      num_thread: 4,
    },
  }

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.response.trim()
  } catch (error: any) {
    console.error("Ollama query error:", error)
    throw error
  }
}
