import { NextRequest, NextResponse } from "next/server";

// ── Configuración del Motor IA ──────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "llama3";

// RTX 3060 12GB VRAM → Llama 3 8B usa ~5GB, sobra para 16K de contexto
const NUM_CTX = 16384;
const MAX_INPUT_CHARS = 50000;

// ── Prompts por tipo de fuente ──────────────────────────────────────
const getSourceLabel = (sourceType: string): string => {
  switch (sourceType) {
    case "youtube": return "la transcripción de un video de YouTube";
    case "audio": return "la transcripción de una grabación de audio";
    case "document": return "el contenido extraído de un documento (PDF/DOCX/XLSX)";
    default: return "el siguiente texto proporcionado";
  }
};

const getPromptTemplates = (sourceType: string) => {
  const source = getSourceLabel(sourceType);

  return {
    summary: `Eres un analista senior de inteligencia corporativa. Tu trabajo es leer ${source} y producir un RESUMEN EJECUTIVO completo y profesional en ESPAÑOL.

INSTRUCCIONES:
- Escribe entre 3 y 5 párrafos bien desarrollados.
- Párrafo 1: Contexto general — ¿De qué trata? ¿Cuál es el tema, producto, situación o problema central?
- Párrafo 2-3: Desarrollo — Explica los argumentos principales, datos relevantes, cifras concretas, nombres mencionados y decisiones clave.
- Párrafo 4-5: Conclusiones e implicaciones — ¿Qué se concluye? ¿Qué impacto tiene? ¿Qué debería hacer el lector con esta información?
- Incluye datos específicos (cifras, porcentajes, fechas, nombres) cuando aparezcan en el texto.
- NO resumas en una sola oración. Desarrolla cada punto con profundidad.
- Tono: formal, directo, ejecutivo.

TEXTO A ANALIZAR:
"""
{text}
"""

RESUMEN EJECUTIVO:`,

    core_idea: `Eres un estratega de alto nivel especializado en extraer la tesis fundamental de cualquier contenido. Analiza ${source} y responde en ESPAÑOL.

INSTRUCCIONES:
- Identifica la TESIS CENTRAL: el mensaje más importante que el autor o emisor quiere comunicar.
- Desarrolla esta idea en 2-3 párrafos completos, no en una frase superficial.
- Explica POR QUÉ esta es la idea central y qué evidencia del texto la sustenta.
- Si hay una propuesta de valor, una advertencia crítica o una oportunidad de negocio implícita, destácala.
- Cierra con una reflexión sobre la relevancia práctica de esta idea para quien lee este reporte.

TEXTO A ANALIZAR:
"""
{text}
"""

TESIS CENTRAL:`,

    pros_cons: `Eres un auditor crítico y analítico. Tu trabajo es diseccionar ${source} identificando con precisión todos los elementos positivos y negativos. Responde en ESPAÑOL.

INSTRUCCIONES:
- Sé exhaustivo: identifica al menos 4-6 puntos en cada categoría cuando el texto lo permita.
- Cada punto debe incluir: el hallazgo concreto + una explicación de por qué es relevante.
- Basa cada punto estrictamente en información presente en el texto. No inventes.
- Si detectas riesgos implícitos o oportunidades no mencionadas directamente pero evidentes por el contexto, márcalos como "[Implícito]".

USA ESTE FORMATO EXACTO:

FORTALEZAS Y OPORTUNIDADES:
• [Punto]: Explicación desarrollada del beneficio o ventaja detectada.
• [Punto]: Explicación desarrollada del beneficio o ventaja detectada.

DEBILIDADES Y RIESGOS:
• [Punto]: Explicación desarrollada del problema o amenaza detectada.
• [Punto]: Explicación desarrollada del problema o amenaza detectada.

VEREDICTO FINAL:
Un párrafo breve con tu evaluación global: ¿el balance general es positivo o negativo? ¿Qué acción recomendarías?

TEXTO A ANALIZAR:
"""
{text}
"""

ANÁLISIS ESTRUCTURADO:`,
  };
};

// ── Motor de Inferencia ─────────────────────────────────────────────
async function queryOllama(prompt: string): Promise<string> {
  const payload = {
    model: MODEL_NAME,
    prompt,
    stream: false,
    options: {
      temperature: 0.7,
      repeat_penalty: 1.15,
      num_ctx: NUM_CTX,
      num_thread: 6,
    },
  };

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Ollama API error: " + res.statusText);
  }

  const data = await res.json();
  return data.response.trim();
}

// ── Endpoint Principal ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { text, sourceType = "text" } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "No se proporcionó texto para analizar" }, { status: 400 });
    }

    // Sin límites artificiales — la GPU aguanta
    const inputText = text.slice(0, MAX_INPUT_CHARS);
    const prompts = getPromptTemplates(sourceType);

    const summary = await queryOllama(prompts.summary.replace("{text}", inputText));
    const coreIdea = await queryOllama(prompts.core_idea.replace("{text}", inputText));
    const prosCons = await queryOllama(prompts.pros_cons.replace("{text}", inputText));

    return NextResponse.json({
      analyzedFile: sourceType === "youtube" 
        ? text.slice(0, 80) 
        : `${sourceType.toUpperCase()}: ${text.slice(0, 60).replace(/\n/g, ' ')}...`,
      timestamp: new Date().toISOString(),
      summary,
      coreIdea,
      prosCons,
    });
  } catch (error: any) {
    console.error("Error in text analysis API:", error);
    return NextResponse.json(
      { error: "Error procesando el análisis de texto", details: error.message },
      { status: 500 }
    );
  }
}

