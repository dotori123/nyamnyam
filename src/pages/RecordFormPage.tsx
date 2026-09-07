import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { NewFeedRecord } from '../types';
import { useRecords } from '../hooks/useRecords';
import RecordForm from '../components/record/RecordForm';
import EmptyState from '../components/common/EmptyState';
import './RecordFormPage.scss';

/**
 * 기록 등록과 수정을 함께 처리한다 (고양이 프로필의 CatFormPage와 같은 구조).
 *
 *  - /new                 빈 폼
 *  - /new?copy=<기록 id>   그 기록을 밑그림 삼아 채운 폼
 *  - /records/:id/edit    그 기록을 고치는 폼
 *
 * `?copy=`가 있는 이유: 같은 사료를 또 사는 일이 잦은데
 * 브랜드·제품명·용량을 매번 다시 치는 게 번거로워서다.
 */
export default function RecordFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRecord, updateRecord, getRecord } = useRecords();

  const editing = id ? getRecord(id) : undefined;

  if (id && !editing) {
    return (
      <EmptyState
        emoji="🙀"
        title="기록을 찾을 수 없어요"
        description="삭제되었거나 잘못된 주소일 수 있어요."
        action={
          <Link to="/" className="btn btn--primary">
            목록으로
          </Link>
        }
      />
    );
  }

  const copyId = id ? null : searchParams.get('copy');
  const source = copyId ? getRecord(copyId) : undefined;

  /**
   * 다시 기록: 제품·구매 정보는 가져오고 **이번에 겪은 일**은 비운다.
   * 만족도·배변·재구매 의향·메모·사진은 이번 급여의 결과라 물려받으면 안 되고,
   * 구매일은 오늘로 넣어 두면 틀린 날짜가 조용히 저장될 수 있어 비워 둔다.
   */
  const template = source
    ? {
        ...source,
        rating: 3 as const,
        stool: 'unknown' as const,
        repurchase: 'maybe' as const,
        purchasedAt: null,
        photos: [],
        memo: '',
      }
    : undefined;

  const handleSubmit = (values: NewFeedRecord) => {
    if (editing) {
      updateRecord(editing.id, values);
      navigate(`/records/${editing.id}`, { replace: true });
      return;
    }

    const record = addRecord(values);
    navigate(`/records/${record.id}`, { replace: true });
  };

  return (
    <>
      {source && (
        <p className="record-form-page__notice">
          <strong>{source.productName}</strong> · 같은 제품으로 새 기록을 만들어요. 평가와 사진,
          메모는 비워 뒀어요.
        </p>
      )}
      <RecordForm
        // 밑그림이 바뀌면 폼을 처음부터 다시 그린다 (초기값만 읽는 폼이라 key가 필요하다)
        key={id ?? copyId ?? 'blank'}
        initialRecord={editing ?? template}
        onSubmit={handleSubmit}
        onCancel={() => navigate(editing ? `/records/${editing.id}` : '/')}
        submitLabel={editing ? '수정 저장' : '기록 저장'}
      />
    </>
  );
}
