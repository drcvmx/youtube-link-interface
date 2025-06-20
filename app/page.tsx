"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, CheckCircle, AlertCircle, Sun, Moon, FileText } from "lucide-react"
import { useTheme } from "next-themes"

export default function YouTubeLinkSubmission() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [response, setResponse] = useState<any>(null) // Tipado para la respuesta
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      const apiResponse = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await apiResponse.json()

      if (apiResponse.ok) {
        setMessage({ type: "success", text: "Local text file analyzed successfully!" })
        setResponse(data)
      } else {
        setMessage({ type: "error", text: data.error || "Failed to analyze local text file" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (response && response.savedFilePath) {
      const link = document.createElement('a');
      link.href = response.savedFilePath;
      link.download = response.savedFilePath.split('/').pop(); // Obtener el nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setMessage({ type: "error", text: "No report available for download." });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-2xl space-y-6">
        {/* Theme Toggle Button */}
        {mounted && (
        <div className="flex justify-end">
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        )}

        {/* Main Form Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Youtube className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Analyze Youtube</CardTitle>
            <CardDescription>Enter a YouTube video link to extract customer voice insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analyze-text">YouTube Link</Label>
                <Input
                  id="analyze-text"
                  type="text"
                  placeholder="public/ejemplo1.txt"
                  value="public/ejemplo1.txt"
                  readOnly
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {message && (
                <Alert
                  className={
                    message.type === "success"
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  }
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription
                    className={
                      message.type === "success"
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }
                  >
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>

              {/* Download Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
                  onClick={handleDownload}
                  disabled={!response?.savedFilePath || isLoading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Analysis Report
                  {!response?.savedFilePath && !isLoading && <span className="ml-2 text-xs opacity-75">(Analyze text first)</span>}
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">Analyzed file:</p>
                <ul className="space-y-1 text-xs">
                  <li>• public/ejemplo1.txt</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loading Animation */}
        {isLoading && mounted && (
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 dark:border-red-800 rounded-full animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Analyzing your text...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait while we process your local text file.
                  </p>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Display */}
        {response && !isLoading && mounted && (
          <Card className="w-full animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span>Analysis Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Server Response:</h4>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>

                {response.analyzedFile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">File</h5>
                      <p className="text-blue-600 dark:text-blue-400 font-mono text-sm">{response.analyzedFile}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                      <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Timestamp</h5>
                      <p className="text-purple-600 dark:text-purple-400 text-sm">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 dark:text-green-200 mb-1">Summary</h5>
                  <p className="text-green-600 dark:text-green-400 text-sm break-all">{response.summary?.text}</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Key Points</h5>
                  <pre className="text-yellow-600 dark:text-yellow-400 text-sm whitespace-pre-wrap overflow-x-auto">
                    {response.key_points?.text}
                  </pre>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4">
                  <h5 className="font-medium text-indigo-800 dark:text-indigo-200 mb-1">Sentiment (Summary)</h5>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm">{response.summary?.sentiment}</p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                  <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Sentiment (Key Points)</h5>
                  <p className="text-orange-600 dark:text-orange-400 text-sm">{response.key_points?.sentiment}</p>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
