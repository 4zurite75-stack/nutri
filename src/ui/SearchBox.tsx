export function SearchBox({ value, onChange, placeholder = 'Buscar' }: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <div className="search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoCorrect="off"
        autoCapitalize="off"
        enterKeyHint="search"
      />
      {value && (
        <button className="search__clear" onClick={() => onChange('')} aria-label="Borrar">
          ×
        </button>
      )}
    </div>
  );
}
