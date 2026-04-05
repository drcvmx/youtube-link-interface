import { NextRequest, NextResponse } from "next/server";

// Constantes
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "qwen2.5:1.5b";

const getPromptTemplates = (sourceType: string) => {
  const context = sourceType === "audio" 
    ? "la siguiente transcripción de un archivo de audio"
    : "el siguiente documento o texto crudo";

  return {
    summary: `
Eres un asistente experto en resumir.
Resume ${context} en exactamente 2 oraciones concisas en ESPAÑOL.
Enfócate solo en la conclusión general y mantén un tono neutral.
Texto:
'{text}'
Resumen: `,
    core_idea: `
Eres un experto analista.
Extrae exactamente la IDEA CENTRAL (el mensaje o tesis principal) de ${context} en ESPAÑOL.
Responde con solo 1 oración potente y directa. No agregues saludos.
Texto:
'{text}'
Idea Central: `,
    pros_cons: `
Eres un asistente experto evaluador.
Basado estrictamente en ${context}, enumera exhaustivamente los PUNTOS POSITIVOS (Pros) y los PUNTOS NEGATIVOS (Contras) mencionados.
Responde en ESPAÑOL siguiendo este formato estricto:

PROS:
- (punto 1)
- (punto 2)

CONTRAS:
- (punto 1)
- (punto 2)

No inventes información que no esté en el texto.
Texto: '{text}'
Análisis: `,
  };
};

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

    const maxText = text.slice(0, 3000); 
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
