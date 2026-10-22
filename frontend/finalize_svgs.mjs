import fs from 'fs';

// 1. nintendo.svg
let nintendo = fs.readFileSync('public/images/brands/nintendo.svg', 'utf8');
if (!nintendo.includes('viewBox')) {
  nintendo = nintendo.replace('<svg', '<svg viewBox="0 0 406 100"');
  fs.writeFileSync('public/images/brands/nintendo.svg', nintendo, 'utf8');
}

// 2. apple.svg
let apple = fs.readFileSync('public/images/brands/apple.svg', 'utf8');
if (!apple.includes('fill=')) {
  apple = apple.replace('<path d=', '<path fill="currentColor" d=');
  fs.writeFileSync('public/images/brands/apple.svg', apple, 'utf8');
}

// 3. bose.svg
let bose = fs.readFileSync('public/images/brands/bose.svg', 'utf8');
if (!bose.includes('fill=')) {
  bose = bose.replace('<path', '<path fill="currentColor"');
  fs.writeFileSync('public/images/brands/bose.svg', bose, 'utf8');
}

console.log('All SVGs finalized!');
