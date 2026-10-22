from PIL import Image, ImageFilter
import numpy as np
from collections import deque
import os

img_path = r'C:\Users\DELL G15\.gemini\antigravity-ide\brain\3a3bf776-3fc0-4edc-87f2-46eff863b412\.user_uploaded\media_1792591689938.png'
im = Image.open(img_path).convert('RGBA')
arr = np.array(im)

pad = 12
y1 = max(0, 194 - pad)
y2 = min(630, 624 + pad)
x1 = max(0, 346 - pad)
x2 = min(690, 679 + pad)

crop = arr[y1:y2, x1:x2].copy()
h, w, _ = crop.shape

# BFS flood fill from edges to identify pure background
visited = np.zeros((h, w), dtype=bool)
bg_mask = np.zeros((h, w), dtype=bool)
q = deque()

for x in range(w):
    q.append((0, x))
    q.append((h - 1, x))
for y in range(h):
    q.append((y, 0))
    q.append((y, w - 1))

while q:
    y, x = q.popleft()
    if visited[y, x]:
        continue
    visited[y, x] = True
    r, g, b, _ = crop[y, x]
    brightness = (int(r) + int(g) + int(b)) / 3.0
    if brightness > 238 and min(r, g, b) > 210:
        bg_mask[y, x] = True
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                q.append((ny, nx))

# Alpha mask creation
alpha_im = Image.fromarray((~bg_mask).astype(np.uint8) * 255)
# Smooth edges slightly
alpha_smooth = alpha_im.filter(ImageFilter.GaussianBlur(radius=0.7))
alpha_arr = np.array(alpha_smooth, dtype=np.float32) / 255.0

# Zero out background regions
alpha_arr[bg_mask] = 0.0

# Defringe edges against white background
rgb = crop[:, :, :3].astype(np.float32) / 255.0
# For semi-transparent pixels, remove the white background component:
# C = a * F + (1 - a) * 1  =>  F = (C - (1 - a)) / a
edge_mask = (alpha_arr > 0.02) & (alpha_arr < 0.98)
for y, x in zip(*np.where(edge_mask)):
    a = alpha_arr[y, x]
    c = rgb[y, x]
    defringed = (c - (1.0 - a)) / a
    rgb[y, x] = np.clip(defringed, 0.0, 1.0)

# Build RGBA array
out_arr = np.zeros((h, w, 4), dtype=np.uint8)
out_arr[:, :, :3] = (np.clip(rgb, 0.0, 1.0) * 255.0).astype(np.uint8)
out_arr[:, :, 3] = (alpha_arr * 255.0).astype(np.uint8)

icon_img = Image.fromarray(out_arr)

# Tight crop to non-zero alpha bounding box
bbox = icon_img.getbbox()
icon_trimmed = icon_img.crop(bbox)
tw, th = icon_trimmed.size

# Place into square canvas (512x512)
canvas_size = 512
margin = 24
max_dim = canvas_size - (margin * 2)

scale = min(max_dim / tw, max_dim / th)
new_w = int(tw * scale)
new_h = int(th * scale)

resized = icon_trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

square_icon = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
paste_x = (canvas_size - new_w) // 2
paste_y = (canvas_size - new_h) // 2
square_icon.paste(resized, (paste_x, paste_y), resized)

dest_dir = r'f:\E-Commerce\frontend\public\images\logo'
os.makedirs(dest_dir, exist_ok=True)

# 1. Transparent icon
square_icon.save(os.path.join(dest_dir, 'techtonic-icon.png'))
print('Saved techtonic-icon.png:', square_icon.size)

# 2. Sleek Dark App Badge Icon (Squircle with dark sapphire tech gradient)
badge_canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
from PIL import ImageDraw
draw = ImageDraw.Draw(badge_canvas)
corner_radius = 110
# Rounded squircle background
draw.rounded_rectangle([8, 8, canvas_size - 8, canvas_size - 8], radius=corner_radius, fill=(5, 14, 36, 255), outline=(0, 217, 255, 120), width=4)

# Place icon inside badge with comfortable margin
badge_margin = 72
b_max = canvas_size - (badge_margin * 2)
b_scale = min(b_max / tw, b_max / th)
b_w = int(tw * b_scale)
b_h = int(th * b_scale)
b_resized = icon_trimmed.resize((b_w, b_h), Image.Resampling.LANCZOS)
b_paste_x = (canvas_size - b_w) // 2
b_paste_y = (canvas_size - b_h) // 2
badge_canvas.paste(b_resized, (b_paste_x, b_paste_y), b_resized)

badge_canvas.save(os.path.join(dest_dir, 'techtonic-badge.png'))
print('Saved techtonic-badge.png:', badge_canvas.size)

# Favicons
square_icon.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(r'f:\E-Commerce\frontend\public', 'favicon.png'))
square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(r'f:\E-Commerce\frontend\public', 'favicon-32x32.png'))
print('Favicons saved successfully!')
