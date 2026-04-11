#!/usr/bin/env python3
"""
Regenerate all favicon files from bomaye-logo.png.
Creates a 512x512 base image with:
  - Dark background (#0A0A08)
  - Circular gold border (#C9A84C, 8px stroke, 20px padding)
  - Logo centered and scaled to fill 80% of the canvas
"""

from PIL import Image, ImageDraw
import os

LOGO_PATH = "assets/images/bomaye-logo.png"
ICONS_DIR = "assets/icons"

BG_COLOR = (10, 10, 8, 255)        # #0A0A08
GOLD_COLOR = (201, 168, 76, 255)   # #C9A84C
CIRCLE_PADDING = 20                 # px from canvas edge
CIRCLE_STROKE = 8                   # px stroke width
LOGO_FILL = 0.80                    # logo fills 80% of canvas


def get_bounding_box(img):
    """Return tight bounding box of non-transparent content."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    width, height = img.size
    pixels = img.load()

    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            pr, pg, pb, pa = pixels[x, y]
            if pa > 10 and not (pr > 240 and pg > 240 and pb > 240):
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y

    if min_x > max_x or min_y > max_y:
        _, _, _, a = img.split()
        bbox = a.getbbox()
        return bbox

    return (min_x, min_y, max_x + 1, max_y + 1)


def make_base_image(cropped_logo, size):
    """
    Create a square canvas with dark background, gold circle border,
    and the logo centered at LOGO_FILL of the canvas size.
    """
    canvas = Image.new("RGBA", (size, size), BG_COLOR)
    draw = ImageDraw.Draw(canvas)

    # Draw circular gold border
    half_stroke = CIRCLE_STROKE // 2
    circle_box = [
        CIRCLE_PADDING + half_stroke,
        CIRCLE_PADDING + half_stroke,
        size - CIRCLE_PADDING - half_stroke,
        size - CIRCLE_PADDING - half_stroke,
    ]
    draw.ellipse(circle_box, outline=GOLD_COLOR, width=CIRCLE_STROKE)

    # Scale and center the logo
    logo_w, logo_h = cropped_logo.size
    target_dim = int(size * LOGO_FILL)
    ratio = target_dim / max(logo_w, logo_h)
    new_w = int(logo_w * ratio)
    new_h = int(logo_h * ratio)

    resized = cropped_logo.resize((new_w, new_h), Image.LANCZOS)

    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    return canvas


def save_icon(base_img, size, output_path):
    """Resize base image to target size and save."""
    if base_img.size != (size, size):
        img = base_img.resize((size, size), Image.LANCZOS)
    else:
        img = base_img

    ext = os.path.splitext(output_path)[1].lower()
    if ext == ".ico":
        img.save(output_path, format="ICO", sizes=[(size, size)])
    else:
        img.save(output_path, format="PNG", optimize=True)

    print(f"  Saved {output_path} ({size}x{size})")


def main():
    print(f"Loading {LOGO_PATH} ...")
    logo = Image.open(LOGO_PATH).convert("RGBA")
    print(f"  Original size: {logo.size}")

    print("Computing tight bounding box ...")
    bbox = get_bounding_box(logo)
    print(f"  Bounding box: {bbox}")

    cropped = logo.crop(bbox)
    print(f"  Cropped size: {cropped.size}")

    os.makedirs(ICONS_DIR, exist_ok=True)

    print("Generating 512x512 base image ...")
    base = make_base_image(cropped, 512)

    print("Generating favicon files ...")
    save_icon(base,  32, os.path.join(ICONS_DIR, "favicon.ico"))
    save_icon(base,  16, os.path.join(ICONS_DIR, "favicon-16x16.png"))
    save_icon(base,  32, os.path.join(ICONS_DIR, "favicon-32x32.png"))
    save_icon(base, 180, os.path.join(ICONS_DIR, "apple-touch-icon.png"))
    save_icon(base, 192, os.path.join(ICONS_DIR, "android-chrome-192x192.png"))
    save_icon(base, 512, os.path.join(ICONS_DIR, "android-chrome-512x512.png"))

    print("Done.")


if __name__ == "__main__":
    main()
