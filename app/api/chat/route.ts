import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL 
  ? process.env.OLLAMA_URL.replace("/generate", "/chat")
  : "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = process.env.MODEL_NAME || "llama3";
const NUM_CTX = 16384;

export async function POST(request: NextRequest) {
  try {
    const { messages, contextText, analysis } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No se proporcionó un historial de mensajes válido." }, { status: 400 });
    }

    // Construir el prompt del sistema con todo el contexto
    const safeContextText = (contextText || "").slice(0, 40000);
    const systemPrompt = `
Eres un asistente corporativo experto (Consultor IA). Acabas de analizar un documento/texto y el usuario te hará preguntas de seguimiento sobre él.

AQUÍ ESTÁ EL TEXTO ORIGINAL QUE ANALIZASTE:
"""
${safeContextText}
"""

AQUÍ ESTÁ EL ANÁLISIS QUE TÚ GENERASTE PREVIAMENTE:
Resumen Ejecutivo: ${analysis.summary}
Idea Central: ${analysis.coreIdea}
Pros y Contras: ${analysis.prosCons}

INSTRUCCIONES PARA TUS RESPUESTAS:
1. Responde SIEMPRE basándote en el texto original y el análisis proporcionado arriba.
2. Si la pregunta asume algo incorrecto o que no está en el texto, corrígelo cortésmente indicando qué dice el documento.
3. Sé directo, conciso y profesional.
4. Responde en ESPAÑOL.
5. No inventes información. Si no puedes responder con el contexto dado, di "El documento analizado no menciona detalles sobre...".
    `.trim();

    // Inyectar el system prompt al inicio de los mensajes
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const payload = {
      model: MODEL_NAME,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: NUM_CTX,
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
    
    return NextResponse.json({
      role: "assistant",
      content: data.message.content.trim(),
    });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Error procesando el chat", details: error.message },
      { status: 500 }
    );
  }
}
