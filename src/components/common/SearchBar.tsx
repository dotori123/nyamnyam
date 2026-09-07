import './SearchBar.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = '검색' }: Props) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon" aria-hidden="true">
        🔍
      </span>
      <input
        type="search"
        className="search-bar__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
        >
          ✕
        </button>
      )}
    </div>
  );
}
