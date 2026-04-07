# DRCV REY - Guía de Estilo y Marca (Control Center Aesthetic)

Esta guía documenta la identidad visual del proyecto `contro-apuestas`, conocido como **drcv rey**. El diseño presenta una estética de "Centro de Comando Táctico", caracterizada por colores oscuros profundos (azul marino casi negro), acentos de neón púrpura, y un uso intensivo de tipografías monoespaciadas para evocar precisión y tecnología.

---

## 1. Paleta de Colores (Tailwind Config)

El sistema está configurado en modo oscuro (`dark mode`) de forma predominante.

### Colores Principales (Brand)
Los colores base del fondo y los contenedores conforman la atmósfera del centro de comando.

```javascript
// tailwind.config.ts
colors: {
  "drcv-primary": "#00021D", // Fondo principal de la app
  drcv: {
    50: "#f0f0f5",
    100: "#e0e1ea",
    500: "#00021D", // Bordes, divisores y backgrounds secundarios
    600: "#000118", // Fondo de tarjetas (cards) y modales
    900: "#000010", // Fondo profundo para datagrids / contenido interno
  }
}
```

### Color de Acento (Purple Neon)
Se utiliza de forma estratégica para botones primarios, branding e indicadores activos.

```javascript
accent: {
  50: "#faf5ff",
  100: "#f3e8ff",
  400: "#c084fc", // Hover states
  500: "#a855f7", // Botones primarios, iconos, indicadores activos
  600: "#9333ea", // Active states
  700: "#7e22ce",
}
```

### Colores Semánticos (Status)
A lo largo de la aplicación se utilizan colores para representar estados financieros o de éxito. Se usan las utilidades base de Tailwind:
- `text-green-500`: Apuestas ganadas, ROI positivo, balances positivos.
- `text-red-500`: Apuestas perdidas, ROI negativo, errores.
- `text-yellow-500`: Apuestas pendientes o anuladas.
- `text-neutral-400 / 500`: Texto secundario, descripciones y fechas.

---

## 2. Tipografía

El sistema utiliza la librería tipográfica **Geist** creada por Vercel.

- **Fuente Global:** `Geist` (Sans-serif) para textos regulares (*En [layout.tsx](file:///home/drcv/Documentos/Codigo/contro-apuestas/app/layout.tsx) se inyecta antialiased*).
- **Fuente de Datos:** `Geist Mono` (`font-mono`). Se utiliza de forma masiva en:
  - Balances de dinero (`formatCurrency`).
  - Porcentajes y Win Rates (`formatPercent`).
  - Inputs de formulario (email y contraseñas).
  - Fechas e ID de tickets.
  - Estadísticas en tarjetas (Resumen, Actividad Reciente).

### Patrones Tipográficos
- **Encabezados de Tarjetas y Labels:** Generalmente usan tamaños pequeños, espaciado amplio y colores neutros.
  `className="text-xs text-neutral-400 tracking-wider uppercase"`
- **Cantidades Grandes (Hero Stats):**
  `className="text-2xl font-bold font-mono"`

---

## 3. UI y Componentes (Modo "Command Center")

### Fondos Holográficos / Cuadrículas
Para las pantallas de [Login](file:///home/drcv/Documentos/Codigo/contro-apuestas/app/login/page.tsx#9-150) y `Registro`, se utiliza un efecto de rejilla (grid) muy tenue con el color del acento para dar una vibra de escáner tecnológico:

```html
<div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
```

### Indicadores de Sistema (Pulse Indicators)
En las tarjetas de login y en el menú lateral, se simulan luces de estado de hardware usando la animación "pulse" de Tailwind.

```html
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
  <span className="text-xs text-neutral-400 tracking-wider">SISTEMA ACTIVO</span>
</div>
```

### Tarjetas y Contenedores (Cards)
Las tarjetas no tienen fondo blanco. Sobre el fondo `#00021D`, se montan contenedores con border sutiles.

```html
<div className="bg-drcv-600 border border-drcv-500 rounded-lg p-6 shadow-2xl shadow-accent-500/10">
```
*Notar la sombra `shadow-accent-500/10` que da un ligero brillo púrpura al contenedor.*

### Inputs y Formularios
Los campos de texto tienen fondo oscuro, bordes sutiles y cambian a acento morado al interaccionar (`focus`). Iconos pre-fijados utilizando `lucide-react`.

```html
<input className="w-full bg-drcv-primary border border-drcv-500 rounded px-10 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors font-mono" />
```

### Botones Principales
Botones limpios y directos, usando el color de acento.

```html
<button className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-3 rounded transition-colors tracking-wider text-sm">
  ACCEDER
</button>
```

### Iconografía
Librería: **`lucide-react`**
Iconos clave utilizados en el "Command Center":
- `Target` (Objetivos / Total)
- `TrendingUp` / `TrendingDown` (Rendimiento)
- `Percent`, `DollarSign` (KPIs financieros)
- `Activity`, `Flame` (Rachas, Actividad)
- `Lock`, `Mail` (Autenticación)

---

## 4. Estructura para Replicar (Stack Tecnológico)

Para configurar esto rápidamente en un nuevo proyecto:

1. **Framework:** Next.js 14/15 con App Router + Tailwind CSS (+ shadcn/ui).
2. **Setup Tailwind:** Modifica [tailwind.config.ts](file:///home/drcv/Documentos/Codigo/contro-apuestas/tailwind.config.ts) para incluir los colores `drcv` y sobrescribe las variables CSS de shadcn ([globals.css](file:///home/drcv/Documentos/Codigo/contro-apuestas/app/globals.css)) para apuntar el `--background` a tu `drcv-primary` oscuro y los `--card` a tu oscuro base.
3. **Fuentes:** Usa `next/font/google` o importa el propio paquete `@vercel/geist`.
4. **Patrón de Layout:** Un sidebar plegable colapsable en desktop (`w-64` a `w-16`) de fondo `drcv-primary`, con un toolbar superior y un canvas de trabajo (`bg-drcv-900`) para separar jerárquicamente la navegación del dashboard.

### Resumen del Tema Principal:
> *"Una interfaz oscura y elegante, sin distracciones, basada en rejillas oscuras, textos monospace utilitarios, detalles en neón púrpura (#a855f7) y semáforos de verde/rojo para marcar el rendimiento financiero de un vistazo."*
