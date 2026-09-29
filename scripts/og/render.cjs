// scripts/og/og-image.html을 크롬 헤드리스로 찍어 public/og-image.png를 만든다.
// 크롬 경로가 다르면 CHROME 환경 변수로 넘긴다.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const chrome = candidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('크롬을 찾지 못했어요. CHROME=<경로> npm run og 로 알려 주세요.');
  process.exit(1);
}

const source = path.resolve(__dirname, 'og-image.html');
const out = path.resolve(__dirname, '../../public/og-image.png');

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--allow-file-access-from-files',
  '--virtual-time-budget=3000',
  `--screenshot=${out}`,
  pathToFileURL(source).href,
]);
console.log('만들었어요:', path.relative(process.cwd(), out));
