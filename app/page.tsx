import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ear, Eye, PlaySquare, ShieldCheck, Briefcase, Building, Users, Headphones, Cpu, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-drcv-primary text-drcv-50 font-mono tracking-widest uppercase selection:bg-accent-500 selection:text-white relative overflow-hidden">

      {/* Grilla Holográfica (Control Center Aesthetic) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-accent-500/20 bg-drcv-primary/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logosinfondo.png" alt="DRCV Company" width={110} height={35} className="object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" priority />
            <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-cyan-400 ml-2 drop-shadow-md">AISUITE</span>
          </div>
          <div className="flex items-center justify-end">
            <Link href="/login">
              <Button className="relative overflow-hidden bg-gradient-to-r from-accent-600 via-fuchsia-600 to-cyan-600 hover:from-accent-500 hover:via-fuchsia-500 hover:to-cyan-500 text-white border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] font-mono tracking-widest rounded px-8 uppercase text-xs h-10 transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Acceder</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-accent-500 blur-[150px] rounded-full transform scale-150 -translate-y-1/2"></div>
          <div className="absolute inset-0 bg-cyan-500/30 blur-[120px] rounded-full transform translate-x-1/4 -translate-y-1/4"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-500/50 bg-drcv-600/80 text-xs text-accent-400 font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
              Pipeline Analítico Offline Activo
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 drop-shadow-sm">
                Inteligencia Corporativa
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                100% Fuera de la Nube.
              </span>
            </h1>

            <p className="text-xl text-accent-100/80 max-w-3xl mx-auto leading-relaxed font-light">
              Transforma reuniones enteras, contratos legales masivos y miles de reviews en decisiones estratégicas al instante. Extrae la esencia de tu industria desde hardware corporativo con <strong className="text-cyan-400 font-semibold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">privacidad absoluta</strong>. Dile adiós a la "sequía de tokens": inteligencia artificial estratégicamente ilimitada, sin cuotas y libre de facturas sorpresa.
            </p>

            <div className="flex justify-center items-center pt-8">
              <Link href="/login">
                <Button className="relative overflow-hidden h-14 px-12 bg-gradient-to-r from-accent-600 via-fuchsia-600 to-cyan-600 hover:from-accent-500 hover:via-fuchsia-500 hover:to-cyan-500 text-white rounded text-sm font-mono tracking-widest uppercase shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] border border-white/10 transition-all duration-300 hover:scale-105 group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    Acceder
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1.5 transition-transform text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* El Verdadero Potencial Comercial */}
      <div className="py-24 relative z-10 border-t border-accent-500/20 bg-drcv-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-accent-200">El Límite es tu Imaginación (Casos Críticos)</h2>
          <p className="text-accent-300/70 max-w-2xl mx-auto font-mono text-sm tracking-widest uppercase mb-16 shadow-accent-500">Pipeline de Procesamiento Analítico Natural (NLP)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">

            <div className="p-8 bg-drcv-600 border border-accent-500/20 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.05)] hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)] transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-drcv-primary rounded-lg border border-accent-500/30 group-hover:border-cyan-400/50">
                  <Briefcase className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
                <h4 className="text-2xl font-bold text-accent-100">1. Analítica de Reuniones y Ventas</h4>
              </div>
              <div className="space-y-4">
                <p className="text-neutral-300 leading-relaxed text-sm">
                  <strong className="text-white">Imagina conectar este motor a audios de la mesa directiva.</strong> <br />
                  El sistema analiza horas de metraje y escupe: Resumen Ejecutivo, Acuerdos Clave (Next Steps) y los responsables de cada tarea. Todo exportado a un PDF membretado.
                </p>
                <p className="text-accent-400 font-mono text-xs uppercase tracking-wider bg-accent-500/10 p-3 rounded border border-accent-500/20">
                  🚀 Valor Comercial: Ahorra horas semanales a ejecutivos C-Level redactando minutas confidenciales.
                </p>
              </div>
            </div>

            <div className="p-8 bg-drcv-600 border border-accent-500/20 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.05)] hover:border-fuchsia-400/50 hover:shadow-[0_0_40px_rgba(232,121,249,0.15)] transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-drcv-primary rounded-lg border border-accent-500/30 group-hover:border-fuchsia-400/50">
                  <Headphones className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
                </div>
                <h4 className="text-2xl font-bold text-accent-100">2. Customer Support Monitoring</h4>
              </div>
              <div className="space-y-4">
                <p className="text-neutral-300 leading-relaxed text-sm">
                  <strong className="text-white">Alimenta el modelo con horas de Call Center.</strong> <br />
                  Cambia el prompt base y obliga a The Vault AI a calificar al agente (1-10) detectando el nivel exacto de frustración del cliente en la conversación.
                </p>
                <p className="text-fuchsia-400 font-mono text-xs uppercase tracking-wider bg-fuchsia-500/10 p-3 rounded border border-fuchsia-500/20">
                  🚀 Reporte Diario: "Tuvimos 30 llamadas furiosas, pero Juan Pérez calmó a 25. Retención asegurada."
                </p>
              </div>
            </div>

            <div className="p-8 bg-drcv-600 border border-accent-500/20 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.05)] hover:border-accent-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-drcv-primary rounded-lg border border-accent-500/30 group-hover:border-accent-400/50">
                  <Database className="w-8 h-8 text-accent-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </div>
                <h4 className="text-2xl font-bold text-accent-100">3. Inteligencia E-commerce</h4>
              </div>
              <div className="space-y-4">
                <p className="text-neutral-300 leading-relaxed text-sm">
                  <strong className="text-white">Procesa miles de reviews rascados de Amazon.</strong> <br />
                  El modelo deglute las críticas de la competencia y vomita los "Top 3 dolores de cabeza del usuario" para capitalizarlos comercialmente de forma masiva.
                </p>
                <p className="text-accent-400 font-mono text-xs uppercase tracking-wider bg-accent-500/10 p-3 rounded border border-accent-500/20">
                  🚀 Valor Estratégico: Lanzar productos letalmente precisos aprovechando las debilidades del líder de mercado.
                </p>
              </div>
            </div>

            <div className="p-8 bg-drcv-600 border border-accent-500/20 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.05)] hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.15)] transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-drcv-primary rounded-lg border border-accent-500/30 group-hover:border-emerald-400/50">
                  <FileText className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <h4 className="text-2xl font-bold text-accent-100">4. Gestor LegalTech Masivo</h4>
              </div>
              <div className="space-y-4">
                <p className="text-neutral-300 leading-relaxed text-sm">
                  <strong className="text-white">Auditorías legales en instantes.</strong> <br />
                  Una IA que devora contratos de 50 páginas en 3 segundos, detectando si falta alguna cláusula obligatoria u Obligación Contractual Clave.
                </p>
                <p className="text-emerald-400 font-mono text-xs uppercase tracking-wider bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                  🚀 Ingreso Recurrente: Notarías y Despachos pagarán fortunas por ahorrar 4 horas de lectura minuciosa por archivo.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* El Futuro: De Analizador a Cerebro Central */}
      <div className="py-32 relative z-10 border-y border-transparent bg-transparent overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,121,249,0.04)_0%,transparent_70%)] pointer-events-none -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-fuchsia-100 to-fuchsia-300 drop-shadow-sm tracking-tight">🚀 El Futuro: De Analizador a Cerebro Central</h2>
          <h3 className="text-fuchsia-400 font-mono text-sm md:text-base tracking-widest uppercase mb-10 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">El Activo más Valioso: Tu Memoria Corporativa</h3>
          <p className="text-neutral-300 leading-relaxed text-xl max-w-3xl mx-auto font-light">
            Al implementar The Vault hoy, estás iniciando la fase de <strong className="text-white font-semibold">Recolección Inteligente</strong>. En el futuro cercano, habilitaremos el módulo de Memoria Corporativa (RAG): tu IA dejará de analizar archivos aislados para <strong className="text-cyan-300 font-semibold">'recordar' cada contrato, cada llamada y cada decisión histórica</strong>, convirtiéndose en el consultor experto definitivo que conoce toda la trayectoria de tu negocio.
          </p>
        </div>
      </div>

      {/* Los Tres Pilares de Poder Técnico */}
      <div className="bg-drcv-primary border-y border-transparent py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">La Bóveda En Acción</h2>
            <p className="text-accent-300/60 max-w-2xl mx-auto font-mono text-sm tracking-wide uppercase">Capacidades de Inferencia Nativas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-drcv-600 p-8 rounded border border-accent-500/30 shadow-2xl hover:border-cyan-400/80 transition-colors">
              <div className="w-12 h-12 bg-drcv-primary rounded flex items-center justify-center border border-accent-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Ear className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-accent-100 mb-3">Oídos Privados</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Sube el audio de tus reuniones y obtén minutas automáticas. Privacidad total: la estrategia de ventas nunca sale de la empresa.
              </p>
            </div>

            <div className="bg-drcv-600 p-8 rounded border border-accent-500/30 shadow-2xl hover:border-fuchsia-400/80 transition-colors">
              <div className="w-12 h-12 bg-drcv-primary rounded flex items-center justify-center border border-accent-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-bold text-accent-100 mb-3">Visión Analítica</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Carga documentos gigantes. Detecta riesgos o anomalías invisibles sin que competidores o nubes públicas logren registrar lo que estás leyendo.
              </p>
            </div>

            <div className="bg-drcv-600 p-8 rounded border border-accent-500/30 shadow-2xl hover:border-accent-400/80 transition-all duration-300 group">
              <div className="w-12 h-12 bg-drcv-primary rounded flex items-center justify-center border border-accent-500/20 mb-6 group-hover:scale-110 group-hover:border-accent-400/50 transition-all duration-300">
                <Cpu className="w-6 h-6 text-accent-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all" />
              </div>
              <h3 className="text-lg font-bold text-accent-100 mb-3">Crecimiento Evolutivo</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                The Vault no es un software estático. Nuestra arquitectura está diseñada para evolucionar: hoy procesas datos con Qwen 2.5; mañana, actualizamos el motor a Llama 3 o modelos superiores sin cambiar tu infraestructura. Tu inversión está <strong className="text-white">protegida y lista para la próxima generación.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* El "Factor Seguridad" & Comparative */}
      <div className="py-24 relative z-10 border-t border-accent-500/20 bg-drcv-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="bg-drcv-900 rounded-xl border border-cyan-500/30 shadow-[0_0_80px_rgba(34,211,238,0.1)] p-8 md:p-16 mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

            <div className="max-w-3xl relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">Soberanía de Datos Real</h2>
              </div>
              <p className="text-xl text-neutral-300 leading-relaxed mb-6">
                Mientras otros regalan su Propiedad Intelectual a plataformas como OpenAI, con The Vault AI mantienes el control de la llave.
              </p>
              <p className="text-lg text-neutral-400 leading-relaxed">
                Los datos financieros, llamadas de clientes y rutas legales de tu negocio <strong className="text-cyan-400 font-semibold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">tienen literalmente prohibido viajar al exterior de internet.</strong> Lo que pasa en tu oficina, se procesa en tu caja fuerte.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-white mb-8 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">Tu Sistema vs IA Tradicional en la Nube</h3>
            <div className="overflow-x-auto rounded border border-accent-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-drcv-primary border-b border-accent-500/40">
                    <th className="py-4 px-6 font-mono text-xs text-neutral-500 uppercase tracking-widest">Métrica</th>
                    <th className="py-4 px-6 font-mono text-xs text-neutral-500 uppercase tracking-widest">Nube (OpenAI / Azure)</th>
                    <th className="py-4 px-6 font-mono text-xs text-accent-400 uppercase tracking-widest bg-accent-500/10 border-l border-accent-500/30">The Vault (Monstruo Local)</th>
                  </tr>
                </thead>
                <tbody className="bg-drcv-600">
                  <tr className="border-b border-accent-500/10 hover:bg-drcv-500/50">
                    <td className="py-4 px-6 text-sm font-bold text-accent-100">Privacidad de Información</td>
                    <td className="py-4 px-6 text-sm text-neutral-400">Datos interceptables / Alimentan modelos externos.</td>
                    <td className="py-4 px-6 text-sm text-cyan-300 bg-accent-500/10 font-medium border-l border-accent-500/30 shadow-[inset_10px_0_20px_rgba(34,211,238,0.05)] transition-colors hover:bg-cyan-500/10 hover:shadow-[inset_15px_0_30px_rgba(34,211,238,0.1)]">100% On-Premise. Aislamiento absoluto.</td>
                  </tr>
                  <tr className="border-b border-accent-500/10 hover:bg-drcv-500/50">
                    <td className="py-4 px-6 text-sm font-bold text-accent-100">Costo Operacional (Tokens)</td>
                    <td className="py-4 px-6 text-sm text-neutral-400">Sequía de tokens constante. Estás limitado; a mayor uso de la IA, mayor es tu factura.</td>
                    <td className="py-4 px-6 text-sm text-cyan-300 bg-accent-500/10 font-medium border-l border-accent-500/30 shadow-[inset_10px_0_20px_rgba(34,211,238,0.05)] transition-colors hover:bg-cyan-500/10 hover:shadow-[inset_15px_0_30px_rgba(34,211,238,0.1)]">¡Adiós sequía de tokens! Procesamiento ilimitado 24/7. Costo por inferencia = CERO.</td>
                  </tr>
                  <tr className="border-b border-accent-500/10 hover:bg-drcv-500/50">
                    <td className="py-4 px-6 text-sm font-bold text-accent-100">Evolución</td>
                    <td className="py-4 px-6 text-sm text-neutral-400">Dependes de las actualizaciones de terceros.</td>
                    <td className="py-4 px-6 text-sm text-fuchsia-300 bg-fuchsia-500/10 font-medium border-l border-fuchsia-500/30 shadow-[inset_10px_0_20px_rgba(232,121,249,0.05)] transition-colors hover:bg-fuchsia-500/10 hover:shadow-[inset_15px_0_30px_rgba(232,121,249,0.1)]">Tú decides cuándo y cómo evoluciona tu IA.</td>
                  </tr>
                  <tr className="border-b border-accent-500/10 hover:bg-drcv-500/50">
                    <td className="py-4 px-6 text-sm font-bold text-accent-100">Aprendizaje</td>
                    <td className="py-4 px-6 text-sm text-neutral-400">Tu conocimiento ayuda a mejorar IAs ajenas.</td>
                    <td className="py-4 px-6 text-sm text-emerald-300 bg-emerald-500/10 font-medium border-l border-emerald-500/30 shadow-[inset_10px_0_20px_rgba(52,211,153,0.05)] transition-colors hover:bg-emerald-500/10 hover:shadow-[inset_15px_0_30px_rgba(52,211,153,0.1)]">Tu conocimiento se queda en casa para tu beneficio.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 relative z-10 bg-drcv-primary border-t border-accent-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <Image src="/logosinfondo.png" alt="DRCV Company" width={120} height={35} className="object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-cyan-400 ml-2">AISUITE</span>
          </div>
          <p className="text-accent-500/50 text-xs font-mono tracking-widest uppercase">
            © {new Date().getFullYear()} ECOSISTEMA B2B DESCONECTADO. PRIVACIDAD BLINDADA.
          </p>
        </div>
      </footer>
    </div>
  );
}
