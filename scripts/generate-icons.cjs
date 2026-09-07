// 냥냠냠 PWA 아이콘 생성기 (의존성 없음)
// 삼색이(calico) 고양이 얼굴을 픽셀 단위로 그려 PNG로 인코딩한다.
// 도형은 src/components/common/CatMark.tsx / public/favicon.svg와 동일한 좌표계(0~1 정규화).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = process.argv[2];

// ── PNG 인코딩 ──────────────────────────────
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 브랜드 팔레트 (src/styles/_tokens.scss와 동일) ──
const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const ORANGE = hex('#ef9f27');
const ORANGE_DEEP = hex('#d9880f');
const CREAM = hex('#fbf6ee');
const BLACK = hex('#2c2c2a');

// ── 도형 ────────────────────────────────────
function inRoundedRect(x, y, r) {
  if (x < 0 || x > 1 || y < 0 || y > 1) return false;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1e-9;
}

function inCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** 축 정렬 타원 */
function inEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

function inTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/**
 * 정규화 좌표(0~1)에서의 색. null이면 투명.
 * @param {number} scale 아이콘 안의 고양이 크기 배율 (maskable은 작게)
 */
function sample(x, y, { radius, scale }) {
  if (!inRoundedRect(x, y, radius)) return null;

  // 배경: 오렌지 그라데이션
  const t = y;
  const bg = [
    Math.round(ORANGE[0] + (ORANGE_DEEP[0] - ORANGE[0]) * t),
    Math.round(ORANGE[1] + (ORANGE_DEEP[1] - ORANGE[1]) * t),
    Math.round(ORANGE[2] + (ORANGE_DEEP[2] - ORANGE[2]) * t),
  ];

  // 고양이를 중심 기준으로 확대/축소
  const sx = (x - 0.5) / scale + 0.5;
  const sy = (y - 0.5) / scale + 0.5;

  const earL = [[0.235, 0.44], [0.33, 0.14], [0.47, 0.33]];
  const earR = [[0.765, 0.44], [0.67, 0.14], [0.53, 0.33]];
  const earLIn = [[0.315, 0.385], [0.345, 0.245], [0.415, 0.335]];
  const earRIn = [[0.685, 0.385], [0.655, 0.245], [0.585, 0.335]];

  // 실루엣 림 — 오렌지 얼룩이 오렌지 배경에 묻히지 않도록
  // 얼굴/귀를 살짝 키운 블랙 도형을 먼저 깔아 테두리를 만든다
  const grow = (p) => [0.5 + (p[0] - 0.5) * 1.045, 0.5 + (p[1] - 0.5) * 1.045];
  const isRim =
    inTriangle(sx, sy, ...earL.map(grow)) ||
    inTriangle(sx, sy, ...earR.map(grow)) ||
    inEllipse(sx, sy, 0.5, 0.5627, 0.3031, 0.2769);

  if (inTriangle(sx, sy, ...earL) || inTriangle(sx, sy, ...earR)) {
    // 왼쪽 안쪽 귀는 오렌지, 오른쪽은 블랙 — 삼색이 대칭 깨기
    if (inTriangle(sx, sy, ...earLIn)) return ORANGE;
    if (inTriangle(sx, sy, ...earRIn)) return BLACK;
    return CREAM;
  }

  // 머리
  if (inEllipse(sx, sy, 0.5, 0.56, 0.29, 0.265)) {
    // 눈
    if (inEllipse(sx, sy, 0.405, 0.54, 0.037, 0.05)) return BLACK;
    if (inEllipse(sx, sy, 0.595, 0.54, 0.037, 0.05)) return BLACK;
    // 코
    if (inTriangle(sx, sy, [0.5, 0.66], [0.465, 0.61], [0.535, 0.61])) return ORANGE;
    // 입 (양쪽 곡선을 원 두 개의 테두리로 근사)
    const mouth =
      (inCircle(sx, sy, 0.462, 0.66, 0.05) && !inCircle(sx, sy, 0.462, 0.66, 0.036) && sy > 0.66) ||
      (inCircle(sx, sy, 0.538, 0.66, 0.05) && !inCircle(sx, sy, 0.538, 0.66, 0.036) && sy > 0.66);
    if (mouth) return BLACK;
    // 얼룩 — 얼굴 안쪽에만
    if (inEllipse(sx, sy, 0.33, 0.36, 0.17, 0.12)) return ORANGE;
    if (inEllipse(sx, sy, 0.67, 0.35, 0.15, 0.11)) return BLACK;
    return CREAM;
  }

  if (isRim) return BLACK;

  return bg;
}

function render(size, options) {
  const SS = 3; // 3x3 슈퍼샘플링 안티에일리어싱
  const rgba = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const color = sample(x, y, options);
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const alpha = a / n;
      // 커버리지가 0인 픽셀은 완전 투명
      rgba[i] = alpha > 0 ? Math.round(r / (a / 255)) : 0;
      rgba[i + 1] = alpha > 0 ? Math.round(g / (a / 255)) : 0;
      rgba[i + 2] = alpha > 0 ? Math.round(b / (a / 255)) : 0;
      rgba[i + 3] = Math.round(alpha);
    }
  }
  return encodePng(size, size, rgba);
}

const TARGETS = [
  { file: 'pwa-192x192.png', size: 192, radius: 0.24, scale: 1 },
  { file: 'pwa-512x512.png', size: 512, radius: 0.24, scale: 1 },
  // maskable: 배경 full-bleed + 안전 영역(80%) 안으로 고양이 축소
  { file: 'pwa-maskable-512x512.png', size: 512, radius: 0, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0.001, scale: 0.92 },
];

for (const target of TARGETS) {
  const png = render(target.size, { radius: target.radius, scale: target.scale });
  fs.writeFileSync(path.join(OUT_DIR, target.file), png);
  console.log(`${target.file}  ${target.size}x${target.size}  ${(png.length / 1024).toFixed(1)}KB`);
}
