#!/usr/bin/env python3
"""
Procesa en lote las imágenes extraídas de LogINV:
- Detecta formato real con Pillow (jpeg, png, webp, avif, gif)
- Corrige orientación EXIF
- Convierte formatos no compatibles con ExcelJS (webp, avif, etc.) a JPEG
- Guarda imagen completa en exports/imagenes/
- Genera miniatura compacta (max 140x140) en directorio temporal para incrustar en .xlsx
Recibe por stdin un JSON array de { doc_id, output_base_path, thumb_base_path, input_base64 | input_path }
y escribe por stdout un JSON array con los resultados.
"""

import base64
import io
import json
import os
import sys
from PIL import Image, ImageOps

# Registrar soporte AVIF si está disponible en Pillow 13 / pillow-heif
try:
    import pillow_heif  # type: ignore
    pillow_heif.register_heif_opener()
except Exception:
    pass


def process_one(item):
    doc_id = item["doc_id"]
    out_dir = item["out_dir"]
    thumb_dir = item["thumb_dir"]
    base_name = item["base_name"]

    raw_bytes = None
    if item.get("input_path") and os.path.exists(item["input_path"]):
        with open(item["input_path"], "rb") as f:
            raw_bytes = f.read()
    elif item.get("input_base64"):
        raw_bytes = base64.b64decode(item["input_base64"])

    if not raw_bytes:
        return {"doc_id": doc_id, "ok": False, "error": "empty_bytes"}

    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            orig_format = (img.format or "UNKNOWN").lower()
            img = ImageOps.exif_transpose(img)
            width, height = img.size

            has_alpha = img.mode in ("RGBA", "LA") or (
                img.mode == "P" and "transparency" in img.info
            )

            # Guardar archivo final limpio: PNG si tiene transparencia y era PNG,
            # caso contrario JPEG universal (compatible con Excel, Sheets, Airtable).
            if orig_format == "png" and has_alpha:
                final_ext = "png"
                excel_ext = "png"
                final_img = img.convert("RGBA")
            else:
                final_ext = "jpg"
                excel_ext = "jpeg"
                if has_alpha:
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    rgba = img.convert("RGBA")
                    bg.paste(rgba, mask=rgba.split()[3])
                    final_img = bg
                elif img.mode != "RGB":
                    final_img = img.convert("RGB")
                else:
                    final_img = img

            out_filename = f"{base_name}.{final_ext}"
            out_path = os.path.join(out_dir, out_filename)
            if final_ext == "png":
                final_img.save(out_path, format="PNG", optimize=True)
            else:
                final_img.save(out_path, format="JPEG", quality=90, optimize=True)

            # Miniatura para incrustar en Excel sin inflar el peso del .xlsx
            thumb_img = final_img.copy()
            thumb_img.thumbnail((140, 140), Image.Resampling.LANCZOS)
            thumb_filename = f"{base_name}_thumb.{final_ext}"
            thumb_path = os.path.join(thumb_dir, thumb_filename)
            if final_ext == "png":
                thumb_img.save(thumb_path, format="PNG", optimize=True)
            else:
                thumb_img.save(thumb_path, format="JPEG", quality=82, optimize=True)

            size_bytes = os.path.getsize(out_path)
            return {
                "doc_id": doc_id,
                "ok": True,
                "orig_format": orig_format,
                "final_ext": final_ext,
                "excel_ext": excel_ext,
                "filename": out_filename,
                "thumb_path": thumb_path,
                "width": width,
                "height": height,
                "size_bytes": size_bytes,
            }
    except Exception as exc:
        return {"doc_id": doc_id, "ok": False, "error": str(exc)}


def main():
    payload = json.load(sys.stdin)
    results = [process_one(item) for item in payload]
    json.dump(results, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
