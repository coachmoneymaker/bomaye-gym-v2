#!/usr/bin/env python3
"""
Regenerate all favicon files from bomaye-logo.png.
Crops transparent/whitespace padding so the logo fills ~90% of the icon space.
"""

from PIL import Image
import os

LOGO_PATH = "assets/images/bomaye-logo.png"
ICONS_DIR = "assets/icons"

FILL_RATIO = 0.90  # logo fills 90% of icon space


def get_bounding_box(img):
    """Return tight bounding box of non-transparent, non-white content."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    r, g, b, a = img.split()

    # Treat pixel as "content" if it is visible (alpha > 10)
    # and not near-white (at least one channel below 240).
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
        # Fallback: use getbbox on alpha channel alone
        bbox = a.getbbox()
        return bbox

    return (min_x, min_y, max_x + 1, max_y + 1)


def make_icon(cropped_logo, size, output_path):
    """
    Place cropped_logo onto a transparent canvas of the given square size,
    scaled so it fills FILL_RATIO of the canvas, centred.
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    logo_w, logo_h = cropped_logo.size
    target_dim = int(size * FILL_RATIO)

    # Scale proportionally so the longer dimension equals target_dim
    ratio = target_dim / max(logo_w, logo_h)
    new_w = int(logo_w * ratio)
    new_h = int(logo_h * ratio)

    resized = cropped_logo.resize((new_w, new_h), Image.LANCZOS)

    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    ext = os.path.splitext(output_path)[1].lower()
    if ext == ".ico":
        canvas.save(output_path, format="ICO", sizes=[(size, size)])
    else:
        canvas.save(output_path, format="PNG", optimize=True)

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

    print("Generating favicon files ...")
    make_icon(cropped, 32,  os.path.join(ICONS_DIR, "favicon.ico"))
    make_icon(cropped, 16,  os.path.join(ICONS_DIR, "favicon-16x16.png"))
    make_icon(cropped, 32,  os.path.join(ICONS_DIR, "favicon-32x32.png"))
    make_icon(cropped, 180, os.path.join(ICONS_DIR, "apple-touch-icon.png"))
    make_icon(cropped, 192, os.path.join(ICONS_DIR, "android-chrome-192x192.png"))
    make_icon(cropped, 512, os.path.join(ICONS_DIR, "android-chrome-512x512.png"))

    print("Done.")


if __name__ == "__main__":
    main()
