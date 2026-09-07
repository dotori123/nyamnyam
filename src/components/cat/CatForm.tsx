import { useState, type FormEvent } from 'react';
import type { Cat, CatFormValues, CatGender, NewCat } from '../../types';
import { GENDER_OPTIONS } from '../../utils/options';
import { toDateInputValue } from '../../utils/format';
import {
  errorId,
  focusFirstError,
  isFutureDate,
  parseOptionalNumber,
  todayInputValue,
} from '../../utils/validation';
import { usePhotoPicker, MAX_PROFILE_PHOTOS } from '../../hooks/usePhotoPicker';
import Chip from '../common/Chip';
import PhotoPicker from '../common/PhotoPicker';
import './CatForm.scss';

interface Props {
  /** 수정 모드일 때 초기값 */
  initialCat?: Cat;
  submitLabel?: string;
  onSubmit: (values: NewCat) => void;
  onCancel?: () => void;
}

function toFormValues(cat?: Cat): CatFormValues {
  return {
    name: cat?.name ?? '',
    photo: cat?.photo ?? null,
    birthday: toDateInputValue(cat?.birthday ?? null),
    breed: cat?.breed ?? '',
    gender: cat?.gender ?? 'unknown',
    weightKg: cat?.weightKg != null ? String(cat.weightKg) : '',
    memo: cat?.memo ?? '',
  };
}

type FieldId = 'catName' | 'birthday' | 'weightKg';
type Errors = Partial<Record<FieldId, string>>;

/** 화면에 놓인 순서. 저장 실패 시 이 순서로 첫 오류 칸을 찾아 포커스를 옮긴다 */
const FIELD_ORDER: FieldId[] = ['catName', 'birthday', 'weightKg'];

/** 폼 값의 키와 input id가 다른 것만 맞춰 준다 (name → catName) */
const FIELD_ID: Partial<Record<keyof CatFormValues, FieldId>> = {
  name: 'catName',
  birthday: 'birthday',
  weightKg: 'weightKg',
};

export default function CatForm({
  initialCat,
  submitLabel = '프로필 저장',
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<CatFormValues>(() => toFormValues(initialCat));
  const [errors, setErrors] = useState<Errors>({});

  // 프로필 사진은 1장만. 기록 폼과 같은 훅/컴포넌트를 재사용한다.
  const { photos, addFiles, removePhoto, commit, busy, isFull } = usePhotoPicker(
    initialCat?.photo ? [initialCat.photo] : [],
    MAX_PROFILE_PHOTOS,
  );

  const setValue = <K extends keyof CatFormValues>(key: K, value: CatFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // 고치기 시작하면 그 칸의 오류는 지운다
    const fieldId = FIELD_ID[key];
    if (fieldId) setErrors((prev) => ({ ...prev, [fieldId]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const weight = parseOptionalNumber(values.weightKg, '체중');

    const nextErrors: Errors = {};
    if (!values.name.trim()) nextErrors.catName = '이름을 입력해 주세요.';
    if (isFutureDate(values.birthday)) nextErrors.birthday = '생일은 오늘 이후로 고를 수 없어요.';
    if (weight.error) nextErrors.weightKg = weight.error;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(FIELD_ORDER, nextErrors);
      return;
    }

    const cat: NewCat = {
      name: values.name.trim(),
      photo: photos[0] ?? null,
      birthday: values.birthday ? new Date(values.birthday).toISOString() : null,
      breed: values.breed.trim(),
      gender: values.gender,
      weightKg: weight.value,
      memo: values.memo.trim(),
    };

    // blob URL 소유권을 저장된 프로필로 넘긴다 (unmount 시 revoke 방지)
    commit();
    onSubmit(cat);
  };

  return (
    <form className="cat-form" onSubmit={handleSubmit} noValidate>
      <section className="cat-form__section">
        <h2 className="cat-form__section-title">프로필 사진</h2>
        <PhotoPicker
          photos={photos}
          onAddFiles={addFiles}
          onRemove={removePhoto}
          isFull={isFull}
          busy={busy}
          max={MAX_PROFILE_PHOTOS}
        />
      </section>

      <section className="cat-form__section">
        <h2 className="cat-form__section-title">기본 정보</h2>

        <div className="field">
          <label className="field__label field__label--required" htmlFor="catName">
            이름
          </label>
          <input
            id="catName"
            className="input"
            value={values.name}
            onChange={(event) => setValue('name', event.target.value)}
            placeholder="예: 나비"
            aria-invalid={Boolean(errors.catName)}
            aria-describedby={errors.catName ? errorId('catName') : undefined}
          />
          {errors.catName && (
            <p className="field__error" id={errorId('catName')}>
              {errors.catName}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="birthday">
            생일
          </label>
          <input
            id="birthday"
            type="date"
            className="input"
            value={values.birthday}
            onChange={(event) => setValue('birthday', event.target.value)}
            max={todayInputValue()}
            aria-invalid={Boolean(errors.birthday)}
            aria-describedby={errors.birthday ? errorId('birthday') : undefined}
          />
          {errors.birthday ? (
            <p className="field__error" id={errorId('birthday')}>
              {errors.birthday}
            </p>
          ) : (
            <p className="field__hint">입력하면 나이가 자동으로 계산돼요.</p>
          )}
        </div>

        <div className="field">
          <span className="field__label">성별</span>
          <div className="cat-form__chips">
            {GENDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={values.gender === option.value}
                onClick={() => setValue('gender', option.value as CatGender)}
              >
                {option.emoji} {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="cat-form__row">
          <div className="field">
            <label className="field__label" htmlFor="breed">
              품종
            </label>
            <input
              id="breed"
              className="input"
              value={values.breed}
              onChange={(event) => setValue('breed', event.target.value)}
              placeholder="예: 코리안숏헤어"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="weightKg">
              체중 (kg)
            </label>
            <input
              id="weightKg"
              className="input"
              inputMode="decimal"
              value={values.weightKg}
              onChange={(event) => setValue('weightKg', event.target.value)}
              placeholder="4.2"
              aria-invalid={Boolean(errors.weightKg)}
              aria-describedby={errors.weightKg ? errorId('weightKg') : undefined}
            />
            {errors.weightKg && (
              <p className="field__error" id={errorId('weightKg')}>
                {errors.weightKg}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="cat-form__section">
        <h2 className="cat-form__section-title">특이사항</h2>

        <div className="field">
          <label className="sr-only" htmlFor="catMemo">
            특이사항
          </label>
          <textarea
            id="catMemo"
            className="textarea"
            value={values.memo}
            onChange={(event) => setValue('memo', event.target.value)}
            placeholder="알레르기, 지병, 식성 등 사료 고를 때 참고할 내용을 적어두세요."
          />
        </div>
      </section>

      <div className="cat-form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn--primary cat-form__submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
