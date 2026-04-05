"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LogOut, Database, Youtube, FileText, Mic, Video } from "lucide-react"

export default function AdminDashboard() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchAnalyses()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
    } else {
      setUserEmail(user.email || "")
      // En una app real, también checaríamos si user.user_metadata.role === 'superadmin'
    }
  }

  const fetchAnalyses = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('analyses')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      
    if (data) setAnalyses(data)
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const getSourceIcon = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />
      case 'text': return <FileText className="w-4 h-4 text-blue-500" />
      case 'audio': return <Mic className="w-4 h-4 text-purple-500" />
      case 'recording': return <Video className="w-4 h-4 text-green-500" />
      default: return <Database className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel Administrativo</h1>
            <p className="text-gray-400">Vista global de análisis B2B. Conectado como: {userEmail}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push("/")} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
              Ir a la App
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="bg-red-900 text-red-200 hover:bg-red-800">
              <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Análisis Recientes</CardTitle>
            <CardDescription className="text-gray-400">Todos los análisis realizados por los usuarios de la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-gray-500 animate-pulse">Cargando base de datos...</div>
            ) : (
              <div className="rounded-md border border-gray-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-950">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Fecha</TableHead>
                      <TableHead className="text-gray-400">Usuario</TableHead>
                      <TableHead className="text-gray-400">Fuente</TableHead>
                      <TableHead className="text-gray-400 w-1/2">Vista Previa (Input)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.length === 0 ? (
                      <TableRow className="border-gray-800">
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          No hay análisis en la base de datos local.
                        </TableCell>
                      </TableRow>
                    ) : analyses.map((a) => (
                      <TableRow key={a.id} className="border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {a.profiles?.email || 'Usuario Desconocido'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(a.source_type)}
                            <span className="text-gray-300 capitalize">{a.source_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400 font-mono text-xs truncate max-w-xs">
                          {a.input_preview?.substring(0, 100) || 'Sin datos'}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
