import shutil
import base64
from PIL import Image

shutil.copy('public/images/logo/techtonic-crest-orange.png', 'public/images/logo/techtonic-crest.png')
shutil.copy('public/images/logo/techtonic-crest-orange.png', 'public/images/logo/techtonic-icon.png')

crest = Image.open('public/images/logo/techtonic-crest.png')
crest.resize((64, 64), Image.Resampling.LANCZOS).save('public/favicon.png')
crest.resize((32, 32), Image.Resampling.LANCZOS).save('public/favicon-32x32.png')

with open('public/images/logo/techtonic-crest.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="#060b18"/>
  <image href="data:image/png;base64,{b64}" x="32" y="32" width="448" height="448"/>
</svg>'''

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Updated favicon and logo files!')
