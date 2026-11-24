// Guion de Clínicas dentales: qué técnica usar en cada caso de prospección y el guion de venta
// de la llamada de 15 minutos. Va en la pestaña "Guion de llamada", aparte del guion de industria.
//
// - Los TEXTOS QUE SE ENVÍAN o se dicen en el primer toque NO están aquí. Son las plantillas
//   aprobadas de clinicas.js (T-044 de Ecosistema Digital) y se citan por su código
//   (OUT-LI-A, OUT-DUEÑA-V3…). Si Ecosistema Digital las cambia, este guion las enseña ya
//   cambiadas.
// - Lo que sí es de aquí, escrito el 24-nov-2026 a partir de esas plantillas, del ICP
//   (estrategia/icp-clinicas.md §5.2) y del guion de llamada en frío del vault:
//     · qué técnica va en cada caso;
//     · la llamada de 15 minutos;
//     · las respuestas a objeciones en la voz de Janice.
//   Está marcado como "nuevo" hasta que Elkin lo valide.
// - Este repo es PÚBLICO: aquí nunca va el nombre de una clínica.
// - No se edita desde el CRM, a propósito: son textos revisados, no notas de trabajo.
window.GUION_CLINICAS = {
  intro:
    'Clínicas dentales independientes de Bilbao y Portugalete. <b>El objetivo de cada toque es una conversación con la dueña o el dueño, no una venta.</b> ' +
    'La venta la cierra Elkin en el diagnóstico de su operación, que es gratis.',

  reglas: [
    '<b>Usted siempre</b>: es un contacto nuevo. Las plantillas escritas se mandan como están, solo cambiando los corchetes.',
    '<b>Nunca precio, garantía ni cifras.</b> Tampoco las de ejemplo de la calculadora.',
    '<b>En el primer toque no se habla de IA, chatbot ni automatización.</b> Se habla de teléfono, WhatsApp, huecos y revisiones.',
    '<b>Nada clínico</b>: ni tratamientos, ni diagnósticos, ni datos de pacientes.',
    '<b>Nunca digas "trabajamos con clínicas", "solemos encontrar" ni "en clínicas como la suya"</b>: hoy no hay ninguna.',
    '<b>No nombres otra clínica ni una cadena.</b> Las reseñas se leen para elegir la pregunta, pero no se citan.',
    '<b>Nada de correo en frío (D-13).</b> Solo se escribe al correo que la clínica pide o da.',
    '<b>Como mucho 3 toques por clínica</b>, un canal por semana y <b>nunca la misma pregunta dos veces</b>.',
    '<b>A recepción no se le hace la pregunta.</b> No es quien decide, y delante de pacientes suena a examen de su trabajo.',
  ],

  // 01 · Antes del primer toque
  antes: {
    texto: 'Dos minutos con su web, su ficha de Google y la <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener">Biblioteca de anuncios de Meta</a>. Apunta lo que veas en la tarjeta (anuncios, WhatsApp, reserva online) y elige la pregunta del primer toque:',
    tabla: [
      ['Sale WhatsApp en la web o en Google', 'V-3 · WhatsApp', 'A'],
      ['No sale WhatsApp, o sus reseñas hablan del teléfono', 'V-2 · teléfono', 'B'],
      ['Tiene anuncios activos', 'V-14 · anuncios', 'C'],
    ],
    nota: 'Si encajan varias, la A. Apunta en la ficha la pregunta que usas (V-…): en el siguiente toque va otra.',
  },

  // 02 · Qué caso tienes delante → técnica
  casos: [
    {
      id: 'linkedin', emoji: '💼', situacion: 'La dueña o el dueño tiene perfil de LinkedIn',
      tecnica: 'Invitación con una sola pregunta', cuando: 'Primer toque (ruta 2)',
      pasos: [
        'Busca su perfil personal, no el de la clínica.',
        'Envía la invitación con la nota de la pregunta que elegiste (A, B o C). Si no cabe, usa la versión corta.',
        'Si acepta y no contesta, <b>no le escribas más por LinkedIn</b>: el siguiente toque es la visita, con la nota V-13.',
      ],
      plantillas: ['OUT-LI-A', 'OUT-LI-B', 'OUT-LI-C'],
      crm: 'Estado <b>Tocada</b> · próximo paso: "visita con nota V-13 el viernes [fecha]" · en notas: código (OUT-LI-…) y pregunta (V-…).',
    },
    {
      id: 'visita', emoji: '🚪', situacion: 'No tiene LinkedIn, o prefieres empezar en persona',
      tecnica: 'Visita en recepción y nota escrita', cuando: 'Primer toque (ruta 3) · viernes por la mañana',
      pasos: [
        '<b>Hora:</b> evita la primera media hora tras abrir, que es cuando recepción contesta lo de la noche.',
        'Mira desde la puerta: si hay alguien en el mostrador o suena el teléfono, espera de pie a un lado. Si en 2 o 3 minutos no queda libre, vuelve al final de la ronda.',
        'Habla bajo. Prohibido hacer fotos o nombrar otra clínica.',
        'Lleva la nota impresa y firmada, en un sobre: <b>V-3</b> si viste WhatsApp; si no, <b>V-2</b>. Con QR a la calculadora.',
        'Usa el guion A. Si no sabes el nombre de la dueña, el B. Solo si la sala de espera está vacía, el C.',
        'Si sale la dueña, pasa al caso siguiente. Al salir, apunta en el CRM antes de entrar en la siguiente clínica.',
      ],
      plantillas: ['OUT-VISITA-A', 'OUT-VISITA-B', 'OUT-VISITA-C', 'OUT-NOTA-V3', 'OUT-NOTA-V2', 'OUT-NOTA-V13'],
      crm: 'Estado <b>Tocada</b> · en notas: "visita [día], nota V-…, dejada a [recepción / en mano]" y la hora en que recepción dijo que la dueña está más libre.',
    },
    {
      id: 'duena', emoji: '🙋', situacion: 'En la visita sale la dueña o el dueño',
      tecnica: 'Una pregunta, escuchar y pedir 15 minutos', cuando: 'Durante la visita',
      pasos: [
        'Si hay pacientes cerca, pídele hablar un minuto aparte, en la puerta.',
        'Hazle <b>la misma pregunta que lleva la nota</b>.',
        'Escucha. Como mucho, otra pregunta ("¿Y eso quién lo lleva?"). <b>No expliques lo que hace Veta Ops.</b>',
        'Pide los 15 minutos con doble alternativa: "¿Mejor por la mañana o por la tarde?". Déjale la nota.',
      ],
      plantillas: ['OUT-DUEÑA-V3', 'OUT-DUEÑA-V2', 'OUT-DUEÑA-V13'],
      crm: 'Si contó algo de su recepción, su agenda o sus pacientes → <b>En conversación</b> (suma a la meta). Copia en notas su frase tal cual, entre comillas. Próxima fecha: la de la llamada de 15 minutos.',
    },
    {
      id: 'correo', emoji: '✉️', situacion: 'Te pide información o te da su correo',
      tecnica: 'Correo de respuesta, nunca un dossier', cuando: 'Ese día o el siguiente',
      pasos: [
        '<b>Solo si la clínica lo pide</b> ("mándelo por correo", "escríbame", "mándeme información") o te da el correo para eso.',
        'Si te piden información, pregunta antes: "Claro. ¿Qué le gustaría ver en ese correo para decir \'esto me interesa\'?".',
        'Manda el correo con la pregunta de la ficha <b>que todavía no se le haya hecho</b> (A, B o C). Desde tu correo, en texto plano, uno a uno.',
        'Si en la visita solo te dan un correo, sin pedir nada, <b>no mandes este correo</b>: a los 5–7 días va el seguimiento tras visita (caso "no contesta").',
      ],
      plantillas: ['OUT-CORREO-A', 'OUT-CORREO-B', 'OUT-CORREO-C'],
      crm: 'En "Correo" pon la dirección y en notas <b>quién te la dio y cuándo</b>. Un correo sin ese dato no se usa. Cuenta como un toque más.',
    },
    {
      id: 'contesta', emoji: '💬', situacion: 'Contesta (por LinkedIn, por correo o por teléfono)',
      tecnica: 'Agradecer, darle la calculadora y proponer 15 minutos', cuando: 'En cuanto contesta',
      pasos: [
        'Si te cuenta algo de su recepción, su agenda o sus pacientes, aunque sea una palabra ("se queda vacío"), <b>ya es una conversación</b>.',
        'Por LinkedIn, contesta con el mensaje de la calculadora. Si vuelve a contestar, propón la llamada.',
        'Propuesta de llamada (nuevo): "Gracias, [Nombre]. Esto se ve mejor con calma: ¿le parece que lo hablemos 15 minutos por teléfono esta semana? ¿Le va mejor por la mañana o por la tarde?".',
        'Con fecha cerrada, la llamada sigue el guion de venta (sección 03).',
      ],
      plantillas: ['OUT-LI-SI-CONTESTA'],
      crm: 'Estado <b>En conversación</b> · su frase tal cual en notas · próxima fecha: la de la llamada.',
      nuevo: true,
    },
    {
      id: 'silencio', emoji: '⏳', situacion: 'No contesta en 5–7 días',
      tecnica: 'Otro canal y otra pregunta', cuando: '2.º y 3.er toque',
      pasos: [
        '<b>Empezaste por LinkedIn:</b> visita con la nota V-13 (revisiones) y, si sale la dueña, su guion V-13.',
        '<b>Empezaste por la visita:</b> solo si te dieron un correo, el seguimiento tras visita (V-5, huecos). Si no te dieron correo, no hay tercer toque escrito.',
        '<b>Te pidió el correo y no contestó:</b> seguimiento en el mismo hilo (V-5).',
        'Antes de cada toque, mira en notas qué preguntas lleva ya: <b>nunca repitas una</b>. El seguimiento C (V-2) no se usa si ya preguntaste por el teléfono.',
        'Tras el 3.er toque sin respuesta: se queda en <b>Tocada</b> con la nota "sin respuesta tras 3 toques". No se insiste.',
      ],
      plantillas: ['OUT-SEGUIMIENTO-A', 'OUT-SEGUIMIENTO-B', 'OUT-SEGUIMIENTO-C', 'OUT-NOTA-V13', 'OUT-DUEÑA-V13'],
      crm: 'Pulsa "+1 toque hoy" en cada toque y apunta el código y la pregunta. Si alguien pide que no le escriban más: <b>Descartada</b>, con el motivo, y no se le contacta más.',
    },
  ],

  // 03 · Guion de venta: la llamada de 15 minutos (nuevo)
  llamada: {
    objetivo: 'Entender, con sus palabras, dónde se le escapan pacientes y horas, y agendar <b>30 minutos con Elkin</b> para el diagnóstico de su operación, gratis. <b>No vendes, no das precio y no prometes nada.</b> Hablas tú el 40 % y ella el 60 %.',
    pasos: [
      { titulo: 'Apertura · 10 segundos', guion: 'Buenos días, [Nombre]. Soy Janice, de Veta Ops: quedamos en hablar 15 minutos. ¿Sigue siendo buen momento?',
        nota: 'Si no lo es: "¿Le llamo mañana a esta hora?". Y ya tienes otra fecha.' },
      { titulo: 'Marco · 20 segundos', guion: 'Le cuento cómo lo hago: le hago unas preguntas sobre cómo llevan el teléfono, el WhatsApp y la agenda. Hoy no le voy a vender nada. Si vemos algo que merezca la pena, le propongo media hora con Elkin Dueñas, que es quien hace el diagnóstico de su operación, y es gratis. ¿Le parece?',
        nota: 'Si te pregunta el precio antes de que hayas preguntado nada, perdiste el marco: "Eso se lo dice Elkin con su caso. Antes, déjeme preguntarle una cosa…" y sigues.' },
      { titulo: 'Descubrir · 8 a 10 minutos', guion: '¿Qué le hizo aceptar esta conversación?',
        nota: 'Después, 3 o 4 preguntas de la sección 04: empieza por la del toque que le hizo contestar y sigue por lo que saque la dueña o el dueño. Tras cada respuesta, una de profundización: "¿Y eso quién lo lleva?", "¿Y qué pasa después?", "¿Cada cuánto pasa?". <b>Calla después de preguntar.</b> El número tiene que salir de su boca: tú no das cifras.' },
      { titulo: 'Resumir con sus palabras · 30 segundos', guion: 'Si le he entendido bien: [lo que dijo, con sus palabras]. ¿Es así?',
        nota: 'Si corrige algo, mejor: apúntalo tal cual.' },
      { titulo: 'Quién decide', guion: 'Además de usted, ¿quién tendría que estar de acuerdo para un cambio así?',
        nota: 'Si hay un socio o una socia, invítale a la media hora con Elkin: "¿Le parece que lo veamos los tres?".' },
      { titulo: 'Cierre · agendar, no vender', guion: 'Lo siguiente es media hora con Elkin. Revisa con usted lo que me ha contado y le dice dónde está la pérdida y si tiene arreglo. Es gratis y no le compromete a nada. ¿Le va mejor esta semana o la que viene? ¿Por la mañana o por la tarde?',
        nota: 'Agéndala en el calendario de Elkin (reunión de 30 minutos) y pide el correo para la invitación: "¿A qué correo le mando la invitación?". Ese correo lo da la clínica, así que se puede usar.' },
      { titulo: 'Si no hay encaje', guion: 'Por lo que me cuenta, eso lo tienen bien resuelto. Se lo agradezco, [Nombre]. Si algo cambia, aquí estamos.',
        nota: 'Sin insistir. Apunta el motivo: es tan útil como un sí.' },
    ],
    despues: 'Antes de la siguiente llamada, en la tarjeta: estado <b>Reunión agendada</b> (o el que toque), la fecha de la reunión en "Próxima fecha" y, en notas, sus frases literales entre comillas, quién decide y qué programa usan. Elkin prepara el diagnóstico con eso.',
  },

  // 04 · Preguntas de descubrimiento (ICP §5.2). Son hipótesis: se apunta lo que conteste.
  preguntas: [
    ['V-2', 'Teléfono', 'Cuando su recepción está atendiendo a alguien en el mostrador y suena el teléfono, ¿qué pasa con esa llamada?', '"Se pierde", "devolvemos cuando podemos"'],
    ['V-3', 'WhatsApp', '¿Qué encuentra su equipo en el WhatsApp a primera hora de la mañana?', 'Mensajes de la noche sin responder'],
    ['V-5', 'Huecos', 'La semana pasada, cuando alguien anuló a última hora, ¿qué hicieron con ese hueco?', '"Se quedó vacío"'],
    ['V-13', 'Revisiones', 'A los pacientes a los que les toca revisión, ¿los llama alguien de la clínica o vuelven cuando se acuerdan?', '"No lo sé", "nadie tiene tiempo"'],
    ['V-14', 'Anuncios', '¿Hace anuncios o trabaja con una agencia? Las consultas que llegan de ahí, ¿quién las contesta y en cuánto tiempo?', 'Paga por captar y no sabe cuántas se contestan a tiempo'],
    ['V-4', 'Medir', '¿Sabe cuántas llamadas no se contestaron la semana pasada? ¿Dónde lo miraría?', '"No tengo forma de saberlo"'],
    ['V-8', 'Recepción', 'Si su recepcionista se pone de baja dos semanas, ¿qué pasa con el teléfono?', '"Contesto yo entre paciente y paciente"'],
    ['V-12', 'Programa', '¿Con qué programa llevan la agenda? ¿Manda ya recordatorios?', 'Tiene programa y aun así quedan huecos'],
    ['V-9', 'Lo que probó', '¿Qué han probado antes para esto? ¿Qué pasó?', 'Cuenta un intento que no funcionó'],
  ],
  preguntasNota: 'La columna de la derecha es lo que suele decir una dueña cuando hay problema; no lo digas tú. Si contesta lo contrario ("siempre hay alguien libre"), también se apunta: nos dice que esa no es su pérdida.',

  // 05 · Si te preguntan / objeciones, en la voz de Janice
  respuestas: [
    ['"¿Qué vende?" / "¿De qué se trata?"', 'En Veta Ops le ofrecemos a una clínica cubrir lo que hoy nadie atiende: las llamadas en hora pico, los mensajes de fuera de horario y los recordatorios. Antes de proponer nada, queremos entender cómo lo llevan ustedes.'],
    ['"¿Cuánto cuesta?"', 'Depende de lo que necesite su clínica. Se lo dice Elkin con su caso en el diagnóstico de su operación, que es gratis.'],
    ['"¿Con qué clínicas trabajan?"', 'Con clínicas, todavía con ninguna. Por eso empezamos preguntando. Lo que sí lleva Elkin es un proyecto de IA en operaciones para una empresa del sector minero en Colombia.'],
    ['"¿De dónde ha sacado mi correo?"', 'El que sea cierto: "Me lo dieron en recepción cuando pasé [día]" o "Me lo pasó usted por LinkedIn". Si no sabes de dónde salió, ese correo no se usa.'],
    ['"Mándeme información"', 'Claro. ¿Qué le gustaría ver en ese correo para decir "esto me interesa"? (Luego, el correo con la pregunta y la calculadora, no un dossier.)'],
    ['"¿Esto es para quitarle trabajo a recepción?"', 'No. Es para lo que hoy nadie puede atender: las llamadas en hora pico y los mensajes de fuera de horario.'],
    ['"Mis pacientes son mayores, quieren hablar con una persona" (nuevo)', 'Tiene sentido. Quien quiera hablar con una persona, habla con una persona. Por curiosidad: de sus pacientes, ¿qué parte llama y qué parte escribe por WhatsApp?'],
    ['"Ya tenemos programa de gestión" (nuevo)', 'Perfecto, casi todas las clínicas lo tienen. ¿Manda ya recordatorios? ¿Y quién contesta lo que entra cuando la clínica está cerrada? Si encaja con su programa, lo revisa Elkin en el diagnóstico.'],
    ['"No tengo tiempo" (nuevo)', 'Lo entiendo, por eso es poco. ¿Qué día de la semana tiene menos pacientes? Lo buscamos ahí.'],
    ['"Lo tengo que hablar con mi socio" (nuevo)', 'Claro. ¿Le parece que lo veamos los tres con Elkin? Así se lo cuenta él directamente y usted no tiene que hacer de intermediario.'],
    ['"¿Y si no funciona?" (nuevo)', 'Eso se lo explica Elkin en el diagnóstico, con su caso. Yo no le puedo prometer nada.'],
    ['"Ahora no es el momento" (nuevo)', 'Entendido. ¿Qué tendría que pasar para que sí lo fuera? (Apunta la respuesta y la fecha que diga.)'],
    ['"No me interesa"', 'Entendido, no insisto. Solo por saberlo: ¿es que ya lo tienen resuelto o que ahora no toca? (Se apunta la respuesta.)'],
    ['"No me escriba más"', 'Entendido. No le escribo más. (Y no se pregunta nada más: estado Descartada, con el motivo.)'],
  ],

  // 06 · Qué cuenta como conversación (D-14)
  cuenta: [
    'La dueña o el dueño cuenta algo de su recepción, su agenda o sus pacientes: en persona, por teléfono, por LinkedIn o por correo.',
    'Una sola respuesta basta, aunque sea de una palabra, si contesta la pregunta ("se queda vacío").',
    'Cuenta una por persona y clínica, y suma a la meta: 5 conversaciones al 19-dic y 10 al 18-ene.',
  ],
  noCuenta: [
    'Una respuesta automática.',
    'Un "no me interesa" o un "mándeme información" sin nada más.',
    'Aceptar una invitación de LinkedIn, o un "gracias".',
    'Lo que cuente recepción sin la dueña.',
  ],
};
