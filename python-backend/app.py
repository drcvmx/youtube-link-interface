from flask import Flask, request, jsonify, send_file
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
import os
from flask_cors import CORS

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
       
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = None

        for lang_code in ['es', 'en']:
            try:
                transcript = transcript_list.find_transcript([lang_code])
                break
            except NoTranscriptFound:
                continue 
        
        if not transcript:
            
            if transcript_list:
                transcript = transcript_list.find_transcript(transcript_list.keys())
            else:
                raise NoTranscriptFound 

        transcript_data = transcript.fetch()
        texto = "\n".join([entry.text for entry in transcript_data])
        
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
      
        return jsonify({"error": f"No se pudo obtener la transcripción: {str(e)}"}), 500


@app.route("/descargar/<video_id>", methods=["GET"])
def descargar(video_id):
    path = os.path.join(TRANSCRIPTIONS_DIR, f"transcripcion_{video_id}.txt")
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    else:
        return jsonify({"error": "Archivo no encontrado"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000) 