// Módulo Clínicas del CRM (T-044 de Ecosistema Digital).
// Solo textos fijos: intro, metas y mensajes de primer contacto.
// Los datos de cada clínica viven en Supabase (crm.empresas, modulo = 'clinicas'):
// este repo es PÚBLICO y aquí nunca va el nombre de una clínica.
window.CLINICAS = {
  intro:
    '<p><b>Clínicas dentales independientes de Bilbao y Portugalete.</b> Revisadas desde fuera (web, WhatsApp, reserva online) y ordenadas por encaje: <b>1 = alto</b>.</p>' +
    '<p><b>El objetivo es una conversación, no una venta.</b> Primer contacto siempre <b>de usted</b>. Nunca se da precio ni se promete nada: si preguntan, «eso lo ve Elkin en el diagnóstico, que es gratuito».</p>' +
    '<p>Marca <b>En conversación</b> solo cuando la dueña o el dueño te cuenta algo de su recepción, su agenda o sus pacientes. Antes del primer contacto, mira si tiene anuncios en la <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener">Biblioteca de anuncios de Meta</a> y apúntalo en la tarjeta.</p>',
  // Metas de estrategia/kpis.md (conversaciones con clínicas). Cuentan las tarjetas en «En conversación» o «Reunión agendada».
  metas: [
    { n: 5, texto: 'Conversaciones · meta al 19-dic' },
    { n: 10, texto: 'Conversaciones · meta al 18-ene' }
  ],
  // Se rellenan con las plantillas aprobadas de produccion/2026-11-22-prospeccion-clinicas/plantillas.md
  mensajes: []
};
