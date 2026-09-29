import {
  BackSide,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  SphereGeometry,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';

/**
 * 소개 화면 첫 화면의 3D 장면 — 폰 둘레에 떠다니는 "종이 조각".
 *
 * LandingPage가 첫 화면을 다 그린 뒤 import()로 따로 불러온다 (three.js가 앱 번들에 섞이지 않게).
 * 조각은 조명 없이 테마 색으로 납작하게 칠하고, 스티커처럼 --text 색 테두리를 두른다
 * (조금 크게 뒤집어 그린 껍데기로 외곽선을 낸다). 규칙은 DESIGN.md "소개 화면".
 *
 * 반환값은 정리 함수. 화면을 떠나면 GPU 자원까지 돌려준다.
 */

type Kind = 'kibble' | 'fish' | 'heart' | 'paw' | 'can';

interface Piece {
  root: Group;
  /** 화면 비율에 맞춰 다시 놓을 때 쓰는 -1~1 좌표 */
  nx: number;
  ny: number;
  z: number;
  baseScale: number;
  spin: [number, number, number];
  bob: number;
  phase: number;
  /** 등장 순서 (초) */
  appearAt: number;
}

/** 폰이 있는 가운데는 비워 둔다 — 조각은 폰 뒤라 가운데 두면 가려질 뿐이다 */
const LAYOUT: { kind: Kind; nx: number; ny: number; z: number; s: number }[] = [
  { kind: 'fish', nx: -0.78, ny: 0.55, z: -1, s: 1.3 },
  { kind: 'kibble', nx: -0.55, ny: 0.2, z: 1, s: 0.55 },
  { kind: 'heart', nx: -0.85, ny: -0.1, z: 0, s: 1 },
  { kind: 'can', nx: -0.62, ny: -0.55, z: -2, s: 1.1 },
  { kind: 'kibble', nx: -0.4, ny: -0.82, z: 0.5, s: 0.5 },
  { kind: 'paw', nx: 0.8, ny: 0.62, z: -0.5, s: 1.1 },
  { kind: 'kibble', nx: 0.52, ny: 0.35, z: 1.5, s: 0.5 },
  { kind: 'fish', nx: 0.86, ny: -0.05, z: -2, s: 1.1 },
  { kind: 'heart', nx: 0.6, ny: -0.5, z: 0.8, s: 0.85 },
  { kind: 'kibble', nx: 0.35, ny: -0.85, z: -1, s: 0.6 },
  { kind: 'paw', nx: -0.3, ny: 0.88, z: -2.5, s: 0.8 },
  { kind: 'kibble', nx: 0.25, ny: 0.9, z: -1.5, s: 0.45 },
];

/** 휴대폰에서는 조각 수를 줄인다 (GPU·배터리) */
const MOBILE_COUNT = 7;

const CAMERA_Z = 20;
const FOV = 35;

export function startHeroScene(canvas: HTMLCanvasElement, themeSource: HTMLElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;
  const world = new Group();
  scene.add(world);

  // ── 색: 테마 CSS 변수에서 ──
  const css = getComputedStyle(themeSource);
  const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const palette = {
    primary: color('--primary', '#f4a71a'),
    ink: color('--primary-ink', '#8f5a06'),
    surface: color('--surface', '#ffffff'),
    line: color('--text', '#26261f'),
  };

  const disposables: (BufferGeometry | Material)[] = [];
  const mat = (hex: string, back = false) => {
    const m = new MeshBasicMaterial(back ? { color: hex, side: BackSide } : { color: hex });
    disposables.push(m);
    return m;
  };
  const outlineMat = mat(palette.line, true);

  /** 모양 하나 + 스티커 테두리 껍데기 */
  const piece = (geometry: BufferGeometry, fill: MeshBasicMaterial) => {
    geometry.center();
    disposables.push(geometry);
    const g = new Group();
    const outline = new Mesh(geometry, outlineMat);
    outline.scale.setScalar(1.12);
    g.add(outline, new Mesh(geometry, fill));
    return g;
  };

  const extrude = (shapes: Shape | Shape[], depth = 0.35) =>
    new ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 16 });

  const build: Record<Kind, () => Group> = {
    kibble: () => piece(new SphereGeometry(0.6, 16, 12).scale(1, 0.62, 1), mat(palette.ink)),
    fish: () => {
      const s = new Shape();
      s.moveTo(-1.1, 0);
      s.bezierCurveTo(-0.5, 0.75, 0.6, 0.75, 1.0, 0);
      s.bezierCurveTo(0.6, -0.75, -0.5, -0.75, -1.1, 0);
      const tail = new Shape();
      tail.moveTo(-1.0, 0);
      tail.lineTo(-1.65, 0.5);
      tail.lineTo(-1.65, -0.5);
      tail.closePath();
      return piece(extrude([s, tail]), mat(palette.primary));
    },
    heart: () => {
      const s = new Shape();
      s.moveTo(0, -0.9);
      s.bezierCurveTo(-0.2, -0.65, -1.1, -0.2, -1.1, 0.35);
      s.bezierCurveTo(-1.1, 0.85, -0.45, 1.05, 0, 0.55);
      s.bezierCurveTo(0.45, 1.05, 1.1, 0.85, 1.1, 0.35);
      s.bezierCurveTo(1.1, -0.2, 0.2, -0.65, 0, -0.9);
      // 앱의 만족도 하트와 같은 색. 옅은 --primary-soft는 크림 바탕에서 흰 종이처럼 보였다
      return piece(extrude(s), mat(palette.ink));
    },
    paw: () => {
      const circle = (x: number, y: number, r: number) => {
        const c = new Shape();
        c.absellipse(x, y, r, r * 1.1, 0, Math.PI * 2, false, 0);
        return c;
      };
      const pad = new Shape();
      pad.absellipse(0, -0.35, 0.72, 0.58, 0, Math.PI * 2, false, 0);
      return piece(
        extrude([pad, circle(-0.78, 0.35, 0.26), circle(-0.3, 0.78, 0.26), circle(0.3, 0.78, 0.26), circle(0.78, 0.35, 0.26)]),
        mat(palette.primary),
      );
    },
    can: () => {
      // 옆면은 포인트색, 뚜껑은 흰 면 — 원기둥의 재질 묶음(옆·위·아래)을 따로 칠한다
      const geometry = new CylinderGeometry(0.7, 0.7, 1.1, 24);
      geometry.center();
      disposables.push(geometry);
      const g = new Group();
      const outline = new Mesh(geometry, outlineMat);
      outline.scale.setScalar(1.1);
      const top = mat(palette.surface);
      g.add(outline, new Mesh(geometry, [mat(palette.primary), top, top]));
      return g;
    },
  };

  // ── 조각 놓기 ──
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const layout = mobile ? LAYOUT.filter((_, i) => i % 2 === 0).slice(0, MOBILE_COUNT) : LAYOUT;
  const pieces: Piece[] = layout.map((spec, index) => {
    const root = build[spec.kind]();
    root.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    world.add(root);
    return {
      root,
      nx: spec.nx,
      ny: spec.ny,
      z: spec.z,
      baseScale: spec.s * (mobile ? 0.8 : 1),
      spin: [(Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4],
      bob: 0.25 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      appearAt: 0.15 + index * 0.08,
    };
  });

  // ── 크기: 캔버스 비율이 바뀌면 조각 자리를 다시 편다 ──
  let halfW = 1;
  let halfH = 1;
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan((FOV / 2) * (Math.PI / 180)) * CAMERA_Z;
    halfW = halfH * camera.aspect;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  // ── 입력: 마우스는 기울기, 스크롤은 회전 가속 ──
  const pointer = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  let lastScroll = window.scrollY;
  let spinBoost = 0;
  const onScroll = () => {
    const delta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    spinBoost = Math.min(spinBoost + Math.abs(delta) * 0.004, 4);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── 그리기: 화면에 보일 때만 ──
  let visible = true;
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) loop();
  });
  visibility.observe(canvas);
  const onTab = () => {
    if (!document.hidden) loop();
  };
  document.addEventListener('visibilitychange', onTab);

  const start = performance.now();
  let last = start;
  let frame = 0;
  let running = false;

  function loop() {
    if (running) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function tick(now: number) {
    if (!visible || document.hidden) {
      running = false;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now - start) / 1000;

    tilt.x += (pointer.y * 0.18 - tilt.x) * 0.06;
    tilt.y += (pointer.x * 0.3 - tilt.y) * 0.06;
    world.rotation.set(tilt.x, tilt.y, 0);
    spinBoost *= 0.94;

    for (const p of pieces) {
      // 등장: 스티커처럼 작게 시작해 살짝 넘쳤다가 제자리
      const k = Math.min(Math.max((t - p.appearAt) / 0.5, 0), 1);
      const pop = k === 0 ? 0 : 1 + 0.35 * Math.sin(k * Math.PI) * (1 - k);
      p.root.scale.setScalar(p.baseScale * pop);

      const speed = 1 + spinBoost;
      p.root.rotation.x += p.spin[0] * dt * speed;
      p.root.rotation.y += p.spin[1] * dt * speed;
      p.root.rotation.z += p.spin[2] * dt * speed;
      p.root.position.set(
        p.nx * halfW * 0.92 + pointer.x * p.z * -0.15,
        p.ny * halfH * 0.88 + Math.sin(t * p.bob * 2 + p.phase) * 0.35,
        p.z,
      );
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }

  loop();

  return () => {
    cancelAnimationFrame(frame);
    running = false;
    resizeObserver.disconnect();
    visibility.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onTab);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}
