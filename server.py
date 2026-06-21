"""Small local server for the ProTrack MVP and real PDF/DOCX exports."""

from __future__ import annotations

import io
import json
import mimetypes
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.shared import Inches, Pt, RGBColor
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
LOGO = ROOT / "assets" / "protrack-official.png"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PROTRACK_PORT", "4173"))


def clean_payload(handler: SimpleHTTPRequestHandler) -> dict:
    length = min(int(handler.headers.get("Content-Length", "0")), 4_000_000)
    raw = handler.rfile.read(length)
    data = json.loads(raw.decode("utf-8"))
    return {
        "title": str(data.get("title") or "ProTrack AI Analyst Report")[:180],
        "player": str(data.get("player") or "Player")[:100],
        "session": str(data.get("session") or "")[:30],
        "content": str(data.get("content") or "")[:500_000],
    }


def content_lines(content: str):
    for raw in content.replace("\r", "").split("\n"):
        line = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", raw).strip()
        if line:
            yield line


def is_heading(line: str) -> bool:
    known = {
        "Dashboard Database Output", "QA Validation Summary", "Rubric Engine Report",
        "Performance KPI Dashboard", "Padel-Specific Analysis", "Decision Making Analysis",
        "Error Analysis", "Match KPI Dashboard", "PDI Dashboard", "PTI Dashboard",
        "Assessment Dashboard", "Player Journey", "Progress Dashboard", "Results Generator",
        "Training Priority Matrix", "Development Plan", "Final Coach Report",
        "PROTRACK FINAL ASSESSMENT",
    }
    return line in known or bool(re.match(r"^\d{2}$", line))


class LogoCrop(Flowable):
    """Display the untouched official image through a clipped logo window."""

    def __init__(self, width=170 * mm, height=65 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        self.canv.saveState()
        clip = self.canv.beginPath()
        clip.rect(0, 0, self.width, self.height)
        self.canv.clipPath(clip, stroke=0, fill=0)
        full_height = self.width * (1670 / 942)
        crop_top = self.width * (680 / 942)
        draw_y = self.height + crop_top - full_height
        self.canv.drawImage(str(LOGO), 0, draw_y, width=self.width, height=full_height, preserveAspectRatio=True, mask="auto")
        self.canv.restoreState()


def build_docx(data: dict) -> bytes:
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(.65)
    section.bottom_margin = Inches(.65)
    section.left_margin = Inches(.72)
    section.right_margin = Inches(.72)

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(9.5)
    normal.font.color.rgb = RGBColor(45, 55, 70)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if LOGO.exists():
        shape = title.add_run().add_picture(str(LOGO), width=Inches(6.4))
        shape.height = Inches(2.55)
        src_rect = OxmlElement("a:srcRect")
        src_rect.set("t", "40500")
        src_rect.set("b", "36500")
        shape._inline.graphic.graphicData.pic.blipFill.insert(1, src_rect)
    else:
        run = title.add_run("PROTRACK")
        run.bold = True
        run.font.size = Pt(24)
        run.font.color.rgb = RGBColor(15, 105, 235)
    subtitle = doc.add_paragraph("AI ANALYST · V2.0 FINAL MASTER CLEAN")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.runs[0].font.size = Pt(8)
    subtitle.runs[0].font.color.rgb = RGBColor(105, 118, 136)
    heading = doc.add_heading(data["title"], level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph("Your Game. Elevated.").alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_page_break()

    pending_number = None
    for line in content_lines(data["content"]):
        if re.fullmatch(r"\d{2}", line):
            pending_number = line
            continue
        if is_heading(line):
            text = f"{pending_number}. {line}" if pending_number else line
            pending_number = None
            doc.add_heading(text, level=1)
        elif line.startswith("{") or line.startswith('"') or line in ("}", "},"):
            p = doc.add_paragraph(line)
            p.style = doc.styles["No Spacing"]
            p.runs[0].font.name = "Consolas"
            p.runs[0].font.size = Pt(7.5)
            p.runs[0].font.color.rgb = RGBColor(35, 82, 130)
        elif len(line) < 70 and (line.endswith(":") or " · " in line):
            p = doc.add_paragraph()
            r = p.add_run(line)
            r.bold = True
            r.font.color.rgb = RGBColor(25, 71, 125)
        else:
            doc.add_paragraph(line)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("PROTRACK · Your Game. Elevated. · v2.0 LOCKED").font.size = Pt(7)
    output = io.BytesIO()
    doc.save(output)
    return output.getvalue()


def build_pdf(data: dict) -> bytes:
    output = io.BytesIO()
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("PTTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=colors.HexColor("#0F69EB"), alignment=TA_CENTER, spaceAfter=10)
    sub_style = ParagraphStyle("PTSub", parent=styles["Normal"], fontSize=8, leading=12, textColor=colors.HexColor("#64748B"), alignment=TA_CENTER, spaceAfter=12)
    h_style = ParagraphStyle("PTH", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=colors.HexColor("#0B376C"), spaceBefore=12, spaceAfter=7, keepWithNext=True)
    body_style = ParagraphStyle("PTBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.5, textColor=colors.HexColor("#263244"), spaceAfter=4)
    code_style = ParagraphStyle("PTCode", parent=body_style, fontName="Courier", fontSize=6.8, leading=9, leftIndent=4*mm, textColor=colors.HexColor("#285A91"))

    doc = SimpleDocTemplate(output, pagesize=A4, rightMargin=16*mm, leftMargin=16*mm, topMargin=16*mm, bottomMargin=17*mm,
                            title=data["title"], author="ProTrack AI Analyst v2.0")
    story = []
    if LOGO.exists():
        story.extend([LogoCrop(), Spacer(1, 7 * mm)])
    else:
        story.append(Paragraph("PROTRACK", title_style))
    story.extend([Paragraph("AI ANALYST · V2.0 FINAL MASTER CLEAN", sub_style), Spacer(1, 5*mm), Paragraph(data["title"], title_style), Paragraph("Your Game. Elevated.", sub_style), PageBreak()])
    pending_number = None
    for line in content_lines(data["content"]):
        safe = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        if re.fullmatch(r"\d{2}", line):
            pending_number = line
            continue
        if is_heading(line):
            text = f"{pending_number}. {safe}" if pending_number else safe
            pending_number = None
            story.append(Paragraph(text, h_style))
        elif line.startswith("{") or line.startswith('"') or line in ("}", "},"):
            story.append(Paragraph(safe, code_style))
        else:
            story.append(Paragraph(safe, body_style))

    def page(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#D5DCE6"))
        canvas.line(16*mm, 13*mm, 194*mm, 13*mm)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor("#718096"))
        canvas.drawString(16*mm, 8.5*mm, "PROTRACK · Your Game. Elevated. · v2.0 LOCKED")
        canvas.drawRightString(194*mm, 8.5*mm, f"Page {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=page, onLaterPages=page)
    return output.getvalue()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print(f"[ProTrack] {self.address_string()} {fmt % args}")

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ("/api/export/pdf", "/api/export/docx"):
            self.send_error(404)
            return
        try:
            data = clean_payload(self)
            if path.endswith("pdf"):
                payload, mime, extension = build_pdf(data), "application/pdf", "pdf"
            else:
                payload, mime, extension = build_docx(data), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"
            filename = re.sub(r"[^A-Za-z0-9_-]+", "_", f"ProTrack_{data['player']}_Session_{data['session']}").strip("_")
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Disposition", f'attachment; filename="{filename}.{extension}"')
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as exc:
            self.send_error(400, explain=str(exc))


if __name__ == "__main__":
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("application/manifest+json", ".webmanifest")
    mimetypes.add_type("application/manifest+json", ".json")
    mimetypes.add_type("image/svg+xml", ".svg")
    print(f"ProTrack AI Analyst is running at http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
