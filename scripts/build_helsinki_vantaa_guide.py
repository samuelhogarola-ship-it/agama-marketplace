from __future__ import annotations

import math
import textwrap
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / "tmp" / "pdfs" / "helsinki_assets"
OUT = ROOT / "output" / "pdf" / "guia-helsinki-vantaa-21-22-agosto-2026.pdf"
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = A4
M = 16 * mm

INK = colors.HexColor("#17202A")
MUTED = colors.HexColor("#5F6B76")
LINE = colors.HexColor("#D8DEE4")
PALE = colors.HexColor("#F4F7F8")
BLUE = colors.HexColor("#1B6CA8")
TEAL = colors.HexColor("#1F8A80")
GREEN = colors.HexColor("#3F7D58")
AMBER = colors.HexColor("#C77D18")
RED = colors.HexColor("#B94A48")
CREAM = colors.HexColor("#FFF8ED")


ASSETS = {
    "cover": {
        "file": "Helsinki_Panorama.jpg",
        "name": "Helsinki Panorama",
        "credit": "Ad Meskens / Wikimedia Commons / CC BY-SA 4.0",
    },
    "airport": {
        "file": "Helsinki_Airport_station.jpg",
        "name": "Helsinki Airport station",
        "credit": "Antti Yrjonen / Vantaa City Museum / CC BY 4.0",
    },
    "station": {
        "file": "Finland_1274_-_Railway_Station_-_Helsinki_(4043126800).jpg",
        "name": "Helsinki Central Railway Station",
        "credit": "Dennis G. Jarvis / Wikimedia Commons / CC BY-SA 2.0",
    },
    "esplanadi": {
        "file": "Esplanadi.jpg",
        "name": "Esplanadi",
        "credit": "Wikimedia Commons contributor / license on file page",
    },
    "cathedral": {
        "file": "Helsingin_tuomiokirkko_-_Helsinki_Cathedral.jpg",
        "name": "Senate Square and Helsinki Cathedral",
        "credit": "Anton Ehrola / Wikimedia Commons / CC BY-SA 4.0",
    },
    "market": {
        "file": "Helsinki_Market_Square_in_July.jpg",
        "name": "Kauppatori",
        "credit": "JIP / Wikimedia Commons / CC BY-SA 4.0",
    },
    "ateneum": {
        "file": "Ateneum_facade.jpg",
        "name": "Ateneum facade",
        "credit": "Jouni Vaahtera / public domain",
    },
    "oodi_ext": {
        "file": "Helsinki_Central_Library_Oodi,_2019_(01).jpg",
        "name": "Oodi exterior",
        "credit": "Bahnfrend / Wikimedia Commons / CC BY-SA 4.0",
    },
    "oodi_int": {
        "file": "Interior_of_Oodi.jpg",
        "name": "Oodi interior",
        "credit": "JIP / Wikimedia Commons / CC BY-SA 4.0",
    },
    "temppeliaukio": {
        "file": "Temppeliaukio_Church_interior_03.jpg",
        "name": "Temppeliaukio Church interior",
        "credit": "Ad Meskens / Wikimedia Commons / CC BY-SA 4.0",
    },
}


def commons_url(file_name: str, width: int = 1800) -> str:
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(file_name) + f"?width={width}"


def download_assets() -> dict[str, Path]:
    paths: dict[str, Path] = {}
    headers = {"User-Agent": "Codex PDF travel guide builder"}
    for key, meta in ASSETS.items():
        suffix = Path(meta["file"]).suffix or ".jpg"
        path = TMP / f"{key}{suffix}"
        paths[key] = path
        if path.exists() and path.stat().st_size > 10_000:
            continue
        req = urllib.request.Request(commons_url(meta["file"]), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                path.write_bytes(r.read())
        except Exception:
            make_placeholder(path, meta["name"])
    return paths


def make_placeholder(path: Path, label: str) -> None:
    img = Image.new("RGB", (1400, 900), (230, 237, 240))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def prep_images(paths: dict[str, Path]) -> dict[str, Path]:
    out = {}
    for key, path in paths.items():
        try:
            img = Image.open(path).convert("RGB")
            img = ImageOps.exif_transpose(img)
            img.thumbnail((1800, 1200), Image.Resampling.LANCZOS)
            clean = TMP / f"{key}.jpg"
            img.save(clean, quality=88, optimize=True)
            out[key] = clean
        except Exception:
            make_placeholder(path, ASSETS[key]["name"])
            out[key] = path
    return out


class Guide:
    def __init__(self, filename: Path, images: dict[str, Path]):
        self.c = canvas.Canvas(str(filename), pagesize=A4)
        self.images = images
        self.page = 0

    def new_page(self, title: str | None = None, kicker: str | None = None):
        if self.page:
            self.footer()
            self.c.showPage()
        self.page += 1
        self.c.setFillColor(colors.white)
        self.c.rect(0, 0, W, H, fill=1, stroke=0)
        if title:
            self.header(title, kicker)

    def header(self, title: str, kicker: str | None = None):
        self.c.setFillColor(INK)
        self.c.setFont("Helvetica-Bold", 20)
        self.c.drawString(M, H - 22 * mm, title)
        if kicker:
            self.c.setFillColor(MUTED)
            self.c.setFont("Helvetica", 8.5)
            self.c.drawString(M, H - 27 * mm, kicker)
        self.c.setStrokeColor(LINE)
        self.c.line(M, H - 31 * mm, W - M, H - 31 * mm)

    def footer(self):
        self.c.setFillColor(MUTED)
        self.c.setFont("Helvetica", 7.5)
        self.c.drawString(M, 9 * mm, "Guia practica Helsinki & Vantaa - informacion verificada el 19 agosto 2026")
        self.c.drawRightString(W - M, 9 * mm, str(self.page))

    def text(self, x, y, txt, size=9.5, color=INK, bold=False, max_width=70, leading=None):
        font = "Helvetica-Bold" if bold else "Helvetica"
        self.c.setFont(font, size)
        self.c.setFillColor(color)
        leading = leading or size * 1.25
        lines = []
        for part in txt.split("\n"):
            if not part:
                lines.append("")
            else:
                chars = max(18, int(max_width * 9.5 / size))
                lines.extend(textwrap.wrap(part, chars))
        yy = y
        for line in lines:
            self.c.drawString(x, yy, line)
            yy -= leading
        return yy

    def para(self, x, y, w, h, txt, size=9.3, color=INK, leading=None, bold=False):
        style = ParagraphStyle(
            "p",
            fontName="Helvetica-Bold" if bold else "Helvetica",
            fontSize=size,
            leading=leading or size * 1.25,
            textColor=color,
            spaceAfter=0,
        )
        p = Paragraph(txt.replace("\n", "<br/>"), style)
        p.wrapOn(self.c, w, h)
        p.drawOn(self.c, x, y - p.height)
        return y - p.height

    def image(self, key, x, y, w, h, radius=0, darken=False):
        path = self.crop_for_box(key, w, h)
        self.c.saveState()
        p = self.c.beginPath()
        if radius:
            p.roundRect(x, y, w, h, radius)
        else:
            p.rect(x, y, w, h)
        self.c.clipPath(p, stroke=0)
        self.c.drawImage(str(path), x, y, w, h)
        if darken:
            self.c.setFillColor(colors.Color(0, 0, 0, alpha=0.32))
            self.c.rect(x, y, w, h, fill=1, stroke=0)
        self.c.restoreState()

    def crop_for_box(self, key, w, h):
        src = self.images[key]
        out = TMP / f"{key}_{int(w)}x{int(h)}_fill.jpg"
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            return out
        img = Image.open(src).convert("RGB")
        target = float(w) / float(h)
        current = img.width / img.height
        if current > target:
            new_w = int(img.height * target)
            left = (img.width - new_w) // 2
            img = img.crop((left, 0, left + new_w, img.height))
        else:
            new_h = int(img.width / target)
            top = (img.height - new_h) // 2
            img = img.crop((0, top, img.width, top + new_h))
        px_w = max(400, int(w * 2.4))
        px_h = max(300, int(h * 2.4))
        img = img.resize((px_w, px_h), Image.Resampling.LANCZOS)
        img.save(out, quality=88, optimize=True)
        return out

    def card(self, x, y, w, h, title, body, accent=BLUE, fill=colors.white):
        self.c.setFillColor(fill)
        self.c.setStrokeColor(LINE)
        self.c.roundRect(x, y, w, h, 5, fill=1, stroke=1)
        self.c.setFillColor(accent)
        self.c.roundRect(x, y + h - 5, w, 5, 4, fill=1, stroke=0)
        self.text(x + 4 * mm, y + h - 12 * mm, title, size=10.5, bold=True, color=INK, max_width=45)
        self.para(x + 4 * mm, y + h - 18 * mm, w - 8 * mm, h - 22 * mm, body, size=8.4, color=MUTED)

    def pill(self, x, y, txt, fill, color=colors.white):
        pad = 4 * mm
        width = stringWidth(txt, "Helvetica-Bold", 8.5) + pad * 2
        self.c.setFillColor(fill)
        self.c.roundRect(x, y, width, 7 * mm, 3.5 * mm, fill=1, stroke=0)
        self.c.setFillColor(color)
        self.c.setFont("Helvetica-Bold", 8.5)
        self.c.drawString(x + pad, y + 2.15 * mm, txt)
        return x + width + 2 * mm

    def qr(self, x, y, url, label):
        qr = QrCodeWidget(url)
        b = qr.getBounds()
        d = Drawing(24 * mm, 24 * mm, transform=[24 * mm / (b[2] - b[0]), 0, 0, 24 * mm / (b[3] - b[1]), 0, 0])
        d.add(qr)
        renderPDF.draw(d, self.c, x, y)
        self.text(x, y - 3 * mm, label, 6.8, MUTED, max_width=20)


def draw_vertical_route(g: Guide, x, y, items, accent=BLUE, gap=22 * mm):
    for i, (label, note) in enumerate(items):
        yy = y - i * gap
        if i < len(items) - 1:
            g.c.setStrokeColor(accent)
            g.c.setLineWidth(1.4)
            g.c.line(x, yy - 5 * mm, x, yy - gap + 7 * mm)
        g.c.setFillColor(colors.white)
        g.c.setStrokeColor(accent)
        g.c.circle(x, yy, 4.4 * mm, fill=1, stroke=1)
        g.c.setFillColor(accent)
        g.c.circle(x, yy, 2.1 * mm, fill=1, stroke=0)
        g.text(x + 8 * mm, yy + 1.2 * mm, label, 10, INK, bold=True, max_width=42)
        if note:
            g.text(x + 8 * mm, yy - 4.2 * mm, note, 7.8, MUTED, max_width=48)


def draw_route_map(g: Guide, x, y, w, h):
    places = [
        ("Central Station", 0.08, 0.72, "inicio"),
        ("Esplanadi", 0.26, 0.58, "10 min"),
        ("Senate Square", 0.46, 0.64, "12 min"),
        ("Cathedral", 0.55, 0.72, "3 min"),
        ("Market Square", 0.72, 0.58, "10 min"),
        ("Puerto", 0.86, 0.47, "5 min"),
        ("Ateneum", 0.42, 0.42, "12 min"),
        ("Oodi", 0.25, 0.28, "10 min"),
        ("Toolonlahti", 0.42, 0.17, "12 min"),
        ("Central Station", 0.08, 0.72, "12 min"),
    ]
    g.c.setFillColor(PALE)
    g.c.roundRect(x, y, w, h, 6, fill=1, stroke=0)
    g.c.setStrokeColor(colors.HexColor("#B8C6CB"))
    g.c.setLineWidth(1)
    for i in range(5):
        yy = y + h * (i + 1) / 6
        g.c.line(x + 8 * mm, yy, x + w - 8 * mm, yy)
    pts = [(x + w * px, y + h * py) for _, px, py, _ in places]
    g.c.setStrokeColor(TEAL)
    g.c.setLineWidth(2.2)
    for a, b in zip(pts, pts[1:]):
        g.c.line(a[0], a[1], b[0], b[1])
    for idx, ((label, px, py, note), (xx, yy)) in enumerate(zip(places[:-1], pts[:-1]), 1):
        g.c.setFillColor(colors.white)
        g.c.setStrokeColor(TEAL)
        g.c.circle(xx, yy, 4.5 * mm, fill=1, stroke=1)
        g.c.setFillColor(TEAL)
        g.c.setFont("Helvetica-Bold", 7)
        g.c.drawCentredString(xx, yy - 2, str(idx))
        g.text(xx - 13 * mm, yy - 8 * mm, label, 6.8, INK, bold=True, max_width=16)
        g.text(xx - 10 * mm, yy - 12 * mm, note, 6.2, MUTED, max_width=14)


def draw_table(g: Guide, x, y, widths, rows, header=True, row_h=10 * mm):
    total_w = sum(widths)
    yy = y
    for r, row in enumerate(rows):
        fill = INK if r == 0 and header else (colors.white if r % 2 else PALE)
        g.c.setFillColor(fill)
        g.c.rect(x, yy - row_h, total_w, row_h, fill=1, stroke=0)
        xx = x
        for i, cell in enumerate(row):
            g.c.setFillColor(colors.white if r == 0 and header else INK)
            g.c.setFont("Helvetica-Bold" if r == 0 and header else "Helvetica", 7.7)
            g.c.drawString(xx + 2.3 * mm, yy - 6.5 * mm, str(cell))
            xx += widths[i]
        yy -= row_h
    g.c.setStrokeColor(LINE)
    g.c.rect(x, yy, total_w, row_h * len(rows), fill=0, stroke=1)
    return yy


def build():
    images = prep_images(download_assets())
    g = Guide(OUT, images)

    g.new_page()
    g.image("cover", 0, 0, W, H, darken=True)
    g.c.setFillColor(colors.white)
    g.c.setFont("Helvetica-Bold", 35)
    g.c.drawString(M, H - 68 * mm, "HELSINKI & VANTAA")
    g.c.setFont("Helvetica", 15)
    g.c.drawString(M, H - 80 * mm, "Guia practica - 21-22 agosto 2026")
    g.c.setFont("Helvetica", 10.5)
    g.c.drawString(M, H - 90 * mm, "Aeropuerto - Aviapolis - Helsinki centro - Cultura - Transporte")
    g.pill(M, H - 107 * mm, "MALAGA -> HELSINKI AIRPORT", BLUE)
    g.pill(M, H - 118 * mm, "HOTEL: CLARION AVIAPOLIS", TEAL)
    g.pill(M, H - 129 * mm, "VISITA PRINCIPAL: SABADO 22/08", GREEN)

    g.new_page("Vista Rapida", "Lo esencial para moverse sin perder tiempo")
    g.card(M, H - 72 * mm, 82 * mm, 37 * mm, "Llegada - 21 agosto", "Helsinki Airport -> tren I -> Aviapolis -> Clarion Hotel Aviapolis. Una parada, 2 min de tren y salida hacia Aviabulevardi.", TEAL)
    g.card(M + 92 * mm, H - 72 * mm, 82 * mm, 37 * mm, "Helsinki - 22 agosto", "Aviapolis -> tren I/P -> Helsinki Central. Compra HSL ABC 24 h para cubrir tren, tranvia, metro y bus durante el dia.", BLUE)
    draw_vertical_route(g, M + 8 * mm, H - 100 * mm, [
        ("21 agosto", "Malaga -> Helsinki Airport -> Aviapolis"),
        ("Hotel", "Clarion Hotel Aviapolis, Karhumäentie 5"),
        ("22 agosto 09:00", "Dejar maletas y salir a Helsinki centro"),
        ("Centro historico", "Esplanadi, Senate Square, Cathedral, Kauppatori"),
        ("Cultura", "Ateneum y Oodi"),
        ("Regreso", "Helsinki Central -> Aviapolis"),
    ], TEAL, 20 * mm)
    g.card(M + 95 * mm, H - 168 * mm, 79 * mm, 73 * mm, "Compra recomendada", "Dia 1: HSL BC single ticket, 3,30 EUR adulto en app/tarjeta.\n\nDia 2: HSL ABC day ticket 24 h, 12,80 EUR adulto.\n\nTotal transporte estimado: 16,10 EUR por persona.", GREEN, CREAM)

    g.new_page("Dia 1 - Aeropuerto a Clarion Aviapolis", "Ruta directa desde Helsinki Airport")
    g.image("airport", M, H - 100 * mm, 84 * mm, 53 * mm, 5)
    g.card(M + 94 * mm, H - 100 * mm, 80 * mm, 53 * mm, "RECOMENDACION: TREN", "Helsinki Airport -> estacion bajo terminal -> tren I -> Aviapolis -> 1-3 min andando al hotel.\n\nLa estacion esta directamente bajo la terminal y se accede por ascensor o escaleras mecanicas.", TEAL)
    draw_vertical_route(g, M + 12 * mm, H - 125 * mm, [
        ("Helsinki Airport", "llegadas"),
        ("Estacion aeropuerto", "bajo la terminal"),
        ("Train I", "1 parada"),
        ("Aviapolis", "salida Aviabulevardi"),
        ("Clarion Hotel Aviapolis", "junto a la estacion"),
    ], BLUE, 18 * mm)
    g.card(M + 95 * mm, H - 174 * mm, 79 * mm, 59 * mm, "Tren vs taxi", "Tren: muy rapido, barato, directo y recomendado.\n\nTaxi: unos 5 min, bastante mas caro; util solo con mucho equipaje, movilidad reducida o cansancio extremo.", AMBER)

    g.new_page("Dia 2 - Aviapolis a Helsinki Centro", "Billete ABC y trenes I/P")
    g.card(M, H - 73 * mm, 80 * mm, 38 * mm, "Ruta principal", "Clarion Aviapolis -> estacion Aviapolis -> tren I/P -> Helsinki Central Station.\n\nDuracion aproximada: 30 minutos.", BLUE)
    g.card(M + 94 * mm, H - 73 * mm, 80 * mm, 38 * mm, "HSL ABC 24 h", "Cubre Aviapolis/Vantaa, Helsinki, tren, tranvia, metro y bus.\n\nPrecio oficial 2026: 12,80 EUR adulto.", GREEN)
    x0, y0 = M + 6 * mm, H - 118 * mm
    stops = [("Aviapolis", 0), ("Airport", 32), ("Pasila", 95), ("Helsinki Central", 145)]
    g.c.setStrokeColor(BLUE)
    g.c.setLineWidth(4)
    g.c.line(x0, y0, x0 + 145 * mm, y0)
    for label, dx in stops:
        x = x0 + dx * mm
        g.c.setFillColor(colors.white)
        g.c.circle(x, y0, 5 * mm, fill=1, stroke=0)
        g.c.setStrokeColor(BLUE)
        g.c.circle(x, y0, 5 * mm, fill=0, stroke=1)
        g.text(x - 12 * mm, y0 - 10 * mm, label, 7.4, INK, bold=True, max_width=18)
    g.card(M, H - 184 * mm, 112 * mm, 42 * mm, "Atajo mental", "Para ir al centro: cualquier I/P que vaya hacia Helsinki Central y pare en Aviapolis. Para volver: Helsinki Central -> Aviapolis. Comprueba andenes en HSL el mismo dia por obras de verano.", TEAL)
    g.qr(M + 130 * mm, H - 174 * mm, "https://www.hsl.fi/en", "HSL.fi")

    g.new_page("Ruta a Pie por Helsinki", "Centro historico, puerto, cultura y bahia")
    draw_route_map(g, M, H - 194 * mm, W - 2 * M, 128 * mm)
    g.card(M, H - 247 * mm, W - 2 * M, 34 * mm, "Ritmo recomendado", "Recorrido a pie pensado para ver lo esencial sin correr. Si llueve o hay cansancio, prioriza Senate Square + Cathedral, Kauppatori, Ateneum y Oodi; deja Toolonlahti o Temppeliaukio como flexible.", TEAL)

    g.new_page("Central Station + Esplanadi", "Inicio facil para orientarse")
    g.image("station", M, H - 118 * mm, 82 * mm, 63 * mm, 5)
    g.image("esplanadi", M + 92 * mm, H - 118 * mm, 82 * mm, 63 * mm, 5)
    g.card(M, H - 168 * mm, 82 * mm, 39 * mm, "Helsinki Central Station", "Edificio clave de Helsinki, disenado por Eliel Saarinen. Buen punto de inicio: trenes, metro y tranvias quedan concentrados alrededor.", BLUE)
    g.card(M + 92 * mm, H - 168 * mm, 82 * mm, 39 * mm, "Esplanadi", "Paseo centrico con tiendas, restaurantes y ambiente de verano. Une la zona comercial con Market Square. Tiempo: 20-30 min.", GREEN)

    g.new_page("Senate Square + Cathedral", "El bloque visual principal del centro")
    g.image("cathedral", M, H - 155 * mm, W - 2 * M, 98 * mm, 5)
    g.card(M, H - 216 * mm, 84 * mm, 43 * mm, "Senate Square", "Plaza neoclasica amplia y muy fotografiable. Buena pausa despues de Esplanadi antes de bajar hacia el mar.", BLUE)
    g.card(M + 94 * mm, H - 216 * mm, 80 * mm, 43 * mm, "Helsinki Cathedral", "Catedral blanca con cupulas verdes, uno de los simbolos de Helsinki. Tiempo conjunto recomendado: 30-45 min.", TEAL)

    g.new_page("Kauppatori + Puerto", "Mercado, mar y pausa para comer")
    g.image("market", M, H - 130 * mm, W - 2 * M, 74 * mm, 5)
    g.card(M, H - 193 * mm, 84 * mm, 45 * mm, "Que hacer", "Mercado tradicional junto al mar, productos locales, vistas del puerto y ambiente facil para almorzar sin complicarse.", GREEN)
    g.card(M + 94 * mm, H - 193 * mm, 80 * mm, 45 * mm, "Que probar", "Salmon, sopa de salmon, pescado, bolleria finlandesa y cafe. Mejor elegir puestos sencillos antes que restaurantes caros.", AMBER)

    g.new_page("Museo Recomendado - Ateneum", "Arte finlandes y europeo al lado de la estacion")
    g.image("ateneum", M, H - 132 * mm, 91 * mm, 72 * mm, 5)
    g.card(M + 101 * mm, H - 102 * mm, 73 * mm, 42 * mm, "Por que encaja", "Muy centrico, justo cerca de Helsinki Central Station. Ideal para una primera visita cultural a Finlandia.", BLUE)
    g.card(M + 101 * mm, H - 156 * mm, 73 * mm, 42 * mm, "22 agosto 2026", "Sabado: 10:00-17:00.\nEntrada adulto: 21 EUR online / 23 EUR taquilla.\nVenta de entradas hasta 30 min antes del cierre.", GREEN)
    g.card(M, H - 220 * mm, W - 2 * M, 42 * mm, "Alternativa - Amos Rex", "Si preferis arte contemporaneo y arquitectura moderna, Amos Rex es una alternativa muy buena cerca de Lasipalatsi. Mantenerlo como plan B si Ateneum no apetece.", TEAL)

    g.new_page("Oodi - Helsinki Central Library", "Arquitectura, descanso y vistas")
    g.image("oodi_ext", M, H - 118 * mm, 82 * mm, 63 * mm, 5)
    g.image("oodi_int", M + 92 * mm, H - 118 * mm, 82 * mm, 63 * mm, 5)
    g.card(M, H - 177 * mm, 82 * mm, 45 * mm, "No es una biblioteca tradicional", "Arquitectura espectacular, diseno finlandes, espacios interiores muy interesantes y buen lugar para descansar.", TEAL)
    g.card(M + 92 * mm, H - 177 * mm, 82 * mm, 45 * mm, "Precio y tiempo", "Entrada gratis. Sabado-domingo: 10:00-20:00. Tiempo recomendado: 30-60 min. Terraza y vistas si el clima acompana.", GREEN)

    g.new_page("Paseo Final + Opcion Rock Church", "Toolonlahti, Finlandia Hall y Temppeliaukio")
    g.image("temppeliaukio", M, H - 128 * mm, 82 * mm, 70 * mm, 5)
    g.card(M + 92 * mm, H - 104 * mm, 82 * mm, 46 * mm, "Toolonlahti", "Desde Oodi, caminar hacia Finlandia Hall y la bahia. Zona tranquila, arquitectura moderna y paseo agradable despues del centro historico. Tiempo: 30-45 min.", BLUE)
    g.card(M + 92 * mm, H - 166 * mm, 82 * mm, 46 * mm, "Temppeliaukio Church", "Iglesia excavada en roca, a unos 20-25 min andando desde Oodi. Entrada indicada: 8 EUR adulto. Horarios de visita se actualizan semanalmente.", AMBER)
    g.card(M, H - 225 * mm, W - 2 * M, 38 * mm, "Decision rapida", "Si el dia va fluido: Oodi -> Toolonlahti -> cena/regreso. Si quereis una arquitectura memorable y aun hay energia: anadir Temppeliaukio antes del paseo final.", TEAL)

    g.new_page("Itinerario Horario", "Orientativo, adaptable a clima y energia")
    rows = [
        ("Hora", "Plan"),
        ("09:00", "Salida desde Aviapolis"),
        ("09:30-10:00", "Llegada Helsinki Central"),
        ("10:00", "Esplanadi"),
        ("10:30", "Senate Square"),
        ("11:00", "Helsinki Cathedral"),
        ("11:30", "Market Square"),
        ("12:00-13:30", "Puerto + comida"),
        ("14:00", "Ateneum"),
        ("15:30-16:00", "Oodi"),
        ("17:00", "Toolonlahti"),
        ("18:00+", "Cena / paseo / regreso"),
    ]
    draw_table(g, M, H - 57 * mm, [38 * mm, 132 * mm], rows, row_h=10 * mm)
    g.card(M, H - 205 * mm, W - 2 * M, 35 * mm, "Nota", "Los horarios son orientativos y pueden adaptarse segun cansancio, clima o ritmo de viaje. Ateneum cierra a las 17:00: no lo dejes para el final.", AMBER)

    g.new_page("Transporte - Resumen", "Coste estimado por persona")
    rows = [
        ("Trayecto", "Transporte", "Tiempo", "Precio"),
        ("Airport -> Aviapolis", "Train I", "2-5 min", "3,30 EUR"),
        ("Aviapolis -> Helsinki", "Train I/P", "~30 min", "incluido ABC"),
        ("Transporte Helsinki", "metro/tranvia/bus", "variable", "incluido"),
        ("Dia completo", "HSL ABC 24 h", "24 h", "12,80 EUR"),
    ]
    draw_table(g, M, H - 62 * mm, [52 * mm, 48 * mm, 32 * mm, 38 * mm], rows, row_h=12 * mm)
    g.card(M, H - 154 * mm, 84 * mm, 52 * mm, "Coste total", "Dia llegada: ~3,30 EUR\nDia Helsinki: ~12,80 EUR\nTotal: ~16,10 EUR por persona", GREEN)
    g.card(M + 94 * mm, H - 154 * mm, 80 * mm, 52 * mm, "Aplicaciones", "HSL: billetes, rutas, trenes y horarios.\nGoogle Maps: caminar, localizar sitios, restaurantes y orientacion general.", BLUE)
    g.qr(M + 20 * mm, H - 204 * mm, "https://www.hsl.fi/en", "HSL")
    g.qr(M + 62 * mm, H - 204 * mm, "https://www.google.com/maps", "Google Maps")

    g.new_page("Consejos Rapidos", "Practico para el dia de viaje")
    tips = [
        "Comprar billetes antes de subir.",
        "No hace falta alquilar coche.",
        "Helsinki centro se recorre perfectamente andando.",
        "Llevar tarjeta: Finlandia funciona casi totalmente con pagos electronicos.",
        "Llevar chaqueta ligera aunque sea agosto.",
        "Revisar la prevision meteorologica esa manana.",
        "Llevar bateria externa.",
        "Descargar HSL.",
        "Guardar el hotel en Google Maps.",
        "Controlar horarios del museo antes de entrar.",
    ]
    x, y = M, H - 55 * mm
    for i, tip in enumerate(tips):
        col = i % 2
        row = i // 2
        xx = x + col * 89 * mm
        yy = y - row * 28 * mm
        g.card(xx, yy - 19 * mm, 82 * mm, 21 * mm, f"{i+1:02d}", tip, TEAL if i % 3 else BLUE)

    g.new_page("Presupuesto + Fuentes", "Estimacion por persona, sin hotel ni vuelos")
    g.card(M, H - 92 * mm, 82 * mm, 52 * mm, "Presupuesto", "Transporte: ~16 EUR\nMuseo: ~21-23 EUR\nComida: 20-40 EUR\n\nTotal orientativo del dia: ~55-80 EUR por persona.", GREEN)
    g.card(M + 92 * mm, H - 92 * mm, 82 * mm, 52 * mm, "Verificado", "Precios HSL oficiales 2026, horario y tarifas Ateneum, horario Oodi y datos de acceso aeropuerto/hotel comprobados el 19 agosto 2026.", BLUE)
    sources = [
        "HSL single ticket prices: hsl.fi/en/tickets-and-fares/single-tickets/single-ticket-prices-in-the-hsl-area",
        "HSL day tickets: hsl.fi/en/tickets-and-fares/day-tickets/prices-of-day-tickets-in-the-hsl-area",
        "HSL airport train: hsl.fi/en/travelling/visitors/airport-train",
        "Ateneum visitor information: ateneum.fi/en/opening-hours-and-tickets/",
        "Oodi arrival/opening hours: oodihelsinki.fi/en/arrival/",
        "Temppeliaukio Church: temppeliaukiochurch.fi/en/index/nimi.html",
        "Clarion Hotel Aviapolis: strawberryhotels.com/clarion/helsinkiairport/",
        "Photos: Wikimedia Commons, credits listed on this page and image description pages.",
    ]
    yy = H - 130 * mm
    g.text(M, yy, "Fuentes principales", 12, INK, True, max_width=80)
    yy -= 8 * mm
    for s in sources:
        yy = g.text(M, yy, "- " + s, 7.4, MUTED, max_width=118, leading=9)
    yy -= 5 * mm
    g.text(M, yy, "Creditos fotograficos", 12, INK, True, max_width=80)
    yy -= 8 * mm
    for meta in ASSETS.values():
        yy = g.text(M, yy, "- " + meta["name"] + ": " + meta["credit"], 6.9, MUTED, max_width=130, leading=8)

    g.footer()
    g.c.save()


if __name__ == "__main__":
    build()
    print(OUT)
