"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, CheckCircle, AlertCircle, Sun, FileText, Mic, Video, LogOut } from "lucide-react"

interface Message {
  type: "success" | "error";
  text: string;
}

export default function YouTubeLinkSubmission() {
  const [activeTab, setActiveTab] = useState<"youtube" | "text" | "audio" | "recording">("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [response, setResponse] = useState<any>(null)
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        setAudioFile(file)
        
        // Apagar el micrófono
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err: any) {
      setMessage({ type: "error", text: "Microphone access denied or not available." })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      setMessage({ type: "success", text: "Grabación guardada localmente. Lista para transcribir." })
    }
  }

  const saveAnalysisToDb = async (sourceType: string, inputPreview: string, data: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('analyses').insert({
        user_id: user.id,
        source_type: sourceType,
        input_preview: inputPreview,
        summary: data.summary,
        core_idea: data.coreIdea,
        pros_cons: data.prosCons
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      setMessage({ type: "success", text: "Transcribing video... Please wait." });
      const pythonApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/transcribir`;
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "Failed to transcribe YouTube video" });
        return;
      }

      setMessage({ type: "success", text: "Transcription successful! Analyzing text with Agent..." });
      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pythonData.text, sourceType: "youtube" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "Analysis completed successfully!" });
        await saveAnalysisToDb('youtube', youtubeUrl, nextData);
        nextData.analyzedFile = youtubeUrl; // To show in the UI block
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "Failed to analyze transcribed text" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Network error or unexpected issue: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rawText.trim()) {
      setMessage({ type: "error", text: "Please enter some text to analyze." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      setMessage({ type: "success", text: "Analyzing raw text with Agent..." });

      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, sourceType: "text" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "Text analysis completed successfully!" });
        await saveAnalysisToDb('text', rawText.substring(0, 50), nextData);
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "Failed to analyze text" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Network error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setMessage({ type: "error", text: "Please select/record an audio file to transcribe." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      setMessage({ type: "success", text: "Transcribing audio offline with Whisper. This may take a moment depending on the file size..." });
      const formData = new FormData();
      formData.append("file", audioFile);

      const pythonApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/transcribir-audio`;
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData,
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "Failed to transcribe audio file" });
        return;
      }

      setMessage({ type: "success", text: "Transcription successful! Analyzing text with Agent..." });
      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pythonData.text, sourceType: "audio" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "Audio analysis completed successfully!" });
        nextData.analyzedFile = `🎙️ Audio: ${audioFile.name || 'Grabación en Vivo'}`;
        await saveAnalysisToDb(activeTab === 'recording' ? 'recording' : 'audio', audioFile.name || 'Voice Recording', nextData);
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "Failed to analyze transcribed text" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Network error or unexpected issue: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadPDF = async () => {
    if (!response) {
      setMessage({ type: "error", text: "No analysis data available to export." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "success", text: "Generando reporte PDF profesional..." });

    try {
      const pdfApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/exportar-pdf`;
      const pdfResponse = await fetch(pdfApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...response, sourceType: activeTab === 'recording' ? 'audio' : activeTab }),
      });

      if (!pdfResponse.ok) throw new Error("Failed to generate PDF");

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Analisis_IA.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Reporte PDF exportado con éxito." });
    } catch (error: any) {
      setMessage({ type: "error", text: `Error al generar PDF: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 transition-colors duration-300 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 tracking-tight">DRCV Company</h1>
            <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest pl-1">IA Suite V2</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-gray-800">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>

        <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded-lg backdrop-blur-sm border border-gray-800">
          <div className="flex bg-gray-900 rounded-lg p-1 w-full max-w-2xl mx-auto text-xs sm:text-sm font-medium border border-gray-800">
            <button
              className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "youtube" ? "bg-gray-700 shadow-sm text-red-400" : "text-gray-400 hover:text-white"}`}
              onClick={() => { setActiveTab("youtube"); setMessage(null); setResponse(null); }}
              type="button"
            >
              <Youtube className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">YouTube Video</span>
              <span className="sm:hidden">YouTube</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "text" ? "bg-gray-700 shadow-sm text-blue-400" : "text-gray-400 hover:text-white"}`}
              onClick={() => { setActiveTab("text"); setMessage(null); setResponse(null); }}
              type="button"
            >
              <FileText className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Raw Text</span>
              <span className="sm:hidden">Text</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "audio" ? "bg-gray-700 shadow-sm text-purple-400" : "text-gray-400 hover:text-white"}`}
              onClick={() => { setActiveTab("audio"); setMessage(null); setResponse(null); }}
              type="button"
            >
              <Mic className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Local Audio</span>
              <span className="sm:hidden">Audio</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "recording" ? "bg-gray-700 shadow-sm text-green-400" : "text-gray-400 hover:text-white"}`}
              onClick={() => { setActiveTab("recording"); setMessage(null); setResponse(null); }}
              type="button"
            >
              <Video className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Grabar Audio</span>
              <span className="sm:hidden">Grabar</span>
            </button>
          </div>
        </div>

        <Card className="w-full bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${activeTab === "youtube" ? "bg-red-900" : activeTab === "text" ? "bg-blue-900" : activeTab === "audio" ? "bg-purple-900" : "bg-green-900"}`}>
              {activeTab === "youtube" ? <Youtube className="w-6 h-6 text-red-400" /> : activeTab === "text" ? <FileText className="w-6 h-6 text-blue-400" /> : activeTab === "audio" ? <Mic className="w-6 h-6 text-purple-400" /> : <Video className="w-6 h-6 text-green-400" />}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {activeTab === "youtube" ? "Transcribe & Analyze YouTube" : activeTab === "text" ? "Analyze Raw Document Text" : activeTab === "audio" ? "Analyze Audio Files Offline" : "Record Live Conversation"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {activeTab === "youtube"
                ? "Enter a YouTube video link to transcribe and extract insights."
                : activeTab === "text"
                  ? "Paste any large text block, document, or review for direct AI analysis."
                  : activeTab === "audio" 
                    ? "Upload an MP3, WAV, or M4A file to transcribe privately with Whisper."
                    : "Use your microphone to record a meeting or voice note and analyze it offline."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={activeTab === "youtube" ? handleSubmit : activeTab === "text" ? handleTextSubmit : handleAudioSubmit} className="space-y-4">
              {activeTab === "youtube" ? (
                <div className="space-y-2">
                  <Label htmlFor="youtube-link" className="text-gray-300">YouTube Link</Label>
                  <Input
                    id="youtube-link"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>
              ) : activeTab === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="raw-text" className="text-gray-300">Paste Text Content</Label>
                  <textarea
                    id="raw-text"
                    placeholder="E.g. Paste legal clauses, Amazon reviews, HR policies, or long news articles here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full min-h-[160px] flex rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
              ) : activeTab === "audio" ? (
                <div className="space-y-2">
                  <Label htmlFor="audio-file" className="text-gray-300">Upload Local Audio</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1 pl-1">Uses OpenAI Whisper (offline). Supports .mp3, .wav, .m4a</p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col items-center py-6 bg-gray-950 rounded-lg border border-gray-800">
                  <Label className="text-gray-300 font-semibold mb-2">Live Microphone Recording</Label>
                  <div className="flex gap-4 items-center justify-center">
                    {!isRecording ? (
                      <Button type="button" onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                        <Mic className="w-10 h-10" />
                      </Button>
                    ) : (
                      <Button type="button" onClick={stopRecording} className="bg-gray-900 border-red-500 border-2 hover:bg-gray-800 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                        <div className="w-8 h-8 bg-red-500 rounded-sm" />
                      </Button>
                    )}
                  </div>
                  {isRecording && (
                    <div className="text-red-400 font-mono text-3xl font-bold font-tabular-nums mt-4">
                      {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  {audioFile && !isRecording && (
                    <div className="text-green-400 text-sm mt-4 text-center bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                      ✅ Audio ready ({Math.round(audioFile.size / 1024)} KB). Click Transcribe!
                    </div>
                  )}
                </div>
              )}

              {message && (
                <Alert
                  className={
                    message.type === "success"
                      ? "border-green-800 bg-green-950 text-green-200"
                      : "border-red-800 bg-red-950 text-red-200"
                  }
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className={`w-full ${activeTab === "youtube" ? "bg-red-700 hover:bg-red-800 text-white" : activeTab === "text" ? "bg-blue-700 hover:bg-blue-800 text-white" : activeTab === "audio" ? "bg-purple-700 hover:bg-purple-800 text-white" : "bg-green-700 hover:bg-green-800 text-white"}`}
                disabled={isLoading || (activeTab === "recording" && (!audioFile || isRecording))}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {message?.text.includes("Transcribing") ? "Transcribing..." : "Analyzing..."}
                  </>
                ) : (
                  activeTab === "youtube" ? "Transcribe & Analyze" : activeTab === "text" ? "Analyze Text" : "Transcribe & Analyze Audio"
                )}
              </Button>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
                  onClick={handleDownloadPDF}
                  disabled={!response || isLoading}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Exportar a PDF Premium
                  {!response && !isLoading && <span className="ml-2 text-xs opacity-75">(Run analysis first)</span>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="w-full bg-gray-900 border-gray-800">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className={`w-16 h-16 border-4 rounded-full animate-pulse ${activeTab === "youtube" ? "border-red-900" : activeTab === "text" ? "border-blue-900" : activeTab === "audio" ? "border-purple-900" : "border-green-900"}`}></div>
                  <div className={`absolute top-0 left-0 w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${activeTab === "youtube" ? "border-red-400" : activeTab === "text" ? "border-blue-400" : activeTab === "audio" ? "border-purple-400" : "border-green-400"}`}></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-300">
                    {message?.text.includes("Transcribing")
                      ? "Transcribing source..."
                      : "Analyzing payload..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {message?.text.includes("Transcribing")
                      ? "Please wait while we extract the text."
                      : "Processing with local AI (Agent)..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {response && !isLoading && (
          <Card className="w-full bg-gray-900 border-gray-800 animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Analysis Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {response.analyzedFile && (
                  <div className="flex gap-4">
                    <div className="bg-gray-800 rounded-lg p-3 flex-1 overflow-hidden border border-gray-700">
                      <h5 className="font-medium text-gray-400 mb-1 text-xs uppercase tracking-wider">Source</h5>
                      <p className="text-gray-300 font-mono text-sm truncate">{response.analyzedFile}</p>
                    </div>
                  </div>
                )}

                <div className="bg-green-900 rounded-lg p-4 border border-green-800">
                  <h5 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Resumen Ejecutivo
                  </h5>
                  <p className="text-green-100 text-sm leading-relaxed">{response.summary}</p>
                </div>

                <div className="bg-blue-900 rounded-lg p-4 border border-blue-800">
                  <h5 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Idea Central
                  </h5>
                  <p className="text-blue-100 text-sm leading-relaxed font-medium">
                    {response.coreIdea}
                  </p>
                </div>

                <div className="bg-amber-900 rounded-lg p-4 border border-amber-800">
                  <h5 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Análisis de Pros y Contras
                  </h5>
                  <div className="text-amber-100 text-sm whitespace-pre-wrap overflow-x-auto font-sans leading-relaxed">
                    {response.prosCons}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
