// Renders Simple Icons (CC0) SVGs to white PNGs. Run once: npm i simple-icons sharp, then node make_social_icons.mjs
import fs from 'fs'; import sharp from 'sharp';
const dir = 'node_modules/simple-icons/icons/', out = '../assets/social/';
const names = ['discord','github','kofi','instagram','x','youtube','soundcloud','tiktok','gmail','roblox','twitch','bluesky'];
for (const n of names) {
  let svg = fs.readFileSync(dir + n + '.svg', 'utf8').replace('<svg ', '<svg fill="#ffffff" ');
  await sharp(Buffer.from(svg), { density: 600 }).resize(128, 128, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).png().toFile(out + n + '.png');
}
console.log('ok');
