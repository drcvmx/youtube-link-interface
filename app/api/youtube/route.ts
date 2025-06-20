import { NextResponse, NextRequest } from "next/server"
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const OLLAMA_API_URL = "http://localhost:11434/api/generate"
const MODEL_NAME = "tinyllama"
// const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Ya no necesitamos la clave de API de YouTube

const PROMPT_TEMPLATES = {
  summary: `
    Summarize this text in 2 concise sentences.
    Focus on key facts and maintain neutral tone.
    Text: '{text}'
  `,
  key_points: `
    Extract the TOP 3 KEY POINTS from this text.
    Use bullet points (-) and be factual.
    Text: '{text}'
  `,
  sentiment: `
    Classify the sentiment of this text as:
    - "POS" (Positive)
    - "NEG" (Negative) 
    - "NEU" (Neutral)
    Respond ONLY with one of these 3 labels.
    Text: '{text}'
  `,
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
    const keyPoints = await queryOllama(PROMPT_TEMPLATES.key_points.replace("{text}", fileContent.slice(0, 3000)));
    const sentimentSummary = await queryOllama(PROMPT_TEMPLATES.sentiment.replace("{text}", summary));
    const sentimentPoints = await queryOllama(PROMPT_TEMPLATES.sentiment.replace("{text}", keyPoints));

    let savedFilePath: string | null = null;
    const textContentForSave = `Análisis de: ${transcriptionFilePath}\n\nResumen:\n${summary}\n\nPuntos Clave:\n${keyPoints}\n\nSentimiento (Resumen): ${sentimentSummary}\nSentimiento (Puntos Clave): ${sentimentPoints}`;
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
      summary: {
        text: summary,
        sentiment: sentimentSummary,
      },
      key_points: {
        text: keyPoints,
        sentiment: sentimentPoints,
      },
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
      temperature: 0.3,
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
