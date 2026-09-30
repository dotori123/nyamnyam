import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeedRecord, FoodType } from '../types';
import { useRecords } from '../hooks/useRecords';
import { useCats } from '../hooks/useCats';
import CatSelect from '../components/cat/CatSelect';
import { parseNaverOrders, totalVolume, volumeLabel, type ParsedOrder } from '../utils/orderImport';
import { FOOD_TYPE_OPTIONS } from '../utils/options';
import { formatPrice } from '../utils/format';
import { fixKey, readImportFixes, saveImportFixes } from '../storage/importFixes';
import './ImportPage.scss';

/**
 * 주문내역 붙여넣기 — 한꺼번에 산 사료를 여러 건 한 번에 등록한다 (/import).
 *
 * 1. 쇼핑몰 주문내역을 통째로 복사해 붙여 넣으면 바로 읽는다 (utils/orderImport.ts)
 *    — 목록 화면과 주문 상세 화면 둘 다. 목록 화면은 수량이 없어 직접 고치게 한다
 * 2. 줄마다 등록할지 고르고, 짐작한 브랜드·제품명·맛·종류·구매처·수량을 고친다
 * 3. 전부 "평가 전"으로 저장한다 — 산 직후라 아직 먹여 보지 않았다 (utils/review.ts)
 *
 * 고친 브랜드·제품명은 기억해 뒀다가 같은 상품을 다시 붙여 넣을 때 채운다 (storage/importFixes.ts).
 */

interface Row extends ParsedOrder {
  selected: boolean;
  /** 이미 같은 기록이 있어 보여 기본으로 빼 둔 줄 */
  duplicate: boolean;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { records, addRecord } = useRecords();
  const { selectedCatId } = useCats();

  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [catId, setCatId] = useState(selectedCatId ?? '');

  // 붙여 넣는 순간 읽는다. "읽어 오기" 버튼을 한 번 더 누르게 할 이유가 없다
  const handleText = (value: string) => {
    setText(value);
    const fixes = readImportFixes();
    setRows(
      parseNaverOrders(value).map((order) => {
        const fix = fixes[fixKey(order.title)];
        const row = fix ? { ...order, ...fix } : order;
        const duplicate = isDuplicate(row, records);
        return { ...row, duplicate, selected: !duplicate && !row.canceled };
      }),
    );
  };

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.index === index ? { ...row, ...patch } : row)));

  const chosen = useMemo(() => rows.filter((row) => row.selected), [rows]);
  // 목록 화면을 붙였다면 수량이 없다 — 2개 이상 산 상품은 단가가 틀리게 나온다
  const quantityMissing = rows.some((row) => !row.quantityKnown);

  const handleSubmit = () => {
    for (const row of chosen) {
      addRecord({
        catId: catId || null,
        brand: row.brand.trim(),
        productName: row.productName.trim(),
        flavor: row.flavor.trim(),
        foodType: row.foodType,
        // 옵션 용량 × 수량. 수량을 고쳤다면 고친 값으로
        volume: totalVolume(row),
        // 산 직후라 아직 먹여 보지 않았다
        rating: null,
        stool: null,
        repurchase: null,
        price: row.price,
        currency: 'KRW',
        store: row.store,
        purchasedAt: row.purchasedAt,
        photos: [],
        memo: '',
        tags: [],
      });
    }

    // 짐작과 다르게 고친 것만 기억한다
    const original = parseNaverOrders(text);
    saveImportFixes(
      chosen
        .filter((row) => {
          const guess = original[row.index];
          return guess && (guess.brand !== row.brand.trim() || guess.productName !== row.productName.trim());
        })
        .map((row) => ({ title: row.title, fix: { brand: row.brand.trim(), productName: row.productName.trim() } })),
    );

    navigate('/', { replace: true });
  };

  return (
    <div className="import-page">
      <section className="import-page__intro">
        <p>
          네이버 주문내역 화면을 <strong>통째로 복사</strong>해서 붙여 넣으세요. 상품마다 나눠서
          브랜드·용량·가격·구매일을 채워 드려요.
        </p>
        <p className="import-page__private">
          주문 <strong>상세보기</strong> 화면을 붙이면 수량과 가게 이름까지 들어가서 더 정확해요.
        </p>
        <p className="import-page__private">붙여 넣은 내용은 이 기기 안에서만 읽고, 어디로도 보내지 않아요.</p>
      </section>

      <label className="sr-only" htmlFor="import-text">
        주문내역
      </label>
      <textarea
        id="import-text"
        className="textarea import-page__text"
        value={text}
        onChange={(event) => handleText(event.target.value)}
        placeholder={'구매확정완료\n네이버 N배송\n알모네이쳐 고양이 주식캔 습식사료 참치와 닭고기, 70g, 1개\n8.20. 19:18 주문\n…'}
        rows={6}
      />

      {text.trim() && rows.length === 0 && (
        <p className="field__error" role="status">
          주문을 찾지 못했어요. 주문내역 화면에서 상품명과 "○.○. ○○:○○ 주문" 줄이 함께 복사됐는지 확인해 주세요.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <p className="import-page__found" role="status">
            {rows.length}건을 찾았어요. 브랜드는 상품명 첫 단어로 짐작한 거라 틀릴 수 있어요.
          </p>

          {quantityMissing && (
            <p className="import-page__notice">
              주문 목록 화면에는 <strong>수량</strong>이 안 나와서 모두 1개로 읽었어요. 2개 이상 산 상품은
              수량을 고쳐 주세요. 주문 <strong>상세보기</strong> 화면을 붙여 넣으면 수량과 가게 이름까지 채워져요.
            </p>
          )}

          <div className="field">
            <span className="field__label">어느 아이 사료인가요?</span>
            <CatSelect value={catId} onChange={setCatId} />
          </div>

          <ul className="import-page__rows">
            {rows.map((row) => (
              <li
                key={row.index}
                className={row.selected ? 'import-row' : 'import-row import-row--off'}
              >
                <label className="import-row__pick">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(event) => update(row.index, { selected: event.target.checked })}
                  />
                  <span className="import-row__title">{row.title}</span>
                </label>

                {(row.duplicate || row.canceled) && (
                  <p className="import-row__warn">
                    {row.canceled ? '취소·반품된 주문 같아요.' : '이미 등록한 기록 같아요 (같은 날·같은 가격).'}
                  </p>
                )}

                <div className="import-row__fields">
                  <RowInput label="브랜드" value={row.brand} onChange={(brand) => update(row.index, { brand })} />
                  <RowInput
                    label="제품명"
                    value={row.productName}
                    onChange={(productName) => update(row.index, { productName })}
                  />
                  <RowInput label="맛" value={row.flavor} onChange={(flavor) => update(row.index, { flavor })} />
                  <label className="import-row__field">
                    <span>종류</span>
                    <select
                      className="select"
                      value={row.foodType}
                      onChange={(event) => update(row.index, { foodType: event.target.value as FoodType })}
                    >
                      {FOOD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <RowInput label="구매처" value={row.store} onChange={(store) => update(row.index, { store })} />
                  <label className="import-row__field">
                    <span>수량</span>
                    <input
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={row.quantity}
                      onChange={(event) =>
                        update(row.index, {
                          quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                          quantityKnown: true,
                        })
                      }
                    />
                  </label>
                </div>

                <p className="import-row__meta">
                  {[volumeLabel(row), row.price === null ? null : formatPrice(row.price), shortDate(row.purchasedAt)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>

          <div className="import-page__submit">
            <p className="field__hint">모두 "평가 전"으로 저장돼요. 먹여 본 뒤 기록에서 하트를 눌러 주세요.</p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={handleSubmit}
              disabled={chosen.length === 0}
            >
              {chosen.length}건 등록
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RowInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="import-row__field">
      <span>{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

/** 같은 날 같은 가격으로 같은 제품(또는 브랜드)을 산 기록이 있으면 두 번 붙여 넣은 것으로 본다 */
function isDuplicate(order: ParsedOrder, records: FeedRecord[]): boolean {
  if (!order.purchasedAt || order.price === null) return false;
  const day = order.purchasedAt.slice(0, 10);
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  return records.some(
    (record) =>
      record.purchasedAt?.slice(0, 10) === day &&
      record.price === order.price &&
      (same(record.productName, order.productName) || same(record.brand, order.brand)),
  );
}

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
