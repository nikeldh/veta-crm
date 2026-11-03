// Dónde podemos ayudar, por subsector (sección 05 del guion).
// Archivo propio: build.py regenera guion.js desde el CRM original, este no lo toca.
// Hecho el 2026-11-03 a partir de las 236 empresas del CRM (directorio FVEM, metal de Bizkaia):
// ~69 mecanizado y piezas · ~34 maquinaria · ~29 calderería · ~30 producto propio/serie ·
// 15 eléctrico · 14 instalación y mantenimiento · 9 moldes · 8 tratamientos · 8 distribución.
// Si Janice edita el guion desde la web, su versión se guarda en la base y manda sobre esta.
window.GUION_SECTORES = {
  intro: "Mira «Qué venden» en su ficha, busca aquí su sector y usa SU dolor y SU pregunta gancho. No sueltes la lista: elige uno, pregunta y escucha. Las soluciones son para que entiendas qué hacemos; en la llamada no se venden, se agendan con Elkin.",
  sectores: [
    {
      sector: "Mecanizado y piezas a medida",
      reconocer: "mecanizado, torneado, fresado, rectificado, decoletaje, estampación, forja, piezas y fijaciones bajo plano",
      dolores: [
        "Cada oferta se calcula a mano desde el plano (horas de máquina, material, tratamiento) y solo la sabe hacer el jefe de taller",
        "Las peticiones de oferta llegan por correo con planos en PDF y se contestan tarde o se pierden",
        "Nadie sabe qué ofertas se ganaron, cuáles se perdieron ni a qué precio: se cotiza a ciegas",
        "El cliente llama para preguntar «¿cuándo está mi pieza?» y alguien tiene que ir a mirarlo al taller",
      ],
      ayudas: [
        "Bandeja única de peticiones de oferta: lee el correo y el plano y deja preparada la ficha de cálculo",
        "Histórico de ofertas consultable: piezas parecidas, a qué precio y con qué margen salieron",
        "Aviso automático al cliente del estado de su pedido",
        "Panel de dirección: ofertas abiertas, tasa de acierto y carga del taller",
      ],
      pregunta: "Cuando os llega un plano para presupuestar, ¿quién lo calcula y cuánto tardáis en contestar?",
    },
    {
      sector: "Maquinaria y bienes de equipo",
      reconocer: "fabricación de máquinas, líneas, equipos, hornos, bombas, reductores, automatización, proyectos llave en mano",
      dolores: [
        "Las ofertas técnicas son largas y se montan copiando y pegando de proyectos anteriores",
        "La documentación técnica (planos, manuales, marcado CE) está repartida en carpetas y correos",
        "La posventa y los repuestos entran por teléfono y correo, sin registro de lo que pidió cada cliente",
        "El seguimiento de cada proyecto (hitos, horas, desvíos) vive en un Excel o en la cabeza del jefe de proyecto",
      ],
      ayudas: [
        "Generador de ofertas técnicas a partir de plantillas y de proyectos anteriores",
        "Asistente de posventa que responde consultas de repuestos con el manual y el histórico de cada máquina",
        "Panel de proyectos: hitos, horas reales frente a ofertadas y desvíos, al día",
      ],
      pregunta: "¿Cómo montáis una oferta técnica: desde cero o partiendo de un proyecto anterior?",
    },
    {
      sector: "Calderería, chapa y estructuras",
      reconocer: "calderería, chapa, corte láser, plegado, punzonado, soldadura, estructuras metálicas, curvado de tubo, andamios",
      dolores: [
        "Los presupuestos se hacen a mano por kilos y horas, cada vez desde cero",
        "Los planos y los cambios del cliente llegan por WhatsApp y correo, y se fabrica con una versión vieja",
        "Los partes de trabajo van en papel: no se sabe el coste real de cada trabajo hasta mucho después",
        "Las compras de chapa y perfiles se hacen sin previsión, con urgencias y portes caros",
      ],
      ayudas: [
        "Calculadora de presupuestos con sus tarifas de kilo, hora y material",
        "Registro de cambios del cliente con su versión: se fabrica siempre con el plano bueno",
        "Partes de trabajo desde el móvil y coste real por trabajo al cerrarlo",
      ],
      pregunta: "Al cerrar un trabajo, ¿sabéis si ganasteis o perdisteis dinero con él?",
    },
    {
      sector: "Fabricación en serie y producto propio",
      reconocer: "componentes de automoción, válvulas, herramientas, juntas, ferretería, cadenas, amortiguadores, producto con catálogo",
      dolores: [
        "Los pedidos repetitivos de los clientes llegan en PDF o Excel y alguien los teclea en el ERP",
        "La trazabilidad y los certificados de calidad por lote se preparan a mano",
        "Los distribuidores y clientes preguntan por stock, plazos y precios por teléfono y correo",
        "La previsión de producción y de compras se hace con hojas que solo entiende una persona",
      ],
      ayudas: [
        "Lectura automática de pedidos (PDF, Excel, correo) directa al ERP, con revisión antes de grabar",
        "Certificado y trazabilidad del lote generados solos al cerrar la orden",
        "Asistente que contesta stock, plazo y precio a distribuidores con los datos del ERP",
      ],
      pregunta: "Cuando un cliente os manda un pedido, ¿alguien lo vuelve a teclear en el sistema?",
    },
    {
      sector: "Eléctrico, electrónica y cuadros",
      reconocer: "cuadros eléctricos, ingeniería eléctrica, relés, electrónica, baterías, cableado",
      dolores: [
        "La lista de materiales de cada cuadro se saca a mano desde el esquema",
        "Los precios del material (cobre, componentes) cambian cada semana y las ofertas salen con precios viejos",
        "Un mismo proyecto se pide a varios proveedores y se compara a mano",
        "La documentación de cada cuadro entregado (esquemas, pruebas, certificados) cuesta encontrarla",
      ],
      ayudas: [
        "Lista de materiales y oferta preparadas desde el esquema o la plantilla del cuadro",
        "Precios de proveedor actualizados automáticamente en las ofertas",
        "Expediente digital de cada cuadro entregado, encontrable en segundos",
      ],
      pregunta: "Cuando sube el cobre o cambia un proveedor, ¿cómo actualizáis los precios de las ofertas?",
    },
    {
      sector: "Instalación y mantenimiento industrial",
      reconocer: "montaje, mantenimiento, ascensores y elevadores, reparación, asistencia técnica",
      dolores: [
        "Los avisos de avería entran por teléfono y WhatsApp sin registro: alguno se queda sin atender",
        "Los técnicos rellenan partes en papel que llegan a la oficina días después",
        "Los mantenimientos preventivos de cada contrato se controlan en un Excel",
        "La factura sale tarde porque depende de que llegue el parte",
      ],
      ayudas: [
        "Agente de WhatsApp que recoge el aviso, lo registra y lo asigna al técnico",
        "Parte digital con fotos y firma del cliente, que llega a la oficina al momento",
        "Calendario de preventivos automático y factura lista al cerrar el parte",
      ],
      pregunta: "Cuando entra una avería, ¿cómo llega al técnico y cuántos días tarda en facturarse?",
    },
    {
      sector: "Moldes, matrices y utillajes",
      reconocer: "moldes, matrices, troqueles, utillajes, herramientas de corte",
      dolores: [
        "Las horas reales de cada molde no se miden: se oferta el siguiente con la misma estimación",
        "Los cambios de diseño del cliente alargan el plazo y no se cobran",
        "La oferta depende de una o dos personas con mucha experiencia",
      ],
      ayudas: [
        "Control de horas por molde y comparación con lo ofertado",
        "Registro de cambios de diseño, con su impacto en plazo y precio",
        "Histórico de moldes y ofertas para que la experiencia no se vaya con quien se jubila",
      ],
      pregunta: "En el último molde, ¿cuántas horas reales se fueron comparado con las que ofertasteis?",
    },
    {
      sector: "Tratamientos y recubrimientos",
      reconocer: "tratamientos térmicos, galvanizado, pintura, cromado, anodizado, recubrimientos",
      dolores: [
        "Los albaranes de entrada y salida de cada lote se hacen a mano",
        "Cada lote lleva su certificado de calidad, preparado a mano",
        "El cliente llama para saber si su material ya está listo",
      ],
      ayudas: [
        "Albarán y certificado del lote generados automáticamente",
        "Trazabilidad de cada lote, de la entrada a la salida",
        "Aviso automático al cliente cuando su pedido está listo para recoger",
      ],
      pregunta: "Cada lote que sale, ¿el certificado lo prepara alguien a mano?",
    },
    {
      sector: "Distribución y suministro industrial",
      reconocer: "distribución, suministro industrial, almacén, venta de material y herramienta",
      dolores: [
        "Las cotizaciones se hacen a mano con listas de precios en PDF o Excel que nadie versiona",
        "Los precios se quedan desactualizados y el margen se escapa sin que nadie lo vea",
        "Los pedidos entran por el WhatsApp del comercial y no quedan registrados",
        "Todo depende de una persona que se sabe los precios de memoria",
      ],
      ayudas: [
        "Cotización asistida con la lista de precios vigente, en minutos",
        "Control de márgenes automático sobre todas las ventas del día",
        "Registro de cada petición desde que entra hasta que se contesta",
      ],
      pregunta: "¿Cómo entra hoy un pedido, desde que el cliente pregunta hasta que le mandáis la oferta?",
      caso: "En una distribuidora industrial con la que trabajamos, Compras dedicaba la jornada entera a cotizar y la dirección revisaba los márgenes a mano cada día.",
    },
  ],
  transversal: {
    titulo: "Si no sabes en qué sector encaja (vale para cualquiera)",
    dolores: [
      "Los presupuestos u ofertas dependen de una o dos personas",
      "La información llega por correo y WhatsApp y alguien la vuelve a teclear",
      "La dirección no tiene cifras al día: «las cuentas se sacan en la cabeza»",
    ],
    pregunta: "Si mañana falta la persona que hace los presupuestos, ¿qué pasa con las ofertas de esa semana?",
  },
};
