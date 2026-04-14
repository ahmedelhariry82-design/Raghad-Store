from PIL import Image, ImageChops
import os

def slice_image(image_path, output_dir):
    img = Image.open(image_path).convert('RGB')
    
    # We want to find contiguous bounding boxes that are not white.
    # To do this simply, we will find rows and cols that are all almost white.
    w, h = img.size
    pixels = img.load()
    
    white_thresh = 245
    
    row_is_white = []
    for y in range(h):
        is_white = True
        for x in range(w):
            r, g, b = pixels[x, y]
            if r < white_thresh or g < white_thresh or b < white_thresh:
                is_white = False
                break
        row_is_white.append(is_white)
        
    col_is_white = []
    for x in range(w):
        is_white = True
        for y in range(h):
            r, g, b = pixels[x, y]
            if r < white_thresh or g < white_thresh or b < white_thresh:
                is_white = False
                break
        col_is_white.append(is_white)
        
    # Get y bounds
    y_bounds = []
    in_box = False
    start_y = 0
    for y in range(h):
        if not row_is_white[y] and not in_box:
            in_box = True
            start_y = y
        elif row_is_white[y] and in_box:
            in_box = False
            y_bounds.append((start_y, y))
    if in_box:
        y_bounds.append((start_y, h))
        
    # Get x bounds
    x_bounds = []
    in_box = False
    start_x = 0
    for x in range(w):
        if not col_is_white[x] and not in_box:
            in_box = True
            start_x = x
        elif col_is_white[x] and in_box:
            in_box = False
            x_bounds.append((start_x, x))
    if in_box:
        x_bounds.append((start_x, w))

    # Usually ChatGPT outputs a grid with some whitespace.
    # We will slice based on x and y bounds.
    # However, sometimes x bounds might vary per row. 
    # Let's do a more robust approach: for each y-band, find x-bounds!
    
    count = 1
    for y1, y2 in y_bounds:
        band_col_is_white = []
        for x in range(w):
            is_white = True
            for y in range(y1, y2):
                r, g, b = pixels[x, y]
                if r < white_thresh or g < white_thresh or b < white_thresh:
                    is_white = False
                    break
            band_col_is_white.append(is_white)
            
        band_x_bounds = []
        in_box = False
        start_x = 0
        for x in range(w):
            if not band_col_is_white[x] and not in_box:
                in_box = True
                start_x = x
            elif band_col_is_white[x] and in_box:
                in_box = False
                band_x_bounds.append((start_x, x))
        if in_box:
            band_x_bounds.append((start_x, w))
            
        for x1, x2 in band_x_bounds:
            # Ignore tiny slices
            if x2 - x1 < 50 or y2 - y1 < 50: continue
            crop_img = img.crop((x1, y1, x2, y2))
            crop_img.save(os.path.join(output_dir, f"{count}.png"))
            count += 1
            print(f"Saved {count-1}.png")

if __name__ == '__main__':
    slice_image(r"C:\Antig\RAGHAD Store\1.png", r"C:\Antig\RAGHAD Store\website\assets")
