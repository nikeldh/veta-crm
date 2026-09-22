// Guion de llamada por defecto (si nadie lo ha editado en la base de datos).
window.GUION_DEFAULT = {
    apertura: "Hola, ¿hablo con [Nombre]? Soy Janice, llamo de parte de Elkin Dueñas — trabajamos con distribuidoras industriales de la zona. ¿Tienes 2 minutos o te pillo mal?",
    frame: "Perfecto. Te cuento rápido cómo va esto: no te llamo para venderte nada por teléfono. Te hago un par de preguntas sobre cómo lleváis hoy las cotizaciones, y si tiene sentido, te agendo 30 minutos con Elkin — es quien hace el diagnóstico real. ¿Te parece?",
    frameSenal: "Señal de que perdiste el frame: te preguntan precio antes de que hagas tú ninguna pregunta, o te piden «mándamelo por email» a los 10 segundos. Respuesta: «claro que te lo mando, pero antes dime una cosa…» y sigues con la pregunta 1.",
    cuatroP: [
      { p:"Persona", que:"El decisor: dueño, gerente o director comercial de la distribuidora. Si no es él quien contesta, pregunta con quién deberías hablar y pide que te pase o te dé un hueco." },
      { p:"Problemática", que:"Cotizaciones a mano, precios desactualizados, todo depende de una persona que se lo sabe de memoria." },
      { p:"Plan", que:"No es falta de IA — es capacidad operativa que ya están pagando sin saberlo. El mapa antes que la herramienta." },
      { p:"Propuesta", que:"La Sesión de Descubrimiento con Elkin, 30 min, sin coste. Nunca Core ni Blueprint en esta llamada." },
    ],
    preguntas: [
      "¿Cómo entra hoy un pedido, desde que el cliente pregunta hasta que le mandáis la oferta?",
      "Las cotizaciones y los precios, ¿los lleváis en algún sistema, o más a mano / en Excel?",
      "Más o menos, ¿cuántas cotizaciones sacáis a la semana?",
    ],
    preguntasNota: "Si la respuesta suena a manual + dependiente de una persona + volumen real → hay fit. Pasa al cierre.",
    objeciones: [
      { objecion:"Mándame un email", respuesta:"Claro que te lo mando. Antes, una cosa rápida: ¿las cotizaciones las lleváis a mano o en algún sistema? — y sigues la llamada" },
      { objecion:"No tenemos tiempo ahora", respuesta:"Lo entiendo, por eso son solo 30 min con Elkin, no conmigo. ¿Te viene mejor esta semana o la que viene?" },
      { objecion:"¿Cuánto cuesta esto?", respuesta:"Eso lo lleva Elkin en la sesión, porque depende de lo que encontréis juntos — yo solo agendo." },
      { objecion:"Ya tenemos proveedor / lo hacemos internamente", respuesta:"Perfecto, entonces seguro que os interesa comparar. La sesión no vende nada, es un diagnóstico. Si insiste que no → marcar ⚫ y cerrar con elegancia" },
      { objecion:"No soy yo quien decide", respuesta:"¿Con quién debería hablar? ¿Le puedo llamar yo, o prefieres pasarle el mensaje?" },
    ],
    cierre: "Genial. Entonces lo que hacemos es agendar 30 minutos con Elkin, que es quien diseña esto — él te lleva por el diagnóstico completo. ¿Qué tal esta semana o la que viene, por la mañana o por la tarde?",
    cierreNota: "Sales de toda llamada útil con: día y franja horaria concretos, nombre y cargo del decisor, y el ángulo/problema que mencionó — anótalo en la ficha del pipeline antes de colgar con el siguiente.",
    mensajes: [
      { titulo:"LinkedIn — problemática directa (corta)", texto:"Hola [Nombre], veo que en [Empresa] movéis bastante producto industrial. Pregunta rápida: ¿las cotizaciones y la actualización de precios las lleváis a mano / en Excel? Lo digo porque es justo donde a distribuidoras como la vuestra se les escapan horas y margen sin notarlo. Monté un autodiagnóstico gratis que en unos minutos te dice dónde está esa fuga en tu operación. ¿Te paso el enlace? Sin compromiso." },
      { titulo:"LinkedIn — autoridad + caso", texto:"Hola [Nombre]. Ayudo a distribuidoras industriales a recuperar capacidad operativa sin contratar más gente. En el último caso, el cuello no estaba en vender: estaba en compras y cotizaciones (precios desactualizados, todo en la cabeza de una persona). ¿Os suena de algo en [Empresa]? Tengo un autodiagnóstico gratis de fugas operativas — si te pica la curiosidad, te lo comparto." },
      { titulo:"LinkedIn — pregunta incómoda (mínimo compromiso)", texto:"Hola [Nombre], ¿te hago una pregunta incómoda sobre [Empresa]? ¿Cuántas horas a la semana se van en preparar presupuestos y perseguir precios/stock a mano? Si la respuesta es \"demasiadas\", tengo algo gratis que te va a interesar." },
      { titulo:"Seguimiento +3-4 días (sin respuesta)", texto:"Hola [Nombre], te subo esto por si se perdió. El autodiagnóstico son 3-4 minutos y no vendo nada dentro — es solo el mapa de dónde pierdes horas. ¿Te lo paso?" },
      { titulo:"Cierre elegante +1 semana", texto:"Entiendo que no sea el momento, [Nombre]. Te dejo el enlace por si más adelante quieres verlo. Cualquier cosa, aquí estoy. 👋" },
    ],
    cadencia: "10-20 toques nuevos al día es la actividad #1 de la jornada. Meta: 2-4 Sesiones de Descubrimiento agendadas por semana.",
  };
