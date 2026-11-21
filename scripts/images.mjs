// Run after replacing assets/portrait-cutout.png: npm run images. Outputs are committed, so CI does not need to run this.
// The cut-out itself comes from the original photo: swift scripts/cutout.swift assets/portrait.png assets/portrait-cutout.png
import sharp from 'sharp';

const src = 'assets/portrait-cutout.png';

for (const w of [420, 840]) {
  await sharp(src).resize({ width: w }).webp({ quality: 82, alphaQuality: 90 }).toFile(`public/portrait-${w}.webp`);
}

const face = await sharp(src).resize({ height: 560 }).toBuffer();
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0a08"/>
  <circle cx="917" cy="300" r="205" fill="#dc682c"/>
  <g font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="96" fill="#ece2cf">
    <text x="80" y="210">BLESSEN</text><text x="80" y="310">THOMAS</text><text x="80" y="410">JOHN</text>
  </g>
  <text x="80" y="490" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#a69d8b">Digital Marketing Manager, Dubai</text>
</svg>`;
await sharp(Buffer.from(og)).composite([{ input: face, left: 700, top: 70 }]).png().toFile('public/og.png');
console.log('images written to public/');
