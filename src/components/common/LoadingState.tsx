import './LoadingState.scss';

interface Props {
  /** 무엇을 기다리는 중인지 (예: "기록") */
  label?: string;
}

/**
 * 계정에서 데이터를 받아오는 동안 자리를 채운다.
 *
 * 이게 없으면 불러오는 사이에 "아직 기록이 없어요"가 떠서,
 * 기록이 멀쩡히 있는 사람에게 없다고 거짓말을 하게 된다.
 */
export default function LoadingState({ label = '기록' }: Props) {
  return (
    <p className="loading-state" role="status">
      {label}을 불러오는 중이에요…
    </p>
  );
}
