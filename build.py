# -*- coding: utf-8 -*-
"""Construye index.html + guion.js a partir del CRM original (artifact de Claude).

El original guardaba en la base de datos interna de Claude, que solo admite
miembros de la organizacion: Janice (externa) caia en "modo local" y perdia
todo. Aqui se conserva su HTML/CSS y se sustituye la capa de datos por
app.js, que guarda en Supabase.

Uso: python build.py   (lee la fuente, escribe index.html y guion.js)

De donde sale la fuente, y por que no esta aqui
-----------------------------------------------
Este repo es PUBLICO (GitHub Pages lo sirve). El HTML original lleva nombres de
empresas reales en su bloque <script>, que build.py recorta y por eso nunca se
publica; subirlo al repo si los publicaria. De ahi el .gitignore.

Pero entonces la fuente vivia en una sola carpeta de un solo ordenador, y sin
ella este index.html solo se puede editar a mano. Asi que la copia buena esta en
el vault, que es un repo PRIVADO, y aqui se busca en los dos sitios.
"""
import io, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
# crm-web -> fuerza-venta-espana -> CLAUDE
RAIZ = os.path.dirname(os.path.dirname(BASE))
FUENTES = [
    os.path.join(BASE, ".original", "index.html"),
    os.path.join(RAIZ, "Obsidian", "Segundo_Cerebro_AI-OPS", "projects", "crm-janice", "fuente", "index.html"),
]

ruta = next((f for f in FUENTES if os.path.exists(f)), None)
if ruta is None:
    sys.exit(
        "No encuentro el HTML original del CRM. Lo busco en:\n  "
        + "\n  ".join(FUENTES)
        + "\n\nEsta en el vault (repo privado), en projects/crm-janice/fuente/.\n"
        "No se sube a ESTE repo porque es publico y el original lleva nombres de clientes."
    )
print("fuente: %s" % ruta)
src = io.open(ruta, encoding="utf-8").read()

# ---------------------------------------------------------------- guion.js
m = re.search(r"const GUION_DEFAULT = (\{.*?\n  \});", src, re.S)
assert m, "no encuentro GUION_DEFAULT"
io.open(os.path.join(BASE, "guion.js"), "w", encoding="utf-8").write(
    "// Guion de llamada por defecto (si nadie lo ha editado en la base de datos).\n"
    "window.GUION_DEFAULT = " + m.group(1) + ";\n")

# ---------------------------------------------------------------- index.html
html = src[:src.index("<script>")]

def sub(old, new, count=1):
    global html
    assert html.count(old) >= 1, "falta: " + old[:60]
    html = html.replace(old, new, count)

sub("Midas Ops", "Veta Ops", -1) if "Midas Ops" in html else None

EXTRA_CSS = """
  .login{position:fixed;inset:0;z-index:50;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:16px}
  .login[hidden]{display:none}
  .login-box{width:100%;max-width:380px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px 24px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px}
  .login-box h1{font-size:30px}
  .login-box p{margin:0;color:var(--ink-soft);font-size:14px;line-height:1.5}
  .login-box input{font-family:"IBM Plex Mono",monospace;font-size:18px;letter-spacing:.08em;text-transform:uppercase;padding:11px 12px;border-radius:7px;border:1px solid var(--border);background:var(--surface-2);color:var(--ink);width:100%}
  .login-box button{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:17px;letter-spacing:.04em;text-transform:uppercase;background:var(--accent);color:var(--accent-ink);border:none;border-radius:7px;padding:11px;cursor:pointer}
  .login-err{color:var(--bad);font-size:13px;font-weight:600;min-height:1em}
  .user-chip{font-family:"IBM Plex Mono",monospace;font-size:12px;padding:3px 8px;border-radius:999px;background:var(--surface-2);color:var(--ink)}
  .logout{font-family:"IBM Plex Mono",monospace;font-size:11.5px;background:none;border:1px solid var(--border);border-radius:5px;padding:3px 8px;color:var(--ink-soft);cursor:pointer}
  .status-line{flex-wrap:wrap}
  .error-banner{margin-top:14px;padding:12px 14px;border-radius:6px;background:var(--bad-soft);color:var(--bad);font-weight:600;font-size:14px;line-height:1.45}
  .error-banner[hidden]{display:none}
  .save-btn{font-family:"IBM Plex Mono",monospace;font-size:12px;padding:6px 10px;border-radius:6px;background:var(--accent);color:var(--accent-ink);border:none;cursor:pointer}
  .card-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .save-state{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--ink-soft)}
  .save-state.ok{color:var(--good)} .save-state.pending{color:var(--warn)} .save-state.err{color:var(--bad);font-weight:600}
  .who-meta{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-soft)}
  .muted{color:var(--ink-soft)}
  .add-form input{width:100%}
  .prop-btn{font-family:"IBM Plex Mono",monospace;font-size:12px;padding:6px 10px;border-radius:6px;background:var(--surface-2);color:var(--ink);border:1px solid var(--border);cursor:pointer}
  .prop-btn:disabled{opacity:.55;cursor:default}
  .prop-chip{margin-top:8px;font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--ink-soft);background:var(--surface-2);border-radius:6px;padding:5px 8px}
"""
# el primer </style> es el del contenedor; el segundo es el del CRM
i = html.index("</style>", html.index("</style>") + 1)
html = html[:i] + EXTRA_CSS + html[i:]

sub('<span id="conn-text">conectando…</span>',
    '<span id="conn-text">conectando…</span>\n      <span class="user-chip" id="user-chip"></span>'
    '\n      <button class="logout" id="logout" type="button">salir</button>')

sub('</div>\n\n  <div class="tabs"',
    '</div>\n\n  <div class="error-banner" id="error-banner" role="alert" hidden></div>\n\n  <div class="tabs"')

sub('aria-controls="view-guion">Guion de llamada</button>',
    'aria-controls="view-guion">Guion de llamada</button>\n'
    '    <button class="tab-btn" id="tab-btn-actividad" role="tab" aria-selected="false" aria-controls="view-actividad" hidden>Actividad</button>')

sub('  <footer>',
    '  <section class="view" id="view-actividad" hidden>\n'
    '    <div class="g-toolbar">\n'
    '      <span class="g-toolbar-hint">Cada cambio de cada ficha: quién, cuándo, antes y después.</span>\n'
    '      <button class="edit-btn" id="actividad-refresh" type="button">↻ Actualizar</button>\n'
    '    </div>\n'
    '    <div class="g-section" id="actividad-list"></div>\n'
    '  </section>\n\n  <footer>')

sub('Conectado con Elkin en tiempo real — cualquier ficha que edites aquí, él la ve.',
    'Cada cambio se guarda en la base de datos y queda registrado — Elkin lo ve al momento.')

sub('<div class="wrap">',
    '<div class="login" id="login" hidden>\n'
    '  <div class="login-box">\n'
    '    <span class="eyebrow">Veta Ops · Fuerza de venta</span>\n'
    '    <h1>CRM de Janice</h1>\n'
    '    <p>Escribe tu código de acceso. Solo se pide la primera vez en este dispositivo.</p>\n'
    '    <input id="login-code" autocomplete="off" autocapitalize="characters" placeholder="XXXXXX-XXXXXX" aria-label="Código de acceso">\n'
    '    <button id="login-btn" type="button">Entrar</button>\n'
    '    <span class="login-err" id="login-err" role="alert"></span>\n'
    '  </div>\n'
    '</div>\n\n<div class="wrap">')

# sectores.js es propio (sección 05 del guion): build.py no lo genera ni lo pisa.
html += '<script src="sectores.js"></script>\n<script src="guion.js"></script>\n<script src="app.js"></script>\n</body></html>\n'
html = html.replace("<head>", '<head><meta name="robots" content="noindex">', 1)

io.open(os.path.join(BASE, "index.html"), "w", encoding="utf-8").write(html)
print("index.html %.1f KB · guion.js ok" % (len(html) / 1024.0))
