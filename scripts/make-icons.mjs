// Rasterizes public/icons/icon.svg into the PWA PNG icons.
// Full-bleed variants (apple-touch, maskable) drop the rounded corners so no transparent pixels remain.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const fullBleed = svg.replace(' rx="112"', '');

function render(source, size, out) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(out, png);
  console.log(`${out} (${size}x${size})`);
}

render(svg, 192, 'public/icons/icon-192.png');
render(svg, 512, 'public/icons/icon-512.png');
render(fullBleed, 512, 'public/icons/icon-maskable-512.png');
render(fullBleed, 180, 'public/apple-touch-icon.png');
