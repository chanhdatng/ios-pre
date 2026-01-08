import { useState, useEffect } from 'react';

/**
 * Debounce a value by a given delay
 * @param value - The value to debounce
 * @param ms - Delay in milliseconds (default 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, ms = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debouncedValue;
}
