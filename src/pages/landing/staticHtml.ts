import { LANDING } from './content.ts';

/**
 * 소개 문구(content.ts)를 정적 HTML로 — 빌드 때 vite.config.ts가 index.html에 박아 넣는다.
 *
 * JS를 실행하지 않는 크롤러(대부분의 AI 크롤러)와 JS가 꺼진 브라우저는 이것만 본다.
 * React가 마운트되면 #root 안을 통째로 갈아끼우므로 사용자 화면과 겹치지 않는다.
 * 모양은 신경 쓰지 않는다 — 문서 구조(h1·h2·h3)와 문구가 화면과 같으면 된다.
 *
 * vite.config.ts(Node)에서 불러오므로 React·스타일·브라우저 API를 쓰지 않는다.
 */

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function landingStaticHtml(): string {
  const { hero, record, insights, faq, closing } = LANDING;

  const cards = (items: readonly { title: string; body: string }[]) =>
    items.map((item) => `<h3>${escape(item.title)}</h3>\n<p>${escape(item.body)}</p>`).join('\n');

  return [
    '<main class="seo-intro">',
    `<p>${escape(hero.eyebrow)}</p>`,
    `<h1>${hero.title.map(escape).join(' ')}</h1>`,
    `<p>${escape(hero.lead)}</p>`,
    `<p>${escape(hero.note)}</p>`,
    `<h2>${escape(record.title)}</h2>`,
    cards(record.items),
    `<h2>${escape(insights.title)}</h2>`,
    cards(insights.items),
    `<h2>${escape(faq.title)}</h2>`,
    faq.items.map((item) => `<h3>${escape(item.q)}</h3>\n<p>${escape(item.a)}</p>`).join('\n'),
    `<h2>${escape(closing.title)}</h2>`,
    '<noscript><p><strong>냥냠냠은 JavaScript를 켜야 쓸 수 있어요.</strong></p></noscript>',
    '</main>',
  ].join('\n');
}

/** 화면에 보이는 자주 묻는 질문 그대로의 FAQPage 구조화 데이터 */
export function landingFaqJsonLd(): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  // </script>가 문구에 들어와도 태그가 닫히지 않게
  return JSON.stringify(data, null, 2).replace(/</g, '\u003c');
}
