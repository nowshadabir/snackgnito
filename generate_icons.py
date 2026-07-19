from PIL import Image, ImageDraw
import os

os.makedirs('public/icons', exist_ok=True)

for size in [16, 48, 128]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 4,
        fill='#6366f1'
    )
    # Add a letter
    font_size = size // 2
    draw.text((size // 2, size // 2), 'S', fill='white', anchor='mm', font_size=font_size)
    img.save(f'public/icons/icon-{size}.png')
    print(f'Created public/icons/icon-{size}.png ({size}x{size})')
