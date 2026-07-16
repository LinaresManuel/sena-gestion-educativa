#!/usr/bin/env python3
"""
Pipeline completo: PDF de diseño curricular SENA → texto plano → LLM (Hy3) → JSON estructurado.

Usage:
    python scripts/extract-curriculo.py "../extraccion/diseno-curricular/Diseño ADSO.pdf"
    python scripts/extract-curriculo.py "../extraccion/diseno-curricular/Diseño ADSO.pdf" > output.json

Requires:
    pip install pymupdf requests
"""

import sys
import os
import json
import re
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYSTEM_PROMPT_PATH = os.path.join(SCRIPT_DIR, "guia_extraccion_diseno_curricular.md")
API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not API_KEY:
    print("Error: variable de entorno OPENROUTER_API_KEY no definida.", file=sys.stderr)
    print("Configúrala con: $env:OPENROUTER_API_KEY='sk-or-v1-...'", file=sys.stderr)
    sys.exit(1)
MODEL = "tencent/hy3:free"


# ── Fase 1: Extracción de texto del PDF ──────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    import fitz
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        header = f"--- PÁGINA {i + 1} ---"
        pages.append(f"{header}\n{text}" if text else header)
    doc.close()
    return "\n\n".join(pages)


# ── Fase 2: Carga del system prompt ──────────────────────────────

def load_system_prompt() -> str:
    with open(SYSTEM_PROMPT_PATH, encoding="utf-8") as f:
        return f.read().strip()


# ── Fase 3: Llamada a OpenRouter ─────────────────────────────────

def call_llm(system_prompt: str, text: str) -> dict:
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extrae la información estructurada del siguiente diseño curricular:\n\n{text}"},
            ],
            "reasoning": {"enabled": True},
        },
        timeout=300,
    )
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return content


# ── Fase 4: Parseo del JSON desde la respuesta ───────────────────

def extract_json_from_response(content: str) -> dict:
    # Intenta extraer bloque ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", content, re.DOTALL)
    if match:
        raw = match.group(1)
    else:
        # Fallback: buscar el primer { hasta el último }
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            raw = content[start:end + 1]
        else:
            raise ValueError("No se encontró JSON en la respuesta del modelo.")
    return json.loads(raw)


def validate_structure(data: dict) -> None:
    errors = []
    if "programa" not in data:
        errors.append("Falta la clave 'programa'")
    if "competencias" not in data:
        errors.append("Falta la clave 'competencias'")
    if errors:
        raise ValueError(" | ".join(errors))


# ── Main ──────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python scripts/extract-curriculo.py <ruta_al_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not os.path.isfile(pdf_path):
        print(f"Error: archivo no encontrado: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    print("📄 Extrayendo texto del PDF...", file=sys.stderr)
    text = extract_text_from_pdf(pdf_path)
    print(f"   → {len(text)} caracteres extraídos", file=sys.stderr)

    print("📖 Cargando guía de extracción (system prompt)...", file=sys.stderr)
    system_prompt = load_system_prompt()

    print(f"🤖 Enviando a OpenRouter ({MODEL})...", file=sys.stderr)
    try:
        raw_response = call_llm(system_prompt, text)
    except requests.exceptions.RequestException as e:
        print(f"Error en la llamada a OpenRouter: {e}", file=sys.stderr)
        sys.exit(1)

    print("🔍 Extrayendo JSON de la respuesta...", file=sys.stderr)
    try:
        result = extract_json_from_response(raw_response)
        validate_structure(result)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error al parsear la respuesta del modelo: {e}", file=sys.stderr)
        print("--- Respuesta cruda ---", file=sys.stderr)
        print(raw_response[:2000], file=sys.stderr)
        sys.exit(1)

    print("✅ JSON válido extraído correctamente.", file=sys.stderr)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
