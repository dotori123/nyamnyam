import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';

export default function NotFoundPage() {
  return (
    <EmptyState
      emoji="😿"
      title="없는 페이지예요"
      description="주소를 다시 확인해 주세요."
      action={
        <Link to="/" className="btn btn--primary">
          홈으로
        </Link>
      }
    />
  );
}
