import { useState, useEffect } from 'react';

// Custom hook that uses localStorage as primary storage
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// Simple localStorage-based replacement for useKV
export function useKVFallback(key: string, defaultValue: string) {
  const [value, setValue] = useLocalStorage(key, defaultValue);
  
  return [value, setValue] as const;
}
