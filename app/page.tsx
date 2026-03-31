"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, CheckCircle, AlertCircle, Sun, FileText, Mic } from "lucide-react"

interface Message {
  type: "success" | "error";
  text: string;
}

export default function YouTubeLinkSubmission() {
  const [activeTab, setActiveTab] = useState<"youtube" | "text" | "audio">("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [response, setResponse] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      // Paso 1: Transcribir el video con el backend de Python
      setMessage({ type: "success", text: "Transcribing video... Please wait." });
      const pythonApiUrl = "http://127.0.0.1:5000/transcribir";
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "Failed to transcribe YouTube video" });
        return;
      }

      const transcriptionFilePath = pythonData.savedFilePath;

      setMessage({ type: "success", text: "Transcription successful! Analyzing text with Agent..." });
      const nextApiUrl = "/api/youtube";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcriptionFilePath }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: nextData.message || "Analysis completed successfully!" });
        setResponse(nextData);
      } else {
        setMessage({ type: "error", text: nextData.error || "Failed to analyze transcribed text" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Network error or unexpected issue: ${error.message}. Please ensure both backends are running.` });
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
      setMessage({ type: "error", text: "Please select an audio file to transcribe." });
      return;
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      // Paso 1: Transcribir el audio localmente con Whisper via Flask
      setMessage({ type: "success", text: "Transcribing audio offline with Whisper. This may take a moment depending on the file size..." });
      const formData = new FormData();
      formData.append("file", audioFile);

      const pythonApiUrl = "http://127.0.0.1:5000/transcribir-audio";
      const pythonApiResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData, // fetch enviará automáticamente los headers multipart/form-data
      });

      const pythonData = await pythonApiResponse.json();

      if (!pythonApiResponse.ok) {
        setMessage({ type: "error", text: pythonData.error || "Failed to transcribe audio file" });
        return;
      }

      const extractedText = pythonData.text;

      setMessage({ type: "success", text: "Transcription successful! Analyzing text with Agent..." });
      const nextApiUrl = "/api/analyze-text";
      const nextApiResponse = await fetch(nextApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, sourceType: "audio" }),
      });

      const nextData = await nextApiResponse.json();

      if (nextApiResponse.ok) {
        setMessage({ type: "success", text: "Audio analysis completed successfully!" });
        // Reescribimos el nombre del archivo para la vista 
        nextData.analyzedFile = `🎙️ Audio: ${audioFile.name}`;
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
      const pdfApiUrl = "http://127.0.0.1:5000/exportar-pdf";
      const pdfResponse = await fetch(pdfApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...response, sourceType: activeTab }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-2xl space-y-6">
                  <div className="flex justify-between items-center bg-card/50 p-2 rounded-lg backdrop-blur-sm">
            <div className="flex bg-muted rounded-lg p-1 w-full max-w-md mx-auto text-xs sm:text-sm font-medium">
              <button
                className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "youtube" ? "bg-gray-700 shadow-sm text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setActiveTab("youtube"); setMessage(null); setResponse(null); }}
                type="button"
              >
                <Youtube className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">YouTube Video</span>
                <span className="sm:hidden">YouTube</span>
              </button>
              <button
                className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "text" ? "bg-card shadow-sm text-chart-1" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setActiveTab("text"); setMessage(null); setResponse(null); }}
                type="button"
              >
                <FileText className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Raw Text</span>
                <span className="sm:hidden">Text</span>
              </button>
              <button
                className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md transition-colors ${activeTab === "audio" ? "bg-card shadow-sm text-chart-4" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setActiveTab("audio"); setMessage(null); setResponse(null); }}
                type="button"
              >
                <Mic className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Local Audio</span>
                <span className="sm:hidden">Audio</span>
              </button>
            </div>
          </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${activeTab === "youtube" ? "bg-destructive/20" : activeTab === "text" ? "bg-chart-1/20" : "bg-chart-4/20"}`}>
              {activeTab === "youtube" ? <Youtube className="w-6 h-6 text-destructive" /> : activeTab === "text" ? <FileText className="w-6 h-6 text-chart-1" /> : <Mic className="w-6 h-6 text-chart-4" />}
            </div>
            <CardTitle className="text-2xl font-bold">
              {activeTab === "youtube" ? "Transcribe & Analyze YouTube" : activeTab === "text" ? "Analyze Raw Document Text" : "Analyze Audio Files Offline"}
            </CardTitle>
            <CardDescription>
              {activeTab === "youtube"
                ? "Enter a YouTube video link to transcribe and extract insights."
                : activeTab === "text"
                  ? "Paste any large text block, document, or review for direct AI analysis."
                  : "Upload an MP3, WAV, or M4A file to transcribe privately with Whisper."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={activeTab === "youtube" ? handleSubmit : activeTab === "text" ? handleTextSubmit : handleAudioSubmit} className="space-y-4">
              {activeTab === "youtube" ? (
                <div className="space-y-2">
                  <Label htmlFor="youtube-link">YouTube Link</Label>
                  <Input
                    id="youtube-link"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
              ) : activeTab === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="raw-text">Paste Text Content</Label>
                  <textarea
                    id="raw-text"
                    placeholder="E.g. Paste legal clauses, Amazon reviews, HR policies, or long news articles here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full min-h-[160px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="audio-file">Upload Local Audio</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="w-full cursor-pointer file:cursor-pointer"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1 pl-1">Uses OpenAI Whisper (offline). Supports .mp3, .wav, .m4a</p>
                </div>
              )}

              {message && (
                <Alert
                  className={
                    message.type === "success"
                      ? "border-chart-2/50 bg-chart-2/10 text-chart-2"
                      : "border-destructive/50 bg-red-950"
                  }
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-chart-2 dark:text-chart-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription
                    className={
                      message.type === "success"
                        ? "text-foreground"
                        : "text-destructive"
                    }
                  >
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className={`w-full ${activeTab === "youtube" ? "bg-destructive hover:bg-destructive/90" : activeTab === "text" ? "bg-chart-1 hover:bg-chart-1/90 text-primary-foreground" : "bg-chart-4 hover:bg-chart-4/90 text-primary-foreground"}`}
                disabled={isLoading}
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

              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
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
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className={`w-16 h-16 border-4 rounded-full animate-pulse ${activeTab === "youtube" ? "border-destructive/50" : activeTab === "text" ? "border-chart-1/30" : "border-chart-4/30"}`}></div>
                  <div className={`absolute top-0 left-0 w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${activeTab === "youtube" ? "border-destructive" : activeTab === "text" ? "border-chart-1" : "border-chart-4"}`}></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    {message?.text.includes("Transcribing")
                      ? "Transcribing source..."
                      : "Analyzing payload..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
          <Card className="w-full animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-chart-2" />
                <span>Analysis Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {response.analyzedFile && (
                  <div className="flex gap-4">
                    <div className="bg-card rounded-lg p-3 flex-1 overflow-hidden">
                      <h5 className="font-medium text-muted-foreground mb-1 text-xs uppercase tracking-wider">Source</h5>
                      <p className="text-muted-foreground font-mono text-sm truncate">{response.analyzedFile}</p>
                    </div>
                  </div>
                )}

                <div className="bg-chart-2/10 rounded-lg p-4 border border-chart-2/20">
                  <h5 className="font-bold text-chart-2 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Resumen Ejecutivo
                  </h5>
                  <p className="text-foreground text-sm leading-relaxed">{response.summary}</p>
                </div>

                <div className="bg-chart-1/20 rounded-lg p-4 border border-chart-1/30">
                  <h5 className="font-bold text-chart-1 mb-2 flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Idea Central
                  </h5>
                  <p className="text-foreground text-sm leading-relaxed font-medium">
                    {response.coreIdea}
                  </p>
                </div>

                <div className="bg-chart-3/10 rounded-lg p-4 border border-chart-3/20">
                  <h5 className="font-bold text-chart-3 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Análisis de Pros y Contras
                  </h5>
                  <div className="text-foreground text-sm whitespace-pre-wrap overflow-x-auto font-sans leading-relaxed">
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

