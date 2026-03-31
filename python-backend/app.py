from flask import Flask, request, jsonify, send_file, render_template_string
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
import os
import io
import tempfile
import uuid
from flask_cors import CORS

try:
    from weasyprint import HTML
except ImportError:
    HTML = None

try:
    import whisper
    print("Cargando modelo Whisper (tiny)...")
    whisper_model = whisper.load_model("tiny")
except ImportError:
    whisper_model = None

app = Flask(__name__)
CORS(app)


TRANSCRIPTIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'transcripciones')

os.makedirs(TRANSCRIPTIONS_DIR, exist_ok=True)

def get_video_id(url):
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    return None

@app.route("/transcribir-audio", methods=["POST"])
def transcribir_audio():
    if whisper_model is None:
        return jsonify({"error": "Whisper no está instalado. Ejecuta 'pip install openai-whisper'"}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo de audio"}), 400

    audio_file = request.files['file']
    if audio_file.filename == '':
        return jsonify({"error": "Archivo sin nombre"}), 400

    # Guardar en archivo temporal
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex}_{audio_file.filename}")
    
    try:
        audio_file.save(temp_path)
        # Transcribir
        print(f"Transcribiendo archivo local: {temp_path}")
        result = whisper_model.transcribe(temp_path)
        texto_extraido = result["text"]

        return jsonify({
            "message": "Audio transcrito correctamente",
            "text": texto_extraido.strip()
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error transcribiendo audio: {str(e)}"}), 500
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route("/transcribir", methods=["POST"])
def transcribir():
    data = request.json
    url = data.get("url")
    
    if not url:
        return jsonify({"error": "URL no proporcionada"}), 400

    video_id = get_video_id(url)
    if not video_id:
        return jsonify({"error": "URL inválida"}), 400

    try:
        # v1.x: instanciar la clase primero, luego usar fetch()
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id, languages=['es', 'en'])

        # En v1.x cada entrada es un objeto con atributo .text (no un dict)
        texto = "\n".join([snippet.text for snippet in transcript])
        
        filename = f"transcripcion_{video_id}.txt"
        filepath = os.path.join(TRANSCRIPTIONS_DIR, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(texto)

        return jsonify({
            "message": "Transcripción generada correctamente",
            "video_id": video_id,
            "archivo": filename,
            "savedFilePath": os.path.join("transcripciones", filename),
            "contenido": texto[:300] + "..." if len(texto) > 300 else texto
        })

    except NoTranscriptFound:
        return jsonify({"error": "No se encontraron subtítulos para este video."}), 404
    except TranscriptsDisabled:
        return jsonify({"error": "Los subtítulos están deshabilitados para este video."}), 403
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"No se pudo obtener la transcripción: {str(e)}"}), 500


@app.route("/exportar-pdf", methods=["POST"])
def exportar_pdf():
    if HTML is None:
        return jsonify({"error": "WeasyPrint no está instalado correctamente. Ejecuta 'pip install weasyprint'"}), 500

    data = request.json
    if not data:
        return jsonify({"error": "No hay datos para exportar"}), 400

    source_type = data.get('sourceType', 'youtube')
    
    # Configuración por defecto (YouTube - Rojo)
    theme_color = "#e11d48"
    theme_bg = "#ffe4e6"
    title = "Reporte de Análisis de Video (YouTube)"
    idea_title = "Idea Central del Video"
    
    if source_type == "text":
        theme_color = "#2563eb" # Azul
        theme_bg = "#dbeafe"
        title = "Reporte de Análisis de Documento (Texto Libre)"
        idea_title = "Idea Central del Texto"
    elif source_type == "audio":
        theme_color = "#9333ea" # Morado
        theme_bg = "#f3e8ff"
        title = "Reporte de Análisis de Audio Local"
        idea_title = "Idea Central del Audio"

    # Plantilla HTML con CSS moderno usando f-strings y escaping para Jinja2
    html_template = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 2cm;
                @bottom-right {{
                    content: "Página " counter(page);
                    font-family: 'Helvetica', sans-serif;
                    font-size: 10pt;
                    color: #666;
                }}
            }}
            body {{
                font-family: 'Helvetica', 'Arial', sans-serif;
                color: #333;
                line-height: 1.6;
            }}
            .header {{
                text-align: center;
                border-bottom: 2px solid {theme_color};
                padding-bottom: 10px;
                margin-bottom: 30px;
            }}
            .header h1 {{
                color: {theme_color};
                margin: 0;
                font-size: 24pt;
            }}
            .header p {{
                color: #666;
                font-size: 10pt;
            }}
            .section {{
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 8px;
            }}
            .section h2 {{
                margin-top: 0;
                font-size: 16pt;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }}
            .summary-box {{
                background-color: #f0fdf4;
                border: 1px solid #bbf7d0;
            }}
            .summary-box h2 {{ color: #166534; border-bottom-color: #bbf7d0; }}
            
            .coreidea-box {{
                background-color: {theme_bg};
                border: 1px solid {theme_color};
            }}
            .coreidea-box h2 {{ color: {theme_color}; border-bottom-color: {theme_color}; }}
            
            .proscons-box {{
                background-color: #fffbeb;
                border: 1px solid #fde68a;
            }}
            .proscons-box h2 {{ color: #92400e; border-bottom-color: #fde68a; }}
            
            pre {{
                white-space: pre-wrap;
                font-family: inherit;
                margin: 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <p>Documento generado por Inteligencia Artificial (Qwen 2.5 Offline)</p>
        </div>
        
        <div class="section summary-box">
            <h2>Resumen Ejecutivo</h2>
            <p>{{{{ summary }}}}</p>
        </div>
        
        <div class="section coreidea-box">
            <h2>{idea_title}</h2>
            <p><strong>{{{{ coreIdea }}}}</strong></p>
        </div>
        
        <div class="section proscons-box">
            <h2>Análisis Estructurado: Pros y Contras</h2>
            <pre>{{{{ prosCons }}}}</pre>
        </div>
    </body>
    </html>
    """
    
    # Rellenar plantilla con los datos que mandó Next.js
    rendered_html = render_template_string(
        html_template, 
        summary=data.get('summary', 'N/A'),
        coreIdea=data.get('coreIdea', 'N/A'),
        prosCons=data.get('prosCons', 'N/A')
    )
    
    # Generar PDF en memoria sin escribir al disco
    pdf_file = HTML(string=rendered_html).write_pdf()
    
    return send_file(
        io.BytesIO(pdf_file),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='Reporte_Analisis_IA.pdf'
    )

@app.route("/descargar/<video_id>", methods=["GET"])
def descargar(video_id):
    path = os.path.join(TRANSCRIPTIONS_DIR, f"transcripcion_{video_id}.txt")
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    else:
        return jsonify({"error": "Archivo no encontrado"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)