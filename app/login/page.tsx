"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

      // Si es exitoso, redirigimos a la página principal
      router.push("/")
      router.refresh() // Refresca para aplicar estado de middleware
    } catch (err: any) {
      setError("Error de red o servidor no disponible")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Acceso a la Suite IA</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa tus credenciales B2B corporativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@empresa.com"
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-gray-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9 bg-gray-800 border-gray-700 text-white focus-visible:ring-gray-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar a la Plataforma"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
