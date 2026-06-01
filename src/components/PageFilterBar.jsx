// Shared filter bar shell used by all list/report pages.
// Import FilterSelect, SearchInput, and the default PageFilterBar wrapper.

export function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-default-200 rounded-lg ps-3 pe-7 py-2 text-sm bg-white text-default-700 cursor-pointer focus:outline-none focus:border-primary min-w-[100px]"
      >
        {options.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-default-400 text-xs">▾</span>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <svg className="absolute start-2.5 top-1/2 -translate-y-1/2 text-default-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-default-200 rounded-lg ps-8 pe-3 py-2 text-sm bg-white text-default-700 focus:outline-none focus:border-primary w-44"
      />
    </div>
  );
}

// PageFilterBar — leen-card wrapper with funnel icon on the left.
// Pass filter controls as children; pass search/toggles as `right` prop.
export default function PageFilterBar({ children, right }) {
  return (
    <div className="leen-card rounded-2xl bg-white shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <svg className="text-default-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        {children}
        {right && <div className="ms-auto flex items-center gap-2 flex-wrap">{right}</div>}
      </div>
    </div>
  );
}
