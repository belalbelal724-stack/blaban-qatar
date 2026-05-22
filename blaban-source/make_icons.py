"""Generate PWA icons for B Laban Qatar app."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = "/home/claude/deploy/blaban-pwa"

def make_icon(size, filename, with_text=True):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Maroon gradient background (radial)
    cx, cy = size // 2, size // 2
    max_r = int(size * 0.7)
    
    for r in range(max_r, 0, -1):
        ratio = r / max_r
        # Dark maroon to lighter maroon outward
        red = int(74 + (107 - 74) * (1 - ratio))   # 4A → 6B
        green = int(15 + (27 - 15) * (1 - ratio))  # 0F → 1B
        blue = int(26 + (42 - 26) * (1 - ratio))   # 1A → 2A
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(red, green, blue, 255))
    
    # Gold border
    border_w = max(4, size // 32)
    draw.ellipse([border_w, border_w, size-border_w, size-border_w], 
                 outline=(201, 168, 76, 255), width=border_w)
    # Inner gold ring
    inner_w = max(2, size // 64)
    inset = border_w * 3
    draw.ellipse([inset, inset, size-inset, size-inset], 
                 outline=(232, 201, 106, 200), width=inner_w)
    
    # Center text "ب لبن" (Arabic) in gold
    if with_text:
        try:
            font_size = int(size * 0.32)
            # Try to find an Arabic font
            font_paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            ]
            font = None
            for fp in font_paths:
                if os.path.exists(fp):
                    font = ImageFont.truetype(fp, font_size)
                    break
            if not font:
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        text = "BL"
        # Get text dimensions
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = (size - th) // 2 - bbox[1] - int(size * 0.04)
        
        # Shadow
        draw.text((tx+2, ty+2), text, font=font, fill=(0, 0, 0, 180))
        # Main text in gold
        draw.text((tx, ty), text, font=font, fill=(232, 201, 106, 255))
        
        # Subtitle "Qatar" small
        try:
            small_font_size = int(size * 0.10)
            small_font = ImageFont.truetype(font_paths[0], small_font_size) if font_paths and os.path.exists(font_paths[0]) else ImageFont.load_default()
            sub = "QATAR"
            sbbox = draw.textbbox((0, 0), sub, font=small_font)
            sw = sbbox[2] - sbbox[0]
            sh = sbbox[3] - sbbox[1]
            sx = (size - sw) // 2 - sbbox[0]
            sy = ty + th + int(size * 0.06)
            draw.text((sx, sy), sub, font=small_font, fill=(245, 237, 216, 200))
        except:
            pass
    
    img.save(os.path.join(OUT_DIR, filename), 'PNG', optimize=True)
    print(f"Created {filename} ({size}x{size})")

# Standard PWA icons
make_icon(192, 'icon-192.png')
make_icon(512, 'icon-512.png')
# Apple touch icon
make_icon(180, 'apple-touch-icon.png')
# Maskable variant (with safe zone padding)
def make_maskable(size, filename):
    # Maskable icon should have content in safe zone (80% of size)
    img = Image.new('RGBA', (size, size), (74, 15, 26, 255))  # Solid maroon bg
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    safe_r = int(size * 0.40)  # safe zone radius
    
    # Solid gold circle
    draw.ellipse([cx-safe_r, cy-safe_r, cx+safe_r, cy+safe_r], 
                 fill=(201, 168, 76, 255))
    # Inner maroon  
    inner_r = int(safe_r * 0.85)
    draw.ellipse([cx-inner_r, cy-inner_r, cx+inner_r, cy+inner_r], 
                 fill=(74, 15, 26, 255))
    
    # Text
    try:
        font_size = int(size * 0.20)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        text = "BL"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = (size - th) // 2 - bbox[1]
        draw.text((tx, ty), text, font=font, fill=(232, 201, 106, 255))
    except:
        pass
    
    img.save(os.path.join(OUT_DIR, filename), 'PNG', optimize=True)
    print(f"Created {filename} (maskable)")

make_maskable(512, 'icon-maskable-512.png')
print("\nAll icons generated successfully!")
