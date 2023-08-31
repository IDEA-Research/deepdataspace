import { useRef } from 'react';

export type compareFunction<T> = (prev: T | undefined, next: T) => boolean;

export default function usePreviousState<T>(
  state: T,
  compare?: compareFunction<T>,
): [T | undefined, () => void] {
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  const needUpdate =
    typeof compare === 'function' ? compare(curRef.current, state) : true;
  if (needUpdate) {
    prevRef.current = curRef.current;
    curRef.current = state;
  }

  const clearPrev = () => {
    prevRef.current = undefined;
  };

  return [prevRef.current, clearPrev];
}
