import { useState } from 'react';

interface Props {
  photoURL: string | null;
}

/**
 * 구글 프로필 사진.
 *
 * 두 가지를 대비한다.
 *  1. referrerPolicy="no-referrer" — 구글 이미지 서버(lh3.googleusercontent.com)가
 *     리퍼러가 붙은 요청을 거부해서 localhost에서 특히 잘 깨진다.
 *  2. onError 대체 — 그래도 못 불러오면(네트워크, 사진 없는 계정) 깨진 아이콘 대신
 *     고양이 얼굴을 보여준다. 엑박은 앱이 고장 난 것처럼 보인다.
 *
 * 사용자가 바뀌면 실패 기록도 초기화돼야 해서, 부르는 쪽에서 uid를 key로 준다.
 */
export default function AccountAvatar({ photoURL }: Props) {
  const [failed, setFailed] = useState(false);

  if (!photoURL || failed) {
    return (
      <span className="account-panel__avatar account-panel__avatar--blank" aria-hidden="true">
        🐱
      </span>
    );
  }

  return (
    <img
      className="account-panel__avatar"
      src={photoURL}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
