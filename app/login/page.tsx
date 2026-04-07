"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError("Error de red o servidor no disponible")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-drcv-primary flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Grilla Holográfica (Control Center Aesthetic) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-drcv-600 border border-drcv-500 rounded-lg p-8 shadow-2xl shadow-accent-500/10 relative z-10">
        <div className="space-y-4 text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logosinfondo.png" alt="DRCV Logo" width={180} height={55} className="object-contain" priority />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
            <span className="text-xs text-neutral-400 tracking-wider font-mono">SECURE AUTHENTICATION</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-neutral-400 tracking-wider uppercase font-mono">Operador ID</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-accent-500/50" />
              <Input
                id="email"
                type="email"
                placeholder="system@drcv.online"
                className="pl-10 w-full bg-drcv-primary border-drcv-500 rounded text-sm text-white placeholder-neutral-600 focus-visible:outline-none focus-visible:border-accent-500 focus-visible:ring-1 focus-visible:ring-accent-500 transition-colors font-mono h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-neutral-400 tracking-wider uppercase font-mono">Código de Encriptación</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-accent-500/50" />
              <Input
                id="password"
                type="password"
                className="pl-10 w-full bg-drcv-primary border-drcv-500 rounded text-sm text-white placeholder-neutral-600 focus-visible:outline-none focus-visible:border-accent-500 focus-visible:ring-1 focus-visible:ring-accent-500 transition-colors font-mono h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium h-12 rounded transition-colors tracking-wider text-sm mt-4 uppercase shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center font-mono">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                VERIFICANDO...
              </div>
            ) : (
              "INICIALIZAR"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
