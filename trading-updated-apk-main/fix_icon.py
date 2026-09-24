from PIL import Image

def fix_image(path):
    img = Image.open(path)
    img = img.convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # replace pure white or near-white with black
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((0, 0, 0, 255))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(path)
    print(f"Fixed {path}")

fix_image('src/assets/icon.png')
fix_image('src/assets/splash-icon.png')
fix_image('src/assets/adaptive-icon.png')
