import fs from 'fs';
import path from 'path';

const destDir = path.resolve('public/images/brands');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const brands = ['apple', 'samsung', 'sony', 'dji', 'microsoft', 'bose', 'lg', 'nintendo', 'canon'];

async function run() {
  for (const b of brands) {
    try {
      const url = `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${b}.svg`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(path.join(destDir, `${b}.svg`), text, 'utf8');
      console.log(`Saved ${b}.svg (${text.length} chars)`);
    } catch (err) {
      console.error(`Failed ${b}: ${err.message}`);
    }
  }
}

run();
