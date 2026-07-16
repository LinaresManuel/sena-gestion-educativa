"""Extract plain text from a SENA curriculum design PDF, page by page.

Usage:
    python scripts/extract-pdf-text.py "ruta/al/diseno.pdf"

Output:
    Text content with `--- PÁGINA N ---` markers between pages,
    written to stdout.
"""

import sys
import fitz


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python extract-pdf-text.py <ruta_al_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error al abrir el PDF: {e}", file=sys.stderr)
        sys.exit(1)

    for i, page in enumerate(doc):
        text = page.get_text().strip()
        print(f"\n--- PÁGINA {i + 1} ---")
        if text:
            print(text)

    doc.close()


if __name__ == "__main__":
    main()
