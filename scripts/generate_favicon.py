from PIL import Image, ImageDraw
import os

def create_coffee_icon(size):
    # Create image with transparent background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 64.0
    corner_radius = int(16 * scale)

    # Draw rounded rectangle (squircle) background with gradient simulation
    # Gradient from amber-500 (#F59E0B = 245, 158, 11) to amber-700 (#B45309 = 180, 83, 9)
    for y in range(size):
        factor = y / max(size - 1, 1)
        r = int(245 - factor * (245 - 180))
        g = int(158 - factor * (158 - 83))
        b = int(11 - factor * (11 - 9))
        
        # Mask with rounded rect
        line_mask = Image.new("L", (size, 1), 0)
        draw_line = ImageDraw.Draw(line_mask)
        draw_line.rounded_rectangle([0, -y, size, size - y], radius=corner_radius, fill=255)
        
        row_img = Image.new("RGBA", (size, 1), (r, g, b, 255))
        img.paste(row_img, (0, y), line_mask)

    draw = ImageDraw.Draw(img)
    ink = (24, 24, 27, 255) # Zinc-900 / dark color

    # Draw Saucer Plate
    plate_y = int(54 * scale)
    draw.line([int(13 * scale), plate_y, int(51 * scale), plate_y], fill=ink, width=max(int(3 * scale), 1))

    # Draw Coffee Cup
    cup_x0 = int(16 * scale)
    cup_y0 = int(24 * scale)
    cup_x1 = int(46 * scale)
    cup_y1 = int(50 * scale)
    cup_radius = int(10 * scale)

    draw.rounded_rectangle([cup_x0, cup_y0, cup_x1, cup_y1], radius=cup_radius, fill=ink)
    # Fill upper corners to make top flat
    draw.rectangle([cup_x0, cup_y0, cup_x1, cup_y0 + cup_radius], fill=ink)

    # Cup Handle
    handle_x0 = int(43 * scale)
    handle_y0 = int(28 * scale)
    handle_x1 = int(55 * scale)
    handle_y1 = int(42 * scale)
    draw.arc([handle_x0, handle_y0, handle_x1, handle_y1], start=270, end=90, fill=ink, width=max(int(3 * scale), 1))

    # Steam
    steam_w = max(int(2.5 * scale), 1)
    for sx in [24, 32, 40]:
        sy0 = int(16 * scale)
        sy1 = int(9 * scale)
        mx = int(sx * scale)
        draw.line([mx, sy0, mx + int(2 * scale), sy1], fill=ink, width=steam_w)

    return img

def main():
    sizes = [16, 32, 48, 64, 128, 256]
    images = [create_coffee_icon(s) for s in sizes]

    # Save to app/favicon.ico and public/favicon.ico
    app_ico_path = os.path.join("app", "favicon.ico")
    public_ico_path = os.path.join("public", "favicon.ico")
    
    images[0].save(app_ico_path, format="ICO", sizes=[(s, s) for s in [16, 32, 48]], append_images=images[1:3])
    images[0].save(public_ico_path, format="ICO", sizes=[(s, s) for s in [16, 32, 48]], append_images=images[1:3])

    # Save PNGs
    img_apple = create_coffee_icon(180)
    img_apple.save(os.path.join("app", "apple-icon.png"), format="PNG")
    img_apple.save(os.path.join("public", "apple-icon.png"), format="PNG")
    
    img_icon = create_coffee_icon(64)
    img_icon.save(os.path.join("public", "icon.png"), format="PNG")

    print("Favicons and app icons successfully generated!")

if __name__ == "__main__":
    main()
