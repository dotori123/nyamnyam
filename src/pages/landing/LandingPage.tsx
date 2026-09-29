import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CatMark from '../../components/common/CatMark';
import Icon from '../../components/common/Icon';
import ProductCard from '../../components/record/ProductCard';
import RecordCard from '../../components/record/RecordCard';
import { MOCK_RECORDS } from '../../mock/records';
import { groupByProduct } from '../../utils/products';
import { APP_NAME, APP_TITLE } from '../../utils/routeTitles';
import { markStarted } from '../../storage/firstVisit';
import { LANDING, type LandingItem } from './content';
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

  // 샘플 기록이 깔린 목록으로 넘어간다.
  // / 에서는 표시만 바꾸면 같은 주소가 목록이 되고, /intro 에서는 / 로 옮겨 간다
  const browseSample = () => {
    markStarted();
    navigate('/');
    window.scrollTo(0, 0);
  };

  return (
    <div className="landing">
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
        <section className="landing__hero">
          <p className="landing__eyebrow">{hero.eyebrow}</p>
          <h1 className="landing__title">
            {hero.title[0]}
            <br />
            {hero.title[1]}
          </h1>

          <div className="landing__stage">
            {/* 폰 안은 실제 카드 컴포넌트다. 예시일 뿐이라 inert로 눌리지도 읽히지도 않게 막는다 */}
            <figure className="landing__phone">
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
          <h2 className="landing__section-title">{faq.title}</h2>
          <div className="landing__faq">
            {faq.items.map((item) => (
              <details key={item.q} className="landing__faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing__closing">
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
      <h2 className="landing__section-title">{title}</h2>
      <ul className="landing__cards">
        {items.map((item, index) => (
          <li key={item.title} className="landing__card">
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
