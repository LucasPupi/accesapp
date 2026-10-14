export interface Pregunta {
  id: number;
  imagen: string;
  alt: string;          // descripción de la imagen para lectores de pantalla
  enunciado: string;
  opciones: string[];
  correctas: number[];   // índices de las opciones correctas (0 = física, 1 = comunicacional, 2 = actitudinal)
  tiempo: number;     // segundos por pregunta
  explicacion: string;
}

export const preguntas: Pregunta[] = [
  {
    id: 1,
    imagen: "/fotos/ascensor.webp",
    alt: "Pasillo con dos ascensores de acero inoxidable: uno con las puertas cerradas y otro abierto con la cabina vacía e iluminada. Entre ambos hay dos botoneras pequeñas con dos botones cada una, sin otra señalización visible.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0,1],
    tiempo: 60,
    explicacion: "Ascensor ubicado en un edificio público. No cuenta con señalética visual ni táctil. Los botones están a una altura superior, inaccesibles para personas usuarias de silla de ruedas o de baja estatura. No hay sistema de audio que indique pisos ni apertura/cierre de puertas. Tampoco hay información en braille ni contraste visual en los comandos.",
  },
  {
    id: 2,
    imagen: "/fotos/baños.webp",
    alt: "Baño público con mesada de granito negro y bacha, dos mingitorios separados por paneles metálicos y cubículos estrechos de acero con inodoros. El piso es negro y la mesada está sobre un escalón.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0],
    tiempo: 60,
    explicacion: "Este baño representa una barrera física porque impide el uso autónomo y seguro por parte de personas con movilidad reducida, usuarias de silla de ruedas, bastón o andador. Las dimensiones y la disposición del mobiliario no permiten maniobras de giro ni transferencias asistidas. La ausencia de apoyos y señalización vulnera el principio de diseño universal y excluye a una parte de la población del uso igualitario del espacio."
  },
  {
    id: 3,
    imagen: "/fotos/ciego_bondi.webp",
    alt: "Interior de un colectivo lleno de gente. En el centro, una persona sentada sostiene un bastón blanco y mira al frente, sola y seria. A su alrededor, varias personas paradas y sentadas conversan y se ríen entre ellas sin dirigirse a ella.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [2],
    tiempo: 60,
    explicacion: "La persona con discapacidad visual ocupa un asiento y hay gente parada, nadie le habla ni siquiera para pedirle el lugar. Esta indiferencia refleja cómo la exclusión se manifiesta en gestos mínimos, muchas veces sostenidos por miedos, prejuicios o mitos sobre la discapacidad."
  },
  {
    id: 4,
    imagen: "/fotos/ciego_exterior.webp",
    alt: "Campus al aire libre con edificios, montañas al fondo y senderos de cemento lisos entre canteros de pasto. A la izquierda, un hombre con anteojos oscuros camina entre plantas altas tanteando con un bastón blanco, fuera del sendero.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0,1],
    tiempo: 60,
    explicacion: "Podría representar una barrera física y comunicacional. La ausencia de senderos podotáctiles en espacios públicos representa una barrera de accesibilidad para personas con discapacidad visual. Estos recorridos, compuestos por superficies texturadas y contrastantes, permiten orientar, advertir y guiar a quienes utilizan el tacto podal o el bastón blanco como herramienta de desplazamiento. Cuando no están presentes, se limita gravemente la autonomía, la seguridad y la posibilidad de transitar el entorno de manera independiente. Sin esta guía táctil, las personas con baja visión o ceguera enfrentan riesgos como desorientación, caídas, choques con obstáculos o dificultad para identificar cruces, rampas, escaleras y accesos. Además, se vulnera el principio de diseño universal, que busca que todos los espacios sean transitables por cualquier persona, sin necesidad de adaptaciones posteriores."
  },
  {
    id: 5,
    imagen: "/fotos/darin.webp",
    alt: "Aula a oscuras con niñas y niños sentados de espaldas mirando una pantalla. En la pantalla se proyecta una película: un primer plano de un hombre de barba, de traje, fumando. No se ven subtítulos. Al fondo, una docente de pie junto a una biblioteca.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0,1],
    tiempo: 60,
    explicacion: "Se visualizan barreras físicas y comunicacionales. Se proyecta una película sin subtítulos ni audiodescripción, lo que excluye a personas con discapacidad auditiva, baja visión o ceguera. También afecta a personas neurodivergentes, como quienes están dentro del espectro autista, que pueden necesitar apoyos visuales, anticipación de contenidos o entornos sensorialmente regulados para participar con comodidad. Además, los estudiantes están sentados en el suelo, muy juntos y sin mobiliario adecuado, lo que impide el acceso físico y genera incomodidad para quienes requieren apoyos posturales o mayor espacio personal. Esta disposición puede resultar especialmente desafiante para personas con hipersensibilidad táctil o dificultades de procesamiento sensorial."
  },
  {
    id: 6,
    imagen: "/fotos/proyector.webp",
    alt: "Sala oscura con un proyector colgado del techo. Un hombre de espaldas, con las manos atrás, mira una pantalla con una diapositiva de texto pequeño. Adelante hay sillas y mesas vacías y una computadora portátil en un atril.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [1],
    tiempo: 60,
    explicacion: "Barrera comunicacional detectada: El contenido visual proyectado no está acompañado por una descripción oral clara y estructurada. No se ofrece una versión accesible del material (por ejemplo, en formato digital compatible con lectores de pantalla). Se asume que todos los presentes pueden ver, lo que excluye a personas con discapacidad visual."
  },
  {
    id: 7,
    imagen: "/fotos/signo_discapacidad.webp",
    alt: "Estacionamiento con piso de piedras sueltas de canto rodado. Junto a un auto estacionado hay un cuadrado azul pintado sobre las piedras con el símbolo blanco de una persona en silla de ruedas.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0],
    tiempo: 60,
    explicacion: "La imagen representa una barrera física significativa en términos de accesibilidad. Aunque el espacio está señalizado como reservado -o no-para personas con discapacidad, el tipo de superficie utilizada—piedritas sueltas—impide el acceso real y seguro. Este tipo de piso genera inestabilidad, dificulta la maniobrabilidad de sillas de ruedas, andadores o bastones, y aumenta el riesgo de caídas para personas con movilidad reducida."
  },
  {
    id: 8,
    imagen: "/fotos/silla_ruedas.webp",
    alt: "Cocina luminosa de una oficina o casa. Un hombre en silla de ruedas sostiene una taza y mira a un grupo de tres personas paradas que charlan y se ríen junto a una mesada alta con una cafetera.",
    enunciado: "¿Qué barreras se visualizan en la imagen?",
    opciones: [
      "Barrera física",
      "Barrera comunicacional",
      "Barrera actitudinal"
    ],
    correctas: [0,2],
    tiempo: 60,
    explicacion: "La barrera aparece cuando se naturaliza la inclusión como algo excepcional, sin cuestionar si hay autonomía, participación real (si hay igualdad de condiciones, o si se escucha la voz de la persona con discapacidad en la toma de decisiones) o adaptación del entorno. Asumir que “estar presente” equivale a “estar incluido” reproduce una mirada capacitista, aunque no sea intencional."
  },
];
