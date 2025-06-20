"use client"

import { useState, createContext, useContext, useEffect } from "react"
import "./App.css"

// Theme Context
const ThemeContext = createContext()

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme")
    return saved || "light"
  })

  useEffect(() => {
    localStorage.setItem("theme", theme)
    document.documentElement.className = theme
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

// Icons as SVG components
const YoutubeIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const SunIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const MoonIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
)

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const AlertCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const LoaderIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

// Main App Component
function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [response, setResponse] = useState(null)
  const { theme, toggleTheme } = useTheme()

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/
    return youtubeRegex.test(url)
  }

  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!youtubeUrl.trim()) {
      setMessage({ type: "error", text: "Please enter a YouTube URL" })
      return
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setMessage({ type: "error", text: "Please enter a valid YouTube URL" })
      return
    }

    setIsLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const videoId = extractVideoId(youtubeUrl)

      const mockResponse = {
        success: true,
        message: "YouTube URL processed successfully",
        data: {
          url: youtubeUrl,
          videoId,
          timestamp: new Date().toISOString(),
          status: "processed",
          processingTime: "2.1s",
        },
      }

      setMessage({ type: "success", text: "YouTube URL submitted successfully!" })
      setResponse(mockResponse)
      setYoutubeUrl("")
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    // This is where you'll add your download logic
    console.log("Download button clicked!", response)
    alert("Download functionality will be implemented here!")
  }

  return (
    <div className="app">
      <div className="container">
        {/* Theme Toggle Button */}
        <div className="theme-toggle">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon className="icon" /> : <MoonIcon className="icon" />}
          </button>
        </div>

        {/* Main Form Card */}
        <div className="card">
          <div className="card-header">
            <div className="icon-container">
              <YoutubeIcon className="youtube-icon" />
            </div>
            <h1 className="title">VOC from social media</h1>
            <p className="description">Enter a YouTube URL to extract voice of customer insights</p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="form">
              <div className="input-group">
                <label htmlFor="youtube-url" className="label">
                  YouTube URL
                </label>
                <input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input"
                  disabled={isLoading}
                />
              </div>

              {message && (
                <div className={`alert ${message.type}`}>
                  {message.type === "success" ? (
                    <CheckCircleIcon className="alert-icon" />
                  ) : (
                    <AlertCircleIcon className="alert-icon" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderIcon className="spinner" />
                    Submitting...
                  </>
                ) : (
                  "Submit URL"
                )}
              </button>

              {/* Download Button */}
              <div className="download-section">
                <button
                  type="button"
                  className="download-btn"
                  disabled={!response || isLoading}
                  onClick={handleDownload}
                >
                  <DownloadIcon className="download-icon" />
                  Download VOC Report
                  {!response && !isLoading && <span className="helper-text">(Submit URL first)</span>}
                </button>
              </div>

              <div className="help-text">
                <p className="help-title">Supported formats:</p>
                <ul className="help-list">
                  <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>• https://youtu.be/VIDEO_ID</li>
                  <li>• https://www.youtube.com/embed/VIDEO_ID</li>
                </ul>
              </div>
            </form>
          </div>
        </div>

        {/* Loading Animation */}
        {isLoading && (
          <div className="card loading-card">
            <div className="loading-content">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring-animated"></div>
              </div>
              <div className="loading-text">
                <p className="loading-title">Processing your request...</p>
                <p className="loading-subtitle">Please wait while we handle your YouTube URL</p>
              </div>
              <div className="bouncing-dots">
                <div className="dot"></div>
                <div className="dot" style={{ animationDelay: "0.1s" }}></div>
                <div className="dot" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && !isLoading && (
          <div className="card response-card">
            <div className="card-header">
              <div className="response-title">
                <CheckCircleIcon className="success-icon" />
                <span>Response from Backend</span>
              </div>
            </div>
            <div className="card-content">
              <div className="response-content">
                <div className="json-response">
                  <h4 className="json-title">Server Response:</h4>
                  <pre className="json-pre">{JSON.stringify(response, null, 2)}</pre>
                </div>

                {response.data && (
                  <div className="data-grid">
                    <div className="data-card blue">
                      <h5 className="data-title">Video ID</h5>
                      <p className="data-value">{response.data.videoId}</p>
                    </div>
                    <div className="data-card purple">
                      <h5 className="data-title">Timestamp</h5>
                      <p className="data-value">{new Date(response.data.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="data-card green">
                  <h5 className="data-title">Original URL</h5>
                  <p className="data-value url">{response.data?.url}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap App with ThemeProvider
function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

export default AppWithTheme
