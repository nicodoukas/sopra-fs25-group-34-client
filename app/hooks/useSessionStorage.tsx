import { useEffect, useState } from "react";

interface SessionStorage<T> {
  value: T;
  set: (newVal: T) => void;
  clear: () => void;
}
/**
@param key
@param defaultValue
@returns
 */
export default function useSessionStorage<T>(
  key: string,
  defaultValue: T,
): SessionStorage<T> {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window == "undefined") return;
    try {
      const stored = globalThis.sessionStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}:`, error);
    }
  }, [key]);

  const set = (newVal: T) => {
    setValue(newVal);
    if (typeof window !== "undefined") {
      globalThis.sessionStorage.setItem(key, JSON.stringify(newVal));
    }
  };

  const clear = () => {
    setValue(defaultValue);
    if (typeof window !== "undefined") {
      globalThis.sessionStorage.removeItem(key);
    }
  };

  return { value, set, clear };
}
