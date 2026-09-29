import type { IconName } from '../../components/common/icons.ts';

/**
 * 랜딩 화면의 문구 — 한 곳에서만 고친다.
 *
 * 두 군데가 이 파일을 읽는다.
 *  - LandingPage.tsx : 사람이 보는 화면 (React)
 *  - staticHtml.ts   : 빌드 때 index.html에 박아 넣는 정적 HTML + FAQ 구조화 데이터
 *                      (JS를 실행하지 않는 AI 크롤러가 읽는 건 이쪽이다)
 * 그래서 이 파일은 React·스타일을 import하지 않는다. vite.config.ts에서도 불러온다.
 *
 * 기능이 바뀌면 public/llms.txt와 index.html의 JSON-LD(featureList)도 같이 고친다.
 */

export interface LandingItem {
  icon: IconName;
  title: string;
  body: string;
  /** 카드 그림 위에 삐딱하게 붙는 스티커 한 마디 (화면 장식이라 정적 HTML에는 넣지 않는다) */
  sticker?: string;
}

export const LANDING = {
  hero: {
    eyebrow: '고양이 사료 기록장',
    /** 줄바꿈 위치까지 문구다 */
    title: ['잘 먹은 사료,', '다음에도 찾게.'],
    lead:
      '우리 고양이가 먹은 사료·습식·간식을 기록해 두세요. 잘 먹었는지, 배변은 괜찮았는지, 어디서 얼마에 샀는지 남겨 두면 다음에 살 사료를 고민 없이 고를 수 있어요.',
    primary: '첫 기록 남기기',
    secondary: '예시 둘러보기',
    note: '가입도 설치도 없이, 무료로 바로 써요.',
  },

  /**
   * 첫 화면 폰 둘레에 붙는 스티커. 화면 장식이라 정적 HTML에는 넣지 않는다.
   * 폰 안의 앱 화면은 샘플 기록(src/mock)을 실제 카드로 그린다.
   */
  heroStickers: ['최저가 기억!', '또 사줄게', '하트 다섯 개', '설사한 건 걸러요'],
  previewLabel: '샘플 기록으로 본 앱 화면',

  record: {
    title: '먹을 때마다 한 줄씩',
    items: [
      {
        icon: 'notebook',
        title: '무엇을 샀는지',
        body: '브랜드, 제품명, 맛, 종류(건사료·습식·간식·영양제), 용량, 가격, 구매처, 사진까지.',
        sticker: '찰칵',
      },
      {
        icon: 'heart',
        title: '잘 먹었는지',
        body: '만족도 하트 5단계, 배변 상태, 또 살지 말지를 버튼 몇 번으로 남겨요.',
        sticker: '냠냠 5점',
      },
      {
        icon: 'cat',
        title: '누가 먹었는지',
        body: '여러 마리를 키워도 고양이별로 나눠 기록하고 따로 모아 봐요.',
        sticker: '나비 거',
      },
    ] satisfies readonly LandingItem[],
  },

  insights: {
    title: '쌓이면 이런 걸 알려줘요',
    items: [
      {
        icon: 'repeat',
        title: '같은 제품은 한 장으로',
        body: '여러 번 산 기록을 모아 구매처별 가격과 최저가, 평균 만족도를 나란히 보여줘요.',
        sticker: '여기가 최저',
      },
      {
        icon: 'chart',
        title: '100g당 단가로 비교',
        body: '용량이 달라도 100g당 가격으로 바꿔 어느 쪽이 싼지 바로 보여요. 최근 6개월 지출도 한눈에.',
        sticker: '100g당 얼마?',
      },
      {
        icon: 'paw',
        title: '배변이 안 좋았던 사료',
        body: '통계에서 따로 모아 보여줘서, 안 맞았던 사료를 다시 사는 일이 없어요.',
        sticker: '이건 패스',
      },
    ] satisfies readonly LandingItem[],
  },

  faq: {
    title: '자주 묻는 질문',
    items: [
      {
        q: '가입해야 쓸 수 있나요?',
        a: '아니요. 로그인하지 않으면 기록이 이 기기에만 저장돼요. 구글로 로그인하면 여러 기기에서 같은 기록을 볼 수 있어요.',
      },
      {
        q: '앱을 설치해야 하나요?',
        a: '브라우저에서 바로 쓸 수 있어요. 휴대폰 홈 화면에 추가하면 앱처럼 열려요.',
      },
      {
        q: '내 기록이 다른 사람에게 보이나요?',
        a: '아니요. 기록은 나만 볼 수 있어요. 리뷰를 모으는 곳이 아니라 우리 고양이만의 기록장이에요.',
      },
      {
        q: '기록을 옮기거나 보관할 수 있나요?',
        a: '설정의 백업에서 사진까지 담은 파일로 내보내고, 다른 기기에서 가져올 수 있어요.',
      },
    ],
  },

  closing: {
    title: '오늘 먹은 한 끼부터.',
    primary: '첫 기록 남기기',
  },
} as const;
