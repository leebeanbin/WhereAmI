import os
from PIL import Image

def fix_bus_stop():
    filepath = 'public/icons/bus_stop.png'
    print(f"🔧 Opening {filepath}...")
    img = Image.open(filepath).convert('RGBA')
    pixels = list(img.getdata())
    new_pixels = []
    stripped_count = 0
    
    for p in pixels:
        r, g, b, a = p
        # Check if it is a grey checkerboard background pixel
        # - channels are close to each other (greyish)
        # - not extremely dark (preserving black/dark outlines of the bus stop)
        if a > 0 and abs(r - g) <= 8 and abs(r - b) <= 8 and abs(g - b) <= 8 and 50 <= r <= 245:
            new_pixels.append((0, 0, 0, 0))
            stripped_count += 1
        else:
            new_pixels.append(p)
            
    img.putdata(new_pixels)
    img.save(filepath, 'PNG')
    print(f"✅ Successfully fixed bus stop icon! Stripped {stripped_count} checkerboard pixels.")

if __name__ == '__main__':
    fix_bus_stop()
