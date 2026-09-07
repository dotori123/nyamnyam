import { Link, useNavigate, useParams } from 'react-router-dom';
import type { NewCat } from '../types';
import { useCats } from '../hooks/useCats';
import CatForm from '../components/cat/CatForm';
import EmptyState from '../components/common/EmptyState';

/** 등록(/cats/new)과 수정(/cats/:id/edit)을 함께 처리한다 */
export default function CatFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCat, addCat, updateCat } = useCats();

  const isEdit = Boolean(id);
  const cat = getCat(id ?? null);

  if (isEdit && !cat) {
    return (
      <EmptyState
        emoji="🙀"
        title="프로필을 찾을 수 없어요"
        description="삭제되었거나 잘못된 주소일 수 있어요."
        action={
          <Link to="/cats" className="btn btn--primary">
            고양이 목록으로
          </Link>
        }
      />
    );
  }

  const handleSubmit = (values: NewCat) => {
    if (cat) {
      updateCat(cat.id, values);
      navigate(`/cats/${cat.id}`, { replace: true });
      return;
    }

    // 첫 등록이면 CatsProvider가 자동으로 선택된 아이로 잡아준다
    const created = addCat(values);
    navigate(`/cats/${created.id}`, { replace: true });
  };

  return (
    <CatForm
      initialCat={cat}
      submitLabel={cat ? '수정 저장' : '프로필 등록'}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/cats')}
    />
  );
}
