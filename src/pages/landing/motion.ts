import { useEffect, type RefObject } from 'react';

/**
 * 소개 화면 움직임 — CSS만으로 안 되는 두 가지만 여기서 한다.
 *  - 스크롤해 들어온 요소에 is-in을 붙여 튀어 오르게 (IntersectionObserver)
 *  - 마우스 위치에 따라 폰을 살짝 기울이기 (CSS 변수 --tilt-x / --tilt-y)
 *
 * 움직임 줄이기를 켠 사용자에게는 아무것도 하지 않는다.
 * 그러면 data-motion이 붙지 않아 CSS가 처음부터 다 보이는 상태로 둔다
 * (숨겼다가 보여주는 스타일은 [data-motion='on'] 아래에만 있다).
 */

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;

    root.dataset.motion = 'on';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          // 한 번 나타나면 끝. 스크롤을 올렸다 내려도 다시 숨기지 않는다
          observer.unobserve(entry.target);
        }
      },
      // 화면 아래 끝에 살짝 들어왔을 때 시작해야 튀어 오르는 게 보인다
      { rootMargin: '0px 0px -12% 0px' },
    );
    root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      delete root.dataset.motion;
    };
  }, [rootRef]);
}

/** 기울기 최대 각도(도). 이 이상이면 폰 안 글자가 읽기 어려워진다 */
const MAX_TILT = 8;

export function useTilt(
  areaRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const area = areaRef.current;
    const target = targetRef.current;
    // 마우스가 있는 기기에서만. 휴대폰은 CSS의 둥실 떠 있는 움직임으로 대신한다
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!area || !target || !finePointer || reducedMotion()) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        // 폰 가운데 기준 -1 ~ 1
        const dx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 1.5)));
        const dy = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / rect.height));
        target.style.setProperty('--tilt-x', `${(-dy * MAX_TILT).toFixed(2)}deg`);
        target.style.setProperty('--tilt-y', `${(dx * MAX_TILT).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      target.style.setProperty('--tilt-x', '0deg');
      target.style.setProperty('--tilt-y', '0deg');
    };

    area.addEventListener('pointermove', onMove);
    area.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
    };
  }, [areaRef, targetRef]);
}
