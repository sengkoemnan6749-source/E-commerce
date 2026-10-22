import fs from 'fs';

const brands = ['apple', 'samsung', 'sony', 'dji', 'microsoft', 'bose', 'lg', 'nintendo', 'canon'];
for (const b of brands) {
  const c = fs.readFileSync(`public/images/brands/${b}.svg`, 'utf8');
  const fills = [...c.matchAll(/(fill|style)=["']([^"']+)["']/g)].map(m => m[1] + '=' + m[2]);
  console.log(b, fills.slice(0, 4));
}
