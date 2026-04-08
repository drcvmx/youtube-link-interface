import { NextRequest, NextResponse } from "next/server";

// Constantes
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "llama3";

const getPromptTemplates = (sourceType: string) => {
  const context = sourceType === "audio" 
    ? "la siguiente transcripción de un archivo de audio"
    : "el siguiente documento o texto crudo";

  return {
    summary: `
Eres un asistente experto en análisis estratégico y síntesis de información.
Tu objetivo es proporcionar un RESUMEN EJECUTIVO detallado y profesional de ${context}.
Divide el resumen en 2 o 3 párrafos claros que cubran:
1. El propósito o tema principal.
2. Los puntos clave o argumentos desarrollados.
3. La conclusión o implicación final.
Mantén un tono formal, analítico y en ESPAÑOL.
Texto:
'{text}'
Resumen Ejecutivo: `,
    core_idea: `
Eres un estratega analista de alto nivel.
Después de procesar profundamente ${context}, identifica y explica la IDEA CENTRAL (el "core mission" o tesis fundamental).
No te limites a una frase corta; desarrolla la explicación en un párrafo potente y directo que capture la esencia real de la información en ESPAÑOL.
Texto:
'{text}'
Idea Central: `,
    pros_cons: `
Eres un evaluador crítico y exhaustivo.
Analiza ${context} e identifica TODOS los puntos positivos (pros/oportunidades) y negativos (contras/riesgos) mencionados o implícitos.
Tu análisis debe ser robusto y exhaustivo. Responde en ESPAÑOL siguiendo este formato:

PROS Y OPORTUNIDADES:
- [Punto 1]: Explicación detallada del beneficio.
- [Punto 2]: Explicación detallada del beneficio.

CONTRAS Y RIESGOS:
- [Punto 1]: Explicación detallada del riesgo detectado.
- [Punto 2]: Explicación detallada del riesgo detectado.

No inventes información que no esté sustentada en el texto.
Texto: '{text}'
Análisis Estructurado: `,
  };
};

async function queryOllama(prompt: string): Promise<string> {
  const payload = {
    model: MODEL_NAME,
    prompt,
    stream: false,
    options: {
      temperature: 0.7,
      repeat_penalty: 1.1,
      num_ctx: 8192,
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

export async function POST(request: NextRequest) {
  try {
    const { text, sourceType = "text" } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "No se proporcionó texto para analizar" }, { status: 400 });
    }

    // Aumentamos el límite de caracteres para procesar más contexto del archivo original
    const maxText = text.slice(0, 12000); 
    const prompts = getPromptTemplates(sourceType);

    const summary = await queryOllama(prompts.summary.replace("{text}", maxText));
    const coreIdea = await queryOllama(prompts.core_idea.replace("{text}", maxText));
    const prosCons = await queryOllama(prompts.pros_cons.replace("{text}", maxText));



    return NextResponse.json({
      analyzedFile: "Texto Libre (" + text.slice(0, 50).replace(/\\n/g, ' ') + "...)",
      timestamp: new Date().toISOString(),
      summary,
      coreIdea,
      prosCons
    });
  } catch (error: any) {
    console.error("Error in text analysis API:", error);
    return NextResponse.json(
      { error: "Error procesando el análisis de texto", details: error.message },
      { status: 500 }
    );
  }
}
