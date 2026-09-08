/**
 * 앱이 첫 실행에 깔아 준 샘플인지 가려내기.
 *
 * 샘플은 **사용자가 만든 것이 아니다.** 그래서 "계정으로 옮길까요?"(CloudSyncBanner)나
 * "백업해 두면 안전해요"(설정 → 백업)처럼 지킬 것이 있다고 전제하는 안내를
 * 샘플만 있는 상태에서 띄우면, 있지도 않은 기록을 지키라고 재촉하는 꼴이 된다.
 *
 * 샘플 id에는 mock에서 붙인 _mock_ 이 들어 있다(src/mock).
 * 사용자가 만든 기록은 createId()가 만든 임의 문자열이라 겹치지 않는다.
 */

export function isSampleId(id: string): boolean {
  return id.includes('_mock_');
}

/**
 * 비어 있거나 샘플뿐이면 true — 사용자가 만든 것이 하나도 없다는 뜻.
 *
 * 여러 묶음(기록·고양이)을 한 번에 받는다. 한쪽만 보면
 * "고양이는 직접 등록했는데 기록은 샘플뿐"인 상태를 샘플로 오해한다.
 */
export function isSampleOnly(...groups: { id: string }[][]): boolean {
  return groups.every((group) => group.every((item) => isSampleId(item.id)));
}
