export interface Recompensa {
  id: string
  nombre: string
  descripcion: string
  icono: string
  costo: number
  categoria: "ocio" | "experiencia" | "capricho" | "salud" | "otro"
}

export interface Canje {
  id: string
  recompensaId: string
  nombre: string
  icono: string
  costo: number
  fecha: string
}

export const RECOMPENSAS_DEFAULT: Recompensa[] = [
  {
    id: "gaming-1h",
    nombre: "1 hora de gaming",
    descripcion: "Juega libremente por 1 hora sin culpa",
    icono: "🎮",
    costo: 35,
    categoria: "ocio",
  },
  {
    id: "pelicula",
    nombre: "Ver una película",
    descripcion: "Disfruta de una película que tengas pendiente",
    icono: "🎬",
    costo: 25,
    categoria: "ocio",
  },
  {
    id: "dibujo-libre",
    nombre: "30 min de dibujo libre",
    descripcion: "Dibuja lo que quieras sin presión",
    icono: "🎨",
    costo: 15,
    categoria: "ocio",
  },
  {
    id: "comer-fuera",
    nombre: "Salir a comer algo rico",
    descripcion: "Cómpra algo delicioso fuera de casa",
    icono: "🍕",
    costo: 60,
    categoria: "experiencia",
  },
  {
    id: "dia-ocio",
    nombre: "Día de ocio sin culpa",
    descripcion: "Un día entero para ti, sin obligaciones",
    icono: "🏖️",
    costo: 120,
    categoria: "ocio",
  },
  {
    id: "serie-maraton",
    nombre: "Maratón de serie",
    descripcion: "Varios episodios de tu serie favorita",
    icono: "📺",
    costo: 30,
    categoria: "ocio",
  },
  {
    id: "comprar-capricho",
    nombre: "Comprar algo que quieras",
    descripcion: "Date un gusto material (hasta $10)",
    icono: "🛍️",
    costo: 80,
    categoria: "capricho",
  },
  {
    id: "siesta",
    nombre: "Siesta reparadora",
    descripcion: "Duerme una siesta de hasta 1 hora",
    icono: "😴",
    costo: 10,
    categoria: "salud",
  },
  {
    id: "redes-sociales",
    nombre: "30 min de redes sociales",
    descripcion: "Navega sin límite por tus redes favoritas",
    icono: "📱",
    costo: 20,
    categoria: "ocio",
  },
  {
    id: "musica-relax",
    nombre: "Sesión de música relajante",
    descripcion: "Escucha música y desconecta por 30 min",
    icono: "🎵",
    costo: 10,
    categoria: "salud",
  },
  {
    id: "paseo",
    nombre: "Paseo al aire libre",
    descripcion: "Sal a caminar sin rumbo y disfruta",
    icono: "🌳",
    costo: 15,
    categoria: "salud",
  },
  {
    id: "juego-mesa",
    nombre: "Juego de mesa / cartas",
    descripcion: "Juega con amigos o familia",
    icono: "🎲",
    costo: 25,
    categoria: "ocio",
  },
  {
    id: "comida-rapida",
    nombre: "Comida rápida sin remordimiento",
    descripcion: "Pide tu combo favorito",
    icono: "🍔",
    costo: 50,
    categoria: "capricho",
  },
  {
    id: "noche-peliculas",
    nombre: "Noche de películas + snacks",
    descripcion: "Películas con tus snacks favoritos",
    icono: "🍿",
    costo: 70,
    categoria: "experiencia",
  },
  {
    id: "tiempo-redes",
    nombre: "1 hora de redes sociales",
    descripcion: "Tiempo extra en tus redes preferidas",
    icono: "📱",
    costo: 30,
    categoria: "ocio",
  },
]

export const CATEGORIAS: { key: string; label: string; icono: string; color: string }[] = [
  { key: "ocio", label: "Ocio", icono: "🎮", color: "text-purple-500" },
  { key: "experiencia", label: "Experiencias", icono: "🌟", color: "text-blue-500" },
  { key: "capricho", label: "Caprichos", icono: "✨", color: "text-pink-500" },
  { key: "salud", label: "Salud", icono: "💚", color: "text-green-500" },
]
