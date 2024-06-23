import json
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

from dotenv import load_dotenv
load_dotenv()

MARGIN = int(os.getenv("MARGIN"))
INDENT = int(os.getenv("INDENT"))
MARGIN_SECTION = int(os.getenv("MARGIN_SECTION"))
SECTION_ICON_SIZE = int(os.getenv("SECTION_ICON_SIZE"))
DOCUMENTS_NAME = json.loads(os.getenv("DOCUMENTS_NAME"))
SECTIONS_NAME = json.loads(os.getenv("SECTIONS_NAME"))
SECTIONS_IMAGES = json.loads(os.getenv("SECTIONS_IMAGES"))

class PDFBuilder:
    def __init__(self, filename, language):
        self.canvas = canvas.Canvas(os.getenv("OUTPUT_PATH")+filename, pagesize=letter)
        self.width, self.height = letter
        self.y = self.height - MARGIN
        self.language = language

    def set_font(self, font_name, font_size):
        self.font = font_name
        self.font_size = font_size
        self.canvas.setFont(self.font, self.font_size)

    def add_section(self, section_name):
        self.y -= MARGIN_SECTION
        self.canvas.setFillColorRGB(0.37, 0.49, 0.54)
        self.canvas.rect(MARGIN - 15, self.y - 5, self.width - 2 * MARGIN, self.font_size + 7, stroke=0, fill=1)
        self.canvas.setStrokeColorRGB(1, 1, 1)
        self.canvas.circle(MARGIN * 3, self.y + 4, self.font_size + 3, stroke=1, fill=1)
        self.canvas.setFillColorRGB(1, 1, 1)
        self.canvas.circle(MARGIN * 3, self.y + 4, self.font_size + 1, stroke=1, fill=1)
        print(SECTIONS_IMAGES)
        print(SECTIONS_IMAGES[section_name])
        logo = ImageReader(SECTIONS_IMAGES[section_name])

        self.canvas.drawImage(logo, MARGIN * 3 - SECTION_ICON_SIZE / 2, self.y + 4 - SECTION_ICON_SIZE / 2,
                                mask="auto", width=SECTION_ICON_SIZE, height=SECTION_ICON_SIZE)

        self.canvas.setFillColorRGB(1, 1, 1)
        self.set_font("Times-Bold", 14)
        self.draw_text(SECTIONS_NAME[self.language][section_name], indent=12)

        self.y -= MARGIN_SECTION / 4
        self.canvas.setFillColorRGB(0, 0, 0)

    def draw_text(self, text, alignment="left", indent=0):
        text = text.strip()
        x = MARGIN + INDENT * indent
        total_text_width = stringWidth(text, self.font, self.font_size)
        max_text_width = self.width - x - MARGIN
        next_text = False
        if total_text_width > max_text_width:
            words = text.split(" ")
            writable_text = ""
            for i, word in enumerate(words):
                writable_text += f"{word} "
                if stringWidth(writable_text, self.font, self.font_size) < max_text_width:
                    text = writable_text
                else:
                    next_text = " ".join(words[i:])
                    break
        if alignment == "center":
            x = (self.width - total_text_width) / 2
        if alignment == "right":
            x = self.width - total_text_width - MARGIN * 2 - INDENT * indent
        self.canvas.drawString(x, self.y, text)
        self.y -= self.font_size
        if next_text:
            self.draw_text(next_text, indent=indent)

    def save(self):
        self.canvas.save()

    def pdf_resume(user_data, resume_data, programming_language_data, experience_data, company_data): 
        for language in ["en"]:
            cv_filename = DOCUMENTS_NAME[language]
            cv = PDFBuilder(cv_filename, language)

            # Name
            cv.set_font("Times-Bold", 17)
            cv.canvas.setFillColorRGB(0.37, 0.49, 0.54)
            cv.canvas.rect(0, cv.y - 8, cv.width, cv.font_size + 8, stroke=0, fill=1)
            cv.canvas.setFillColorRGB(1, 1, 1)
            cv.draw_text(f"{user_data.first_name} {user_data.last_name}", "center")
            cv.canvas.setFillColorRGB(0, 0, 0)
            cv.y -= 10

            # Title
            cv.set_font("Times-Bold", 17)
            cv.draw_text(resume_data.title, "center")

            # Contact information
            cv.set_font("Times-Roman", 10)
            cv.draw_text("Contact information", "center")
            cv.draw_text(user_data.email, "center")

            cv.y -= 20

            # Summary
            cv.add_section("summary")
            cv.set_font("Times-Roman", 10)
            cv.draw_text(resume_data.text)

            # Skills
            cv.add_section("skills")
            cv.set_font("Times-Roman", 10)

            for programm_lang, exp in zip(programming_language_data, experience_data):
                cv.draw_text(f"{programm_lang} ({exp['level']})")

            # Experience
            cv.add_section("experiences")
            cv.set_font("Times-Roman", 10)
            # cv.draw_text(f"Experiences:{resume_data.experience}")

            for programm_lang, exp, comp in zip(programming_language_data, experience_data, company_data):
                if(exp['start_date'] == None):
                    cv.draw_text(f"No experience in {programm_lang}")
                else:
                    start_date_str = exp['start_date'].strftime("%d.%m.%Y")
                    end_date_str = exp['end_date'].strftime("%d.%m.%Y")
                    cv.draw_text(f"{exp['experience']} years in {programm_lang} (from {start_date_str} to {end_date_str} in {comp})")

            # Save the PDF
            cv.save()