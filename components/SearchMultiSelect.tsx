'use client';

import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export interface PickerOption {
  _id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  selected: PickerOption[];
  onChange: (opts: PickerOption[]) => void;
  fetchOptions: (query: string) => Promise<PickerOption[]>;
  /** Cap how many can be selected; omit for unlimited. */
  max?: number;
}

/** Debounced search box + dropdown results + removable chips for the selection. */
export default function SearchMultiSelect({ label, placeholder, selected, onChange, fetchOptions, max }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const runSearch = (q: string) => {
    setQuery(q);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await fetchOptions(q));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const isSelected = (id: string) => selected.some((s) => s._id === id);
  const toggle = (opt: PickerOption) => {
    if (isSelected(opt._id)) {
      onChange(selected.filter((s) => s._id !== opt._id));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, opt]);
    }
  };

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>}
      <div ref={boxRef} className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            value={query}
            onFocus={() => runSearch(query)}
            onChange={(e) => runSearch(e.target.value)}
            placeholder={placeholder || 'Search...'}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        {open && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
            {loading ? (
              <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-400">{query ? 'No matches' : 'Type to search'}</p>
            ) : (
              results.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => toggle(r)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                    isSelected(r._id) ? 'bg-primary/5 text-primary' : 'text-zinc-700'
                  }`}
                >
                  <span className="truncate">
                    {r.label}
                    {r.sublabel && <span className="ml-1.5 text-xs text-zinc-400">{r.sublabel}</span>}
                  </span>
                  {isSelected(r._id) && <span className="text-xs font-semibold">✓</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s._id} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
              {s.label}
              <button type="button" onClick={() => toggle(s)} className="text-zinc-400 hover:text-red-500">
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
