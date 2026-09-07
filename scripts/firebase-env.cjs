/**
 * Firebase 콘솔이 보여주는 자바스크립트 설정 블록을 .env.local로 바꿔 준다.
 *
 *   1. 콘솔 → 프로젝트 설정(⚙️) → 내 앱 → SDK 설정 및 구성 → "구성"
 *   2. 거기 나온 코드를 통째로 복사해 프로젝트 루트의 firebase-config.txt 에 붙여넣기
 *   3. npm run firebase:env
 *
 * import 문이나 주석이 섞여 있어도 되고, 필요한 값만 골라 읽는다.
 * 손으로 6줄을 옮기다 나는 오타를 막으려고 둔 스크립트다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'firebase-config.txt');
const OUTPUT = path.join(ROOT, '.env.local');

/** 설정 키 → .env 변수명 */
const KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

/**
 * `apiKey: "AIza..."` 같은 줄에서 값만 꺼낸다.
 * 정규식 하나로 처리하지 않는 이유: 따옴표가 두 종류에 공백도 제각각이라
 * 줄 단위로 잘라 보는 쪽이 읽기 쉽고 덜 깨진다.
 */
function extract(source, key) {
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;

    // "apiKey" 든 apiKey 든 따옴표·공백을 떼고 이름만 비교
    const name = line.slice(0, colon).replace(/["' ]/g, '');
    if (name !== key) continue;

    const rest = line.slice(colon + 1);
    const start = rest.search(/["']/);
    if (start < 0) continue;

    const quote = rest[start];
    const end = rest.indexOf(quote, start + 1);
    if (end < 0) continue;

    return rest.slice(start + 1, end);
  }
  return null;
}

if (!fs.existsSync(INPUT)) {
  console.error(`\n${path.basename(INPUT)} 가 없어요.`);
  console.error('Firebase 콘솔의 설정 코드를 이 파일에 붙여넣고 다시 실행해 주세요.\n');
  process.exit(1);
}

const source = fs.readFileSync(INPUT, 'utf8');
const found = {};
const missing = [];

for (const [key, envName] of Object.entries(KEYS)) {
  const value = extract(source, key);
  if (value) found[envName] = value;
  else missing.push(key);
}

if (missing.length) {
  console.error(`\n다음 값을 찾지 못했어요: ${missing.join(', ')}`);
  console.error('콘솔의 "구성"에 나온 코드를 통째로(중괄호 포함) 붙여넣었는지 확인해 주세요.\n');
  process.exit(1);
}

fs.writeFileSync(
  OUTPUT,
  [
    '# Firebase 웹 앱 설정 — scripts/firebase-env.cjs 가 만들었습니다.',
    '# 이 파일은 커밋되지 않습니다(.gitignore의 *.local).',
    '',
    ...Object.entries(found).map(([name, value]) => `${name}=${value}`),
    '',
  ].join('\n'),
);

console.log('\n.env.local 을 만들었어요:');
for (const [name, value] of Object.entries(found)) {
  // 값이 비밀은 아니지만 콘솔 로그에 통째로 남길 이유도 없다
  console.log(`  ${name} = ${value.slice(0, 6)}…${value.slice(-4)}`);
}
console.log('\n이제 npm run dev 로 확인해 보세요. 설정 화면에 "계정" 항목이 생기면 성공이에요.\n');
