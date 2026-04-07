"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, CheckCircle, AlertCircle, Sun, FileText, Mic, Video, LogOut, Terminal, Activity } from "lucide-react"

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

  const getThemeColor = () => {
    switch(activeTab) {
      case 'youtube': return { bg: 'bg-red-500 hover:bg-red-600', text: 'text-red-400', border: 'border-red-500/50', ring: 'border-red-500', pulse: 'bg-red-500', shadow: 'shadow-[0_0_20px_rgba(248,113,113,0.3)]' };
      case 'text': return { bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/50', ring: 'border-blue-500', pulse: 'bg-blue-500', shadow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]' };
      case 'audio': return { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/50', ring: 'border-emerald-500', pulse: 'bg-emerald-500', shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]' };
      case 'recording': return { bg: 'bg-green-500 hover:bg-green-600', text: 'text-green-400', border: 'border-green-500/50', ring: 'border-green-500', pulse: 'bg-green-500', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' };
      default: return { bg: 'bg-accent-500 hover:bg-accent-600', text: 'text-accent-400', border: 'border-accent-500/50', ring: 'border-accent-500', pulse: 'bg-accent-500', shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' };
    }
  }
  const theme = getThemeColor();

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
      setMessage({ type: "error", text: "Acceso al micrófono denegado." })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      setMessage({ type: "success", text: "AUDIO_CAPTURED: Listo para transcripción." })
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
      setMessage({ type: "success", text: "INIT_URL_DOWNLOAD: Extrayendo metadata..." });
      const pythonApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/transcribir`;
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "ERR_EXTRACTION_FAILED" });
        return;
      }

      setMessage({ type: "success", text: "TEXT_AQUIRED: Desplegando análisis cognitivo..." });
      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pythonData.text, sourceType: "youtube" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "OP_SUCCESS: Análisis Táctico Completado." });
        await saveAnalysisToDb('youtube', youtubeUrl, nextData);
        nextData.analyzedFile = youtubeUrl; // To show in the UI block
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "ERR_ANALYSIS_FAILED" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `ERR_NETWORK: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rawText.trim()) {
      setMessage({ type: "error", text: "ERR_NO_INPUT: Inserte vector de texto." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      setMessage({ type: "success", text: "INIT_TEXT_ANALYSIS: Evaluando sintaxis local..." });

      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, sourceType: "text" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "OP_SUCCESS: Análisis Táctico Completado." });
        await saveAnalysisToDb('text', rawText.substring(0, 50), nextData);
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "ERR_ANALYSIS_FAILED" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `ERR_NETWORK: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setMessage({ type: "error", text: "ERR_NO_FILE: Cargue paquete de audio." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      setMessage({ type: "success", text: "INIT_WHISPER: Transcribiendo en GPU local (0 cloud)..." });
      const formData = new FormData();
      formData.append("file", audioFile);

      const pythonApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/transcribir-audio`;
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData,
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "ERR_TRANSCRIPTION_FAILED" });
        return;
      }

      setMessage({ type: "success", text: "TEXT_AQUIRED: Desplegando análisis cognitivo..." });
      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pythonData.text, sourceType: "audio" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "OP_SUCCESS: Análisis Táctico Completado." });
        nextData.analyzedFile = `AUDIO_LOG: ${audioFile.name || 'Microphone_Stream'}`;
        await saveAnalysisToDb(activeTab === 'recording' ? 'recording' : 'audio', audioFile.name || 'Voice Recording', nextData);
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "ERR_ANALYSIS_FAILED" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `ERR_NETWORK: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadPDF = async () => {
    if (!response) {
      setMessage({ type: "error", text: "ERR_NO_DATA: Imposible renderizar reporte vacío." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "success", text: "INIT_PDF_BUILD: Renderizando reporte cifrado en memoria..." });

    try {
      const pdfApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/exportar-pdf`;
      const pdfResponse = await fetch(pdfApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...response, sourceType: activeTab === 'recording' ? 'audio' : activeTab }),
      });

      if (!pdfResponse.ok) throw new Error("ERR_PDF_RENDER_FAILED");

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `INTEL_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "OP_SUCCESS: PDF Exportado Localmente." });
    } catch (error: any) {
      setMessage({ type: "error", text: `ERR_UNKNOWN: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-drcv-primary flex flex-col items-center p-4 transition-colors duration-300 font-sans relative">
      {/* Grilla Holográfica (Control Center Aesthetic) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="w-full max-w-4xl space-y-6 relative z-10 pt-4">
        
        {/* Superior Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 w-full bg-drcv-600 border border-drcv-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-4">
             <Image src="/logosinfondo.png" alt="DRCV Company" width={130} height={42} className="object-contain drop-shadow-md" priority />
             <div className="h-8 w-px bg-drcv-500 mx-2"></div>
             <div className="flex flex-col">
               <span className="text-xl font-black tracking-tight text-white leading-none">TERMINAL</span>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
                 <span className="text-accent-500 text-[10px] font-mono tracking-widest uppercase">Sistema Activo</span>
               </div>
             </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full sm:w-auto text-neutral-400 hover:text-white hover:bg-drcv-primary font-mono text-xs uppercase tracking-wider">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Conexión
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-between items-center bg-drcv-900 border border-drcv-500 rounded-lg p-1.5 shadow-inner">
          <div className="flex w-full text-xs font-mono tracking-wider uppercase">
            {[
              { id: "youtube", icon: Youtube, label: "Red / YouTube", activeClass: "bg-drcv-600 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.15)] border border-red-500/30", iconClass: "text-red-500" },
              { id: "text", icon: FileText, label: "Texto Raw", activeClass: "bg-drcv-600 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.15)] border border-blue-500/30", iconClass: "text-blue-500" },
              { id: "audio", icon: Mic, label: "Feed Local", activeClass: "bg-drcv-600 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)] border border-emerald-500/30", iconClass: "text-emerald-500" },
              { id: "recording", icon: Video, label: "Grabar Misión", activeClass: "bg-drcv-600 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] border border-green-500/30", iconClass: "text-green-500" },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  className={`flex-1 flex items-center justify-center py-3 px-2 rounded transition-all ${
                    isActive 
                      ? tab.activeClass
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-drcv-600 border border-transparent"
                  }`}
                  onClick={() => { setActiveTab(tab.id as any); setMessage(null); setResponse(null); }}
                  type="button"
                >
                  <tab.icon className={`w-4 h-4 mr-2 ${isActive ? tab.iconClass : 'text-neutral-500'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Central Command Container */}
        <Card className="w-full bg-drcv-600 border border-drcv-500 shadow-2xl shadow-accent-500/5">
          <CardHeader className="text-center border-b border-drcv-500 pb-8 bg-drcv-900/50">
            <div className={`mx-auto mb-4 w-12 h-12 rounded border border-accent-500/30 bg-drcv-primary flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]`}>
              <Terminal className="w-5 h-5 text-accent-500" />
            </div>
            <CardTitle className="text-xl font-mono tracking-widest text-white uppercase">
              {activeTab === "youtube" ? "Módulo de Extracción YouTube" : activeTab === "text" ? "Evaluación de Texto Estático" : activeTab === "audio" ? "Análisis Forense Vector Audial" : "Sistema de Escucha Táctica"}
            </CardTitle>
            <CardDescription className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-wider">
              {activeTab === "youtube" ? "Ingrese URL perimetral del objetivo." : activeTab === "text" ? "Inyecte contenido plano para análisis cognitivo." : activeTab === "audio" ? "Cargue registro de audio local." : "Inicie grabación ambiental (Microphone Capture)."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 px-4 md:px-8">
            <form onSubmit={activeTab === "youtube" ? handleSubmit : activeTab === "text" ? handleTextSubmit : handleAudioSubmit} className="space-y-6">
              
              {/* Input Variables */}
              {activeTab === "youtube" ? (
                <div className="space-y-2">
                  <Label htmlFor="youtube-link" className="text-xs text-neutral-400 font-mono tracking-wider uppercase">URL Objetivo</Label>
                  <Input
                    id="youtube-link"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-drcv-primary border-drcv-500 text-white placeholder-neutral-600 focus-visible:outline-none focus-visible:border-accent-500 focus-visible:ring-1 focus-visible:ring-accent-500 transition-colors font-mono h-12"
                    disabled={isLoading}
                  />
                </div>
              ) : activeTab === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="raw-text" className="text-xs text-neutral-400 font-mono tracking-wider uppercase">Buffer de Texto</Label>
                  <textarea
                    id="raw-text"
                    placeholder="Escriba o pegue la información plana..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full min-h-[200px] flex rounded border border-drcv-500 bg-drcv-primary px-4 py-3 text-sm shadow-sm placeholder:text-neutral-600 text-white focus-visible:outline-none focus-visible:border-accent-500 focus-visible:ring-1 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    disabled={isLoading}
                  />
                </div>
              ) : activeTab === "audio" ? (
                <div className="space-y-2">
                  <Label htmlFor="audio-file" className="text-xs text-neutral-400 font-mono tracking-wider uppercase">Paquete de Audio Local</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="w-full bg-drcv-primary border-drcv-500 text-neutral-300 font-mono h-12 pt-2 focus-visible:border-accent-500"
                    disabled={isLoading}
                  />
                  <p className="text-[10px] uppercase text-neutral-500 font-mono mt-1">Soporte: .mp3, .wav, .m4a // Powered by Whisper GPU</p>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center py-10 bg-drcv-primary rounded-lg border border-drcv-500 shadow-inner">
                  <div className="flex gap-4 items-center justify-center">
                    {!isRecording ? (
                      <Button type="button" onClick={startRecording} className={`bg-drcv-600 border border-neutral-600 hover:${theme.border} text-white rounded w-24 h-24 flex items-center justify-center transition-all group`}>
                        <Mic className={`w-8 h-8 text-neutral-400 group-hover:${theme.text} transition-colors`} />
                      </Button>
                    ) : (
                      <Button type="button" onClick={stopRecording} className="bg-drcv-900 border border-red-500 text-white rounded w-24 h-24 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
                        <div className="w-8 h-8 bg-red-500 rounded-sm" />
                      </Button>
                    )}
                  </div>
                  {isRecording && (
                    <div className="text-red-500 font-mono text-4xl font-bold font-tabular-nums flex items-center gap-4">
                      <Activity className="w-8 h-8 animate-bounce" />
                      {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{ (recordingTime % 60).toString().padStart(2, '0') }
                    </div>
                  )}
                  {audioFile && !isRecording && (
                    <div className="text-accent-400 font-mono text-xs uppercase border border-accent-500/30 bg-accent-500/10 px-4 py-2 rounded">
                      [OK] Paquete {Math.round(audioFile.size / 1024)} KB listo.
                    </div>
                  )}
                </div>
              )}

              {message && (
                <Alert
                  className={
                    message.type === "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <AlertDescription className="font-mono text-xs uppercase tracking-wider ml-1">
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="pt-4 grid grid-cols-1 gap-4">
                <Button
                  type="submit"
                  className={`w-full ${theme.bg} text-white font-mono tracking-widest text-xs uppercase h-12 ${theme.shadow} transition-all border ${theme.border}`}
                  disabled={isLoading || (activeTab === "recording" && (!audioFile || isRecording))}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESANDO COMANDO...
                    </div>
                  ) : (
                    "Ejecutar Análisis Cognitivo"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className={`w-full bg-drcv-primary border border-drcv-500 text-white hover:bg-drcv-600 hover:border-neutral-500 font-mono tracking-widest text-xs uppercase h-12 ${!response ? 'opacity-50' : 'shadow-[0_0_15px_rgba(255,255,255,0.05)]'}`}
                  onClick={handleDownloadPDF}
                  disabled={!response || isLoading}
                >
                  <FileText className="mr-2 h-4 w-4 text-neutral-400" />
                  Generar Reporte Cifrado (PDF)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loading State Overlay */}
        {isLoading && (
          <Card className={`w-full bg-drcv-600 border ${theme.border} ${theme.shadow} animate-in fade-in duration-300`}>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className={`w-16 h-16 border-4 rounded-full border-drcv-500 animate-pulse`}></div>
                  <div className={`absolute top-0 left-0 w-16 h-16 border-4 border-t-transparent rounded-full ${theme.ring} animate-spin`}></div>
                </div>
                <div className="text-center space-y-2">
                  <p className={`font-mono ${theme.text} font-bold uppercase tracking-widest text-sm`}>
                    {message?.text.includes("INIT_") ? "Cargando Nodos Lógicos..." : "Motor IA en Ejecución..."}
                  </p>
                  <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
                    Por favor mantenga su terminal conectada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Data Board */}
        {response && !isLoading && (
          <Card className={`w-full bg-drcv-600 border ${theme.border} ${theme.shadow} animate-in slide-in-from-bottom-4 duration-500`}>
            <CardHeader className="bg-drcv-900/50 border-b border-drcv-500">
              <CardTitle className="flex items-center space-x-3 text-white">
                <div className={`w-2 h-2 ${theme.pulse} rounded-full animate-pulse`} />
                <span className={`font-mono text-sm uppercase tracking-widest ${theme.text}`}>DATA_INTEGRITY_CHECK: PASSED</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {response.analyzedFile && (
                <div className="bg-drcv-primary border border-drcv-500 rounded p-4 font-mono">
                  <h5 className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">ORIGEN_VECTOR</h5>
                  <p className="text-accent-300 text-xs truncate break-all">{response.analyzedFile}</p>
                </div>
              )}

              <div className={`bg-drcv-primary border-l-2 ${theme.ring} rounded-r p-5 font-mono`}>
                <h5 className={`${theme.text} text-xs uppercase tracking-widest mb-3 flex items-center gap-2`}>
                  <TargetIcon className="w-4 h-4" /> Resumen Ejecutivo
                </h5>
                <p className="text-neutral-300 text-sm leading-relaxed">{response.summary}</p>
              </div>

              <div className={`bg-drcv-primary border-l-2 ${theme.ring} rounded-r p-5 font-mono`}>
                <h5 className={`${theme.text} text-xs uppercase tracking-widest mb-3 flex items-center gap-2`}>
                  <Sun className="w-4 h-4" /> Concepto Core (Idea Central)
                </h5>
                <p className="text-white text-sm leading-relaxed">
                  {response.coreIdea}
                </p>
              </div>

              <div className={`bg-drcv-primary border-l-2 ${theme.ring} rounded-r p-5 font-mono`}>
                <h5 className={`${theme.text} text-xs uppercase tracking-widest mb-3 flex items-center gap-2`}>
                  <Activity className="w-4 h-4" /> Vector de Riesgos (Pros vs Contras)
                </h5>
                <div className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {response.prosCons}
                </div>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
