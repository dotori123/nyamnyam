import { useState, type FormEvent } from 'react';
import type {
  FeedRecord,
  FeedRecordFormValues,
  NewFeedRecord,
  Rating,
  VolumeUnit,
} from '../../types';
import {
  FOOD_TYPE_OPTIONS,
  REPURCHASE_OPTIONS,
  STOOL_OPTIONS,
  VOLUME_UNIT_OPTIONS,
} from '../../utils/options';
import { toDateInputValue } from '../../utils/format';
import {
  errorId,
  focusFirstError,
  isFutureDate,
  parseOptionalNumber,
  todayInputValue,
} from '../../utils/validation';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import { useCats } from '../../hooks/useCats';
import Chip from '../common/Chip';
import PhotoPicker from '../common/PhotoPicker';
import CatSelect from '../cat/CatSelect';
import RatingHearts from './RatingHearts';
import './RecordForm.scss';

interface Props {
  /** 수정 모드일 때 초기값 */
  initialRecord?: FeedRecord;
  submitLabel?: string;
  onSubmit: (values: NewFeedRecord) => void;
  onCancel?: () => void;
}

/**
 * @param defaultCatId 신규 등록 시 채워둘 고양이 (프로필 화면에서 선택한 아이)
 */
function toFormValues(record?: FeedRecord, defaultCatId: string | null = null): FeedRecordFormValues {
  return {
    catId: record ? (record.catId ?? '') : (defaultCatId ?? ''),
    brand: record?.brand ?? '',
    productName: record?.productName ?? '',
    flavor: record?.flavor ?? '',
    foodType: record?.foodType ?? 'dry',
    volumeAmount: record?.volume ? String(record.volume.amount) : '',
    volumeUnit: record?.volume?.unit ?? 'g',
    rating: record?.rating ?? 3,
    stool: record?.stool ?? 'unknown',
    repurchase: record?.repurchase ?? 'maybe',
    price: record?.price != null ? String(record.price) : '',
    store: record?.store ?? '',
    purchasedAt: toDateInputValue(record?.purchasedAt ?? null),
    photos: record?.photos ?? [],
    memo: record?.memo ?? '',
    tags: record?.tags.join(', ') ?? '',
  };
}

type FieldId = 'brand' | 'productName' | 'volumeAmount' | 'price' | 'purchasedAt';
type Errors = Partial<Record<FieldId, string>>;

/** 화면에 놓인 순서. 저장 실패 시 이 순서로 첫 오류 칸을 찾아 포커스를 옮긴다 */
const FIELD_ORDER: FieldId[] = ['brand', 'productName', 'volumeAmount', 'price', 'purchasedAt'];

export default function RecordForm({
  initialRecord,
  submitLabel = '기록 저장',
  onSubmit,
  onCancel,
}: Props) {
  const { selectedCatId } = useCats();
  const [values, setValues] = useState<FeedRecordFormValues>(() =>
    toFormValues(initialRecord, selectedCatId),
  );
  const [errors, setErrors] = useState<Errors>({});
  const { photos, addFiles, removePhoto, commit, busy, isFull } = usePhotoPicker(
    initialRecord?.photos ?? [],
  );

  const setValue = <K extends keyof FeedRecordFormValues>(
    key: K,
    value: FeedRecordFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // 고치기 시작하면 그 칸의 오류는 지운다. 타이핑 중에 빨간 글씨가 남아 있으면 거슬린다
    if ((FIELD_ORDER as string[]).includes(key)) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const volume = parseOptionalNumber(values.volumeAmount, '용량');
    const priceField = parseOptionalNumber(values.price, '가격');

    const nextErrors: Errors = {};
    if (!values.brand.trim()) nextErrors.brand = '브랜드를 입력해 주세요.';
    if (!values.productName.trim()) nextErrors.productName = '제품명을 입력해 주세요.';
    if (volume.error) nextErrors.volumeAmount = volume.error;
    if (priceField.error) nextErrors.price = priceField.error;
    if (isFutureDate(values.purchasedAt)) {
      nextErrors.purchasedAt = '구매일은 오늘 이후로 고를 수 없어요.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(FIELD_ORDER, nextErrors);
      return;
    }

    const record: NewFeedRecord = {
      catId: values.catId || null,
      brand: values.brand.trim(),
      productName: values.productName.trim(),
      flavor: values.flavor.trim(),
      foodType: values.foodType,
      volume: volume.value === null ? null : { amount: volume.value, unit: values.volumeUnit },
      rating: values.rating,
      stool: values.stool,
      repurchase: values.repurchase,
      price: priceField.value,
      currency: 'KRW',
      store: values.store.trim(),
      purchasedAt: values.purchasedAt ? new Date(values.purchasedAt).toISOString() : null,
      photos,
      memo: values.memo.trim(),
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean),
    };

    // blob URL 소유권을 저장된 기록으로 넘긴다 (unmount 시 revoke 방지)
    commit();
    onSubmit(record);
  };

  return (
    <form className="record-form" onSubmit={handleSubmit} noValidate>
      <section className="record-form__section">
        <h2 className="record-form__section-title">어느 아이 기록인가요?</h2>
        <CatSelect value={values.catId} onChange={(catId) => setValue('catId', catId)} />
      </section>

      <section className="record-form__section">
        <h2 className="record-form__section-title">제품 정보</h2>

        <div className="field">
          <label className="field__label field__label--required" htmlFor="brand">
            브랜드
          </label>
          <input
            id="brand"
            className="input"
            value={values.brand}
            onChange={(event) => setValue('brand', event.target.value)}
            placeholder="예: 지위픽, 로얄캐닌"
            aria-invalid={Boolean(errors.brand)}
            aria-describedby={errors.brand ? errorId('brand') : undefined}
          />
          {errors.brand && (
            <p className="field__error" id={errorId('brand')}>
              {errors.brand}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label field__label--required" htmlFor="productName">
            제품명
          </label>
          <input
            id="productName"
            className="input"
            value={values.productName}
            onChange={(event) => setValue('productName', event.target.value)}
            placeholder="예: 에어드라이 캣푸드"
            aria-invalid={Boolean(errors.productName)}
            aria-describedby={errors.productName ? errorId('productName') : undefined}
          />
          {errors.productName && (
            <p className="field__error" id={errorId('productName')}>
              {errors.productName}
            </p>
          )}
        </div>

        <div className="field">
          <span className="field__label">종류</span>
          <div className="record-form__chips">
            {FOOD_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={values.foodType === option.value}
                onClick={() => setValue('foodType', option.value)}
              >
                {option.emoji} {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="record-form__row">
          <div className="field">
            <label className="field__label" htmlFor="flavor">
              맛
            </label>
            <input
              id="flavor"
              className="input"
              value={values.flavor}
              onChange={(event) => setValue('flavor', event.target.value)}
              placeholder="예: 참치"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="volumeAmount">
              용량
            </label>
            <div className="record-form__volume">
              <input
                id="volumeAmount"
                className="input"
                inputMode="decimal"
                value={values.volumeAmount}
                onChange={(event) => setValue('volumeAmount', event.target.value)}
                placeholder="400"
                aria-invalid={Boolean(errors.volumeAmount)}
                aria-describedby={errors.volumeAmount ? errorId('volumeAmount') : undefined}
              />
              <select
                className="select record-form__unit"
                value={values.volumeUnit}
                onChange={(event) => setValue('volumeUnit', event.target.value as VolumeUnit)}
                aria-label="용량 단위"
              >
                {VOLUME_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.volumeAmount && (
              <p className="field__error" id={errorId('volumeAmount')}>
                {errors.volumeAmount}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="record-form__section">
        <h2 className="record-form__section-title">먹은 후기</h2>

        <div className="field">
          <span className="field__label">만족도</span>
          <RatingHearts
            value={values.rating}
            onChange={(rating: Rating) => setValue('rating', rating)}
            size="lg"
            showValue
          />
        </div>

        <div className="field">
          <span className="field__label">배변 상태</span>
          <div className="record-form__chips">
            {STOOL_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={values.stool === option.value}
                onClick={() => setValue('stool', option.value)}
              >
                {option.emoji} {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">재구매 의향</span>
          <div className="record-form__chips">
            {REPURCHASE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={values.repurchase === option.value}
                onClick={() => setValue('repurchase', option.value)}
              >
                {option.emoji} {option.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="record-form__section">
        <h2 className="record-form__section-title">구매 정보</h2>

        <div className="record-form__row">
          <div className="field">
            <label className="field__label" htmlFor="price">
              가격 (원)
            </label>
            <input
              id="price"
              className="input"
              inputMode="numeric"
              value={values.price}
              onChange={(event) => setValue('price', event.target.value)}
              placeholder="38000"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? errorId('price') : undefined}
            />
            {errors.price && (
              <p className="field__error" id={errorId('price')}>
                {errors.price}
              </p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="store">
              구매처
            </label>
            <input
              id="store"
              className="input"
              value={values.store}
              onChange={(event) => setValue('store', event.target.value)}
              placeholder="예: 쿠팡"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="purchasedAt">
            구매일
          </label>
          <input
            id="purchasedAt"
            type="date"
            className="input"
            value={values.purchasedAt}
            onChange={(event) => setValue('purchasedAt', event.target.value)}
            max={todayInputValue()}
            aria-invalid={Boolean(errors.purchasedAt)}
            aria-describedby={errors.purchasedAt ? errorId('purchasedAt') : undefined}
          />
          {errors.purchasedAt && (
            <p className="field__error" id={errorId('purchasedAt')}>
              {errors.purchasedAt}
            </p>
          )}
        </div>
      </section>

      <section className="record-form__section">
        <h2 className="record-form__section-title">사진</h2>
        <PhotoPicker
          photos={photos}
          onAddFiles={addFiles}
          onRemove={removePhoto}
          isFull={isFull}
          busy={busy}
        />
      </section>

      <section className="record-form__section">
        <h2 className="record-form__section-title">메모</h2>

        <div className="field">
          <label className="sr-only" htmlFor="memo">
            메모
          </label>
          <textarea
            id="memo"
            className="textarea"
            value={values.memo}
            onChange={(event) => setValue('memo', event.target.value)}
            placeholder="기호성, 알갱이 크기, 급여 방법 등 다음에 참고할 내용을 적어두세요."
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="tags">
            태그
          </label>
          <input
            id="tags"
            className="input"
            value={values.tags}
            onChange={(event) => setValue('tags', event.target.value)}
            placeholder="가성비, 그레인프리"
          />
          <p className="field__hint">쉼표로 구분해서 입력해 주세요.</p>
        </div>
      </section>

      <div className="record-form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn--primary record-form__submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
