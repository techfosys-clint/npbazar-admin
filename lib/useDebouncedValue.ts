import { useEffect, useState } from 'react';

// Returns `value`, but updated only after it stops changing for `delayMs` —
// used to turn a search input into a live, no-Enter-needed search without
// firing a request on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
