const fs = require("fs");

const size = 32;
const rowBytes = size * 4;
const xorSize = rowBytes * size;
const andRowBytes = Math.ceil(size / 32) * 4;
const andSize = andRowBytes * size;
const dibSize = 40 + xorSize + andSize;
const output = Buffer.alloc(6 + 16 + dibSize);

output.writeUInt16LE(0, 0);
output.writeUInt16LE(1, 2);
output.writeUInt16LE(1, 4);
output.writeUInt8(size, 6);
output.writeUInt8(size, 7);
output.writeUInt8(0, 8);
output.writeUInt8(0, 9);
output.writeUInt16LE(1, 10);
output.writeUInt16LE(32, 12);
output.writeUInt32LE(dibSize, 14);
output.writeUInt32LE(22, 18);

const dib = 22;
output.writeUInt32LE(40, dib);
output.writeInt32LE(size, dib + 4);
output.writeInt32LE(size * 2, dib + 8);
output.writeUInt16LE(1, dib + 12);
output.writeUInt16LE(32, dib + 14);
output.writeUInt32LE(0, dib + 16);
output.writeUInt32LE(xorSize, dib + 20);

function colorAt(x, y) {
  const background = [38, 19, 4, 255];
  const cyan = [255, 216, 53, 255];
  const blue = [238, 117, 8, 255];
  const dark = [70, 39, 7, 255];

  if (x < 2 || x > 29 || y < 2 || y > 29) return [0, 0, 0, 0];
  if ((x < 5 && y < 5) || (x > 26 && y < 5) || (x < 5 && y > 26) || (x > 26 && y > 26)) return [0, 0, 0, 0];
  if ((x >= 4 && x <= 7 || x >= 24 && x <= 27) && y >= 10 && y <= 21) return cyan;
  if ((y >= 4 && y <= 7 || y >= 24 && y <= 27) && x >= 10 && x <= 21) return cyan;
  if (x >= 7 && x <= 24 && y >= 7 && y <= 24) {
    if (x === 7 || x === 24 || y === 7 || y === 24) return cyan;
    if ((x >= 14 && x <= 17) || (y >= 14 && y <= 17)) return blue;
    return dark;
  }
  return background;
}

const pixelStart = dib + 40;
for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const [b, g, r, a] = colorAt(x, size - 1 - y);
    const offset = pixelStart + y * rowBytes + x * 4;
    output[offset] = b;
    output[offset + 1] = g;
    output[offset + 2] = r;
    output[offset + 3] = a;
  }
}

fs.writeFileSync("assets/favicon.ico", output);
