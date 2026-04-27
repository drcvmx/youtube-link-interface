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
import { Loader2, Youtube, CheckCircle, AlertCircle, Sun, FileText, Mic, Video, LogOut, Terminal, Activity, Send } from "lucide-react"

interface Message {
  type: "success" | "error";
  text: string;
}

export default function YouTubeLinkSubmission() {
  const [activeTab, setActiveTab] = useState<"youtube" | "text" | "audio" | "recording">("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [response, setResponse] = useState<any>(null)
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [lastAnalyzedText, setLastAnalyzedText] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  
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
    setChatMessages([])

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
        setLastAnalyzedText(pythonData.text);
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

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!docFile) {
      setMessage({ type: "error", text: "ERR_NO_FILE: Cargue archivo de documento." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)
    setChatMessages([])

    try {
      setMessage({ type: "success", text: "INIT_DOCUMENT_PARSE: Desplegando motor LiteParse..." });
      
      const formData = new FormData();
      formData.append("file", docFile);

      const pythonApiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:5000'}/parsear-documento`;
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData,
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "ERR_PARSING_FAILED" });
        return;
      }

      setMessage({ type: "success", text: "TEXT_AQUIRED: Evaluando sintaxis local en GPU..." });

      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pythonData.text, sourceType: "document" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "OP_SUCCESS: Análisis Táctico Completado." });
        nextData.analyzedFile = `DOC_TARGET: ${docFile.name}`;
        await saveAnalysisToDb('document', docFile.name, nextData);
        setLastAnalyzedText(pythonData.text);
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
    setChatMessages([])

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
        setLastAnalyzedText(pythonData.text);
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !response) return

    const userMessage = chatInput.trim()
    setChatInput("")
    
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }]
    setChatMessages(newMessages)
    setIsChatLoading(true)

    try {
      const chatApiUrl = "/api/chat";
      const apiResponse = await fetch(chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          contextText: lastAnalyzedText,
          analysis: response
        }),
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        setChatMessages([...newMessages, { role: "assistant" as const, content: data.content }]);
      } else {
        setChatMessages([...newMessages, { role: "assistant" as const, content: `ERR_CORE: ${data.error}` }]);
      }
    } catch (error: any) {
      setChatMessages([...newMessages, { role: "assistant" as const, content: `ERR_NETWORK: ${error.message}` }]);
    } finally {
      setIsChatLoading(false)
    }
  }

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
              { id: "text", icon: FileText, label: "Documento", activeClass: "bg-drcv-600 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.15)] border border-blue-500/30", iconClass: "text-blue-500" },
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
              {activeTab === "youtube" ? "Módulo de Extracción YouTube" : activeTab === "text" ? "Evaluación de Documentos" : activeTab === "audio" ? "Análisis Forense Vector Audial" : "Sistema de Escucha Táctica"}
            </CardTitle>
            <CardDescription className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-wider">
              {activeTab === "youtube" ? "Ingrese URL perimetral del objetivo." : activeTab === "text" ? "Cargue archivo PDF, DOCX, XLSX para extracción por LiteParse." : activeTab === "audio" ? "Cargue registro de audio local." : "Inicie grabación ambiental (Microphone Capture)."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 px-4 md:px-8">
            <form onSubmit={activeTab === "youtube" ? handleSubmit : activeTab === "text" ? handleDocSubmit : handleAudioSubmit} className="space-y-6">
              
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
                  <Label htmlFor="doc-file" className="text-xs text-neutral-400 font-mono tracking-wider uppercase">Archivo Objetivo (PDF/DOCX/TXT)</Label>
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full bg-drcv-primary border-drcv-500 text-neutral-300 font-mono h-12 pt-2 focus-visible:border-accent-500"
                    disabled={isLoading}
                  />
                  <p className="text-[10px] uppercase text-neutral-500 font-mono mt-1">Soporte local offline. Extracción instantánea.</p>
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

        {/* Floating Chat Widget — siempre visible */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

            {/* Chat Window */}
            {isChatOpen && (
              <div
                className={`w-[370px] sm:w-[420px] bg-[#0a0a0f] border ${theme.border} rounded-2xl shadow-2xl ${theme.shadow} flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}
                style={{ height: '520px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-black/70 border-b border-drcv-500">
                  <div className="flex items-center gap-3">
                    <Image src="/logosinfondo.png" alt="DRCV" width={80} height={26} className="object-contain opacity-90" />
                    <div className="h-5 w-px bg-drcv-500" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-300 leading-none">Terminal de Consulta</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 ${theme.pulse} rounded-full animate-pulse`} />
                        <span className={`font-mono text-[9px] uppercase tracking-widest ${theme.text}`}>Contexto Cargado</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-neutral-500 hover:text-white transition-colors p-1 rounded hover:bg-drcv-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Sin contexto: instrucciones */}
                  {!response ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-2 pt-4">
                      <Terminal className="w-9 h-9 text-neutral-700" />
                      <div className="space-y-1">
                        <p className="text-neutral-300 font-mono text-[11px] uppercase tracking-widest">Sin contexto activo</p>
                        <p className="text-neutral-600 font-mono text-[10px] leading-relaxed">
                          Ejecuta un análisis para activar la consulta.
                        </p>
                      </div>
                      <div className="w-full space-y-1.5 text-[10px] font-mono text-left">
                        {[
                          { label: "Red / YouTube", color: "text-red-400 border-red-500/30 bg-red-500/5" },
                          { label: "Documento · PDF / DOCX", color: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
                          { label: "Feed Local · Audio", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
                          { label: "Grabar Misión · Mic", color: "text-green-400 border-green-500/30 bg-green-500/5" },
                        ].map((item) => (
                          <div key={item.label} className={`flex items-center gap-2 border rounded px-3 py-2 ${item.color}`}>
                            <span className="opacity-60">▶</span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                      <Terminal className="w-10 h-10 text-neutral-600" />
                      <p className="text-neutral-400 font-mono text-[11px] max-w-[260px] leading-relaxed">
                        Análisis indexado. Puedes hacer preguntas específicas sobre el contenido procesado.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-3 font-mono text-xs break-words leading-relaxed
                          ${msg.role === 'user'
                            ? 'bg-drcv-600 border border-drcv-500 text-neutral-200'
                            : 'bg-black/50 border border-drcv-500/40 text-neutral-300'}`}
                        >
                          <div className={`text-[9px] uppercase tracking-widest mb-1.5 ${ msg.role === 'user' ? 'text-neutral-500' : theme.text}`}>
                            {msg.role === 'user' ? 'OPERADOR' : 'VAULT_AI'}
                          </div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-black/50 border border-drcv-500/40 rounded-xl px-4 py-3">
                        <div className="flex space-x-1.5 items-center">
                          <div className={`w-2 h-2 ${theme.pulse} rounded-full animate-pulse [animation-delay:-0.3s]`} />
                          <div className={`w-2 h-2 ${theme.pulse} rounded-full animate-pulse [animation-delay:-0.15s]`} />
                          <div className={`w-2 h-2 ${theme.pulse} rounded-full animate-pulse`} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 pb-3 pt-2 bg-black/40 border-t border-drcv-500/50">
                  {!response && (
                    <p className="text-center text-neutral-700 font-mono text-[9px] uppercase tracking-widest mb-2">
                      Ejecuta un análisis para habilitar
                    </p>
                  )}
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={response ? "Consulta al sistema..." : "Sin contexto activo..."}
                      className={`flex-1 bg-black/60 border-drcv-500 text-white placeholder-neutral-600 font-mono text-xs h-10 focus-visible:ring-1 focus-visible:border-transparent transition-opacity ${!response ? 'opacity-30' : ''}`}
                      disabled={isChatLoading || !response}
                    />
                    <Button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim() || !response}
                      className={`h-10 px-4 ${theme.bg} text-white transition-transform active:scale-95 ${!response ? 'opacity-30' : ''}`}
                    >
                      {isChatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Floating Trigger Button */}
            <button
              onClick={() => setIsChatOpen(prev => !prev)}
              className={`relative w-16 h-16 rounded-full border-2 ${theme.border} bg-[#0a0a0f] shadow-2xl ${theme.shadow} flex items-center justify-center hover:scale-110 transition-all duration-200 group`}
            >
              <Image
                src="/logosinfondo.png"
                alt="Chat DRCV"
                width={44}
                height={44}
                className="object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              />
              {/* Badge de mensajes sin leer */}
              {!isChatOpen && chatMessages.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 ${theme.pulse} rounded-full text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#0a0a0f]`}>
                  {chatMessages.filter(m => m.role === 'assistant').length}
                </span>
              )}
              {/* Anillo de pulso when open */}
              {isChatOpen && (
                <span className={`absolute inset-0 rounded-full border-2 ${theme.ring} animate-ping opacity-30`} />
              )}
            </button>
          </div>
        </div>
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
