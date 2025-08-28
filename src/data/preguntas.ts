export interface Pregunta {
  id: number;
  imagen: string;
  enunciado: string;
  opciones: string[];
  correcta: number;   // índice de la opción correcta
  tiempo: number;     // segundos por pregunta
  explicacion: string;
}

export const preguntas: Pregunta[] = [
  {
    id: 1,
    imagen: "https://picsum.photos/seed/rampa1/800/450",
    enunciado: "¿Cuál es el principal problema de accesibilidad en la foto?",
    opciones: [
      "Pendiente excesiva de la rampa",
      "Falta de pasamanos",
      "Textura antideslizante ausente",
      "Ancho insuficiente de la vereda"
    ],
    correcta: 0,
    tiempo: 30,
    explicacion: "Las rampas deben respetar la pendiente máxima según normativa; una pendiente excesiva las vuelve intransitables."
  },
  {
    id: 2,
    imagen: "https://picsum.photos/seed/rampa2/800/450",
    enunciado: "¿Qué incumplimiento ves en esta rampa?",
    opciones: [
      "No hay señalización táctil",
      "Falta de pasamanos",
      "Borde irregular que genera tropiezo",
      "Rampa demasiado ancha"
    ],
    correcta: 2,
    tiempo: 25,
    explicacion: "Los bordes irregulares o saltos de nivel son peligrosos: pueden trabar ruedas o provocar caídas."
  },
  {
    id: 3,
    imagen: "https://picsum.photos/seed/rampa3/800/450",
    enunciado: "¿Qué debería corregirse primero?",
    opciones: [
      "Pendiente excesiva",
      "Superficie resbaladiza",
      "Ausencia de descanso intermedio",
      "Falta de guía podotáctil"
    ],
    correcta: 1,
    tiempo: 20,
    explicacion: "Una superficie resbaladiza vuelve inseguro el acceso incluso con pendiente correcta."
  },
  {
    id: 4,
    imagen: "https://picsum.photos/seed/rampa4/800/450",
    enunciado: "Elegí la opción que describe el problema principal.",
    opciones: [
      "Cruce peatonal sin rebaje",
      "Rampa con obstáculo en el inicio",
      "Ancho excesivo",
      "Pasamanos demasiado bajo"
    ],
    correcta: 1,
    tiempo: 25,
    explicacion: "Cualquier obstáculo al inicio o fin de la rampa impide maniobrar y acceder con seguridad."
  },
  {
    id: 5,
    imagen: "https://picsum.photos/seed/rampa5/800/450",
    enunciado: "¿Qué está mal en esta instalación?",
    opciones: [
      "Ángulo de giro insuficiente",
      "Pendiente nula (es plano)",
      "Pasamanos duplicados",
      "Textura demasiado rugosa"
    ],
    correcta: 0,
    tiempo: 30,
    explicacion: "Es clave contar con espacio de giro en la llegada/salida para sillas de ruedas (radio recomendado)."
  }
];
