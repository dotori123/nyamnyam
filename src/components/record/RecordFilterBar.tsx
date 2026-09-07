import { useState } from 'react';
import type { Cat, FoodType, RecordFilters, SortKey } from '../../types';
import { FOOD_TYPE_OPTIONS, SORT_OPTIONS } from '../../utils/options';
import SearchBar from '../common/SearchBar';
import Chip from '../common/Chip';
import CatAvatar from '../cat/CatAvatar';
import './RecordFilterBar.scss';

interface Props {
  filters: RecordFilters;
  cats: Cat[];
  brands: string[];
  flavors: string[];
  resultCount: number;
  activeFilterCount: number;
  onQueryChange: (value: string) => void;
  onSortChange: (sort: SortKey) => void;
  onFoodTypeToggle: (foodType: FoodType) => void;
  onCatToggle: (catId: string | null) => void;
  onBrandToggle: (brand: string) => void;
  onFlavorToggle: (flavor: string) => void;
  onReset: () => void;
}

export default function RecordFilterBar({
  filters,
  cats,
  brands,
  flavors,
  resultCount,
  activeFilterCount,
  onQueryChange,
  onSortChange,
  onFoodTypeToggle,
  onCatToggle,
  onBrandToggle,
  onFlavorToggle,
  onReset,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  /**
   * 고양이가 한 마리뿐이면 고를 게 없으니 필터 줄을 숨긴다.
   * 단 /?cat=<id> 로 들어와 이미 필터가 걸린 경우에는
   * 해제할 수단이 필요하므로 보여준다.
   */
  const showCatFilter = cats.length > 1 || filters.catId !== null;

  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <SearchBar
          value={filters.query}
          onChange={onQueryChange}
          placeholder="제품명, 브랜드, 맛, 메모 검색"
        />
      </div>

      {showCatFilter && (
        <div className="filter-bar__cats">
          <Chip selected={filters.catId === null} onClick={() => onCatToggle(null)}>
            전체
          </Chip>
          {cats.map((cat) => (
            <Chip
              key={cat.id}
              selected={filters.catId === cat.id}
              onClick={() => onCatToggle(cat.id)}
            >
              <CatAvatar cat={cat} size="xs" />
              {cat.name}
            </Chip>
          ))}
        </div>
      )}

      <div className="filter-bar__types">
        {FOOD_TYPE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={filters.foodType === option.value}
            onClick={() => onFoodTypeToggle(option.value)}
          >
            {option.emoji} {option.label}
          </Chip>
        ))}
        <button
          type="button"
          className={expanded ? 'filter-bar__toggle filter-bar__toggle--on' : 'filter-bar__toggle'}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          브랜드·맛
          {activeFilterCount > 0 && <span className="filter-bar__count">{activeFilterCount}</span>}
        </button>
      </div>

      {expanded && (
        <div className="filter-bar__panel">
          <section className="filter-bar__section">
            <h2 className="filter-bar__section-title">브랜드</h2>
            <div className="filter-bar__chips">
              {brands.map((brand) => (
                <Chip
                  key={brand}
                  size="sm"
                  selected={filters.brands.includes(brand)}
                  onClick={() => onBrandToggle(brand)}
                >
                  {brand}
                </Chip>
              ))}
            </div>
          </section>

          <section className="filter-bar__section">
            <h2 className="filter-bar__section-title">맛</h2>
            <div className="filter-bar__chips">
              {flavors.map((flavor) => (
                <Chip
                  key={flavor}
                  size="sm"
                  selected={filters.flavors.includes(flavor)}
                  onClick={() => onFlavorToggle(flavor)}
                >
                  {flavor}
                </Chip>
              ))}
            </div>
          </section>

          {activeFilterCount > 0 && (
            <button type="button" className="filter-bar__reset" onClick={onReset}>
              필터 초기화
            </button>
          )}
        </div>
      )}

      <div className="filter-bar__result">
        <span className="filter-bar__result-count">
          총 <strong>{resultCount}</strong>건
        </span>
        <select
          className="filter-bar__sort"
          value={filters.sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          aria-label="정렬 기준"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
