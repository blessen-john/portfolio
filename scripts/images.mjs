// Run after replacing assets/portrait.png: npm run images. Outputs are committed, so CI does not need to run this.
import sharp from 'sharp';

const src = 'assets/portrait.png';
const crop = { fit: 'cover', position: 'attention' };

for (const w of [420, 840]) {
  await sharp(src).resize(w, w * 1.25, crop).webp({ quality: 78 }).toFile(`public/portrait-${w}.webp`);
}

const face = await sharp(src).resize(400, 500, crop).toBuffer();
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0f1e"/>
  <rect x="80" y="548" width="72" height="4" fill="#e8c06a"/>
  <g font-family="Georgia, serif" font-size="104" fill="#f4efe6">
    <text x="80" y="170">Blessen</text><text x="80" y="280">Thomas</text><text x="80" y="390">John</text>
  </g>
  <text x="80" y="470" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#9ca8c2">Digital Marketing Manager, Dubai</text>
</svg>`;
await sharp(Buffer.from(og)).composite([{ input: face, left: 720, top: 65 }]).png().toFile('public/og.png');
console.log('images written to public/');
