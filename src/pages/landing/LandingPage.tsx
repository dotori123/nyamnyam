import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CatMark from '../../components/common/CatMark';
import Icon from '../../components/common/Icon';
import type { IconName } from '../../components/common/icons';
import ProductCard from '../../components/record/ProductCard';
import RecordCard from '../../components/record/RecordCard';
import { MOCK_RECORDS } from '../../mock/records';
import { groupByProduct } from '../../utils/products';
import { APP_NAME, APP_TITLE } from '../../utils/routeTitles';
import { markStarted } from '../../storage/firstVisit';
import { LANDING, type LandingItem } from './content';
import { useHeroScene, useReveal, useTilt } from './motion';
import './LandingPage.scss';

/**
 * 처음 온 사람에게 보여주는 소개 화면 (/), 그리고 누구나 볼 수 있는 /intro.
 *
 * 앱 셸(헤더·하단 탭) 밖에서 그린다. 앱을 한 번 쓰면 같은 주소가 기록 목록이 된다
 * (storage/firstVisit.ts). 문구는 content.ts 한 곳에 있고,
 * 같은 문구가 빌드 때 index.html에도 정적 HTML로 들어간다 (staticHtml.ts).
 *
 * 앱 안은 조용하게 두고, 이 화면만 "스티커 붙인 그림책"처럼 크게 논다 (DESIGN.md "소개 화면").
 */

/** 카드 그림 칸 색. 털색 테마 변수만 써서 테마를 바꿔도 대비가 유지된다 */
const TONES = ['soft', 'ink', 'primary'] as const;

/**
 * 폰 뒤로 톡톡 떨어지는 사료 조각. 장식이라 스크린리더에서는 숨긴다.
 * x: 무대 왼쪽에서 몇 %, delay·duration: 초, spin: 떨어지며 도는 각도
 */
const FALLING: { icon: IconName; x: number; delay: number; duration: number; size: number; spin: number }[] = [
  { icon: 'fish', x: 6, delay: 0, duration: 7.5, size: 26, spin: 220 },
  { icon: 'paw', x: 20, delay: 2.4, duration: 9, size: 20, spin: -160 },
  { icon: 'heart', x: 34, delay: 4.8, duration: 8, size: 18, spin: 140 },
  { icon: 'can', x: 66, delay: 1.2, duration: 8.5, size: 24, spin: -200 },
  { icon: 'bowl', x: 80, delay: 3.6, duration: 7, size: 26, spin: 180 },
  { icon: 'paw', x: 92, delay: 6, duration: 9.5, size: 18, spin: -140 },
];

/** 스티커가 붙을 때 기울어 있는 각도. 붙는 순서대로 */
const HERO_STICKER_TILT = ['-8deg', '7deg', '5deg', '-6deg'];

export default function LandingPage() {
  const { hero, heroStickers, previewLabel, record, insights, faq, closing } = LANDING;

  // 앱 셸의 useDocumentTitle이 돌지 않는 화면이라 직접 맞춘다
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  // 폰 안에 그릴 앱 화면 — 가장 여러 번 산 샘플 제품과 최근 샘플 기록 하나
  const preview = useMemo(() => {
    const product = [...groupByProduct(MOCK_RECORDS)].sort(
      (a, b) => b.purchases.length - a.purchases.length,
    )[0];
    return { product, record: MOCK_RECORDS[0] };
  }, []);

  const navigate = useNavigate();

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  useReveal(rootRef);
  useTilt(heroRef, phoneRef);
  useHeroScene(sceneRef, stageRef);

  // 샘플 기록이 깔린 목록으로 넘어간다.
  // / 에서는 표시만 바꾸면 같은 주소가 목록이 되고, /intro 에서는 / 로 옮겨 간다
  const browseSample = () => {
    markStarted();
    navigate('/');
    window.scrollTo(0, 0);
  };

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing__nav">
        <span className="landing__brand">
          <span className="landing__logo">
            <CatMark />
          </span>
          {APP_NAME}
        </span>
        <button type="button" className="landing__nav-cta" onClick={browseSample}>
          앱 열기
        </button>
      </header>

      <main>
        <section className="landing__hero" ref={heroRef}>
          <p className="landing__eyebrow">{hero.eyebrow}</p>
          <h1 className="landing__title">
            {/* 한 줄씩 떠오른다. 줄 사이 공백은 복사·읽기용 */}
            <span className="landing__title-line">{hero.title[0]}</span>{' '}
            <span className="landing__title-line">{hero.title[1]}</span>
          </h1>

          <div className="landing__stage" ref={stageRef}>
            {/* 3D 종이 조각 (motion.ts가 나중에 불러와 그린다). 못 그리면 아래 CSS 조각이 대신한다 */}
            <canvas ref={sceneRef} className="landing__scene" aria-hidden="true" />
            <div className="landing__falling" aria-hidden="true">
              {FALLING.map((piece, index) => (
                <span
                  key={index}
                  className="landing__falling-piece"
                  style={
                    {
                      left: `${piece.x}%`,
                      fontSize: piece.size,
                      '--delay': `${piece.delay}s`,
                      '--duration': `${piece.duration}s`,
                      '--spin': `${piece.spin}deg`,
                    } as CSSProperties
                  }
                >
                  <Icon name={piece.icon} />
                </span>
              ))}
            </div>

            {/* 폰 안은 실제 카드 컴포넌트다. 예시일 뿐이라 inert로 눌리지도 읽히지도 않게 막는다 */}
            <figure className="landing__phone" ref={phoneRef}>
              <div className="landing__screen" inert>
                <div className="landing__screen-bar">
                  <span className="landing__screen-logo">
                    <CatMark />
                  </span>
                  {APP_NAME}
                </div>
                <ul className="landing__screen-list">
                  <ProductCard group={preview.product} />
                  <RecordCard record={preview.record} />
                </ul>
              </div>
              <figcaption className="sr-only">{previewLabel}</figcaption>
            </figure>

            {heroStickers.map((text, index) => (
              <span
                key={text}
                className={`landing__sticker landing__sticker--hero-${index}`}
                style={{ '--i': index, '--rot': HERO_STICKER_TILT[index] } as CSSProperties}
                aria-hidden="true"
              >
                {text}
              </span>
            ))}
          </div>

          <p className="landing__lead">{hero.lead}</p>
          <div className="landing__actions">
            <Link to="/new" className="btn btn--primary landing__cta">
              {hero.primary}
            </Link>
            <button type="button" className="btn btn--ghost landing__cta" onClick={browseSample}>
              {hero.secondary}
            </button>
          </div>
          <p className="landing__note">{hero.note}</p>
        </section>

        <FeatureSection title={record.title} items={record.items} />
        <FeatureSection title={insights.title} items={insights.items} offset={1} />

        <section className="landing__section">
          <h2 className="landing__section-title" data-reveal>
            {faq.title}
          </h2>
          <div className="landing__faq" data-reveal>
            {faq.items.map((item) => (
              <details key={item.q} className="landing__faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing__closing" data-reveal>
          <span className="landing__closing-mark">
            <CatMark />
          </span>
          <h2 className="landing__closing-title">{closing.title}</h2>
          <Link to="/new" className="btn btn--primary landing__cta">
            {closing.primary}
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        {APP_NAME} · Cat food, remembered.
      </footer>
    </div>
  );
}

function FeatureSection({
  title,
  items,
  offset = 0,
}: {
  title: string;
  items: readonly LandingItem[];
  /** 두 섹션이 같은 색 순서로 시작하지 않게 밀어 준다 */
  offset?: number;
}) {
  return (
    <section className="landing__section">
      <h2 className="landing__section-title" data-reveal>
        {title}
      </h2>
      <ul className="landing__cards">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="landing__card"
            data-reveal
            style={{ '--i': index } as CSSProperties}
          >
            <div
              className={`landing__card-art landing__card-art--${TONES[(index + offset) % TONES.length]}`}
            >
              <Icon name={item.icon} />
              {item.sticker && (
                <span className="landing__sticker landing__sticker--card" aria-hidden="true">
                  {item.sticker}
                </span>
              )}
            </div>
            <h3 className="landing__card-title">{item.title}</h3>
            <p className="landing__card-body">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
