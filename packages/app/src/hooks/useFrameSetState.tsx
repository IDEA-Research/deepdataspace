import * as React from 'react';
import raf from 'rc-util/lib/raf';

type SetActionType<T> = Partial<T> | ((state: T) => Partial<T>);

export default function useFrameSetState<T extends object>(
  initial: T,
): [T, (newState: SetActionType<T>) => void] {
  const frame = React.useRef(null);
  const [state, setState] = React.useState(initial);

  const queue = React.useRef<SetActionType<T>[]>([]);

  const setFrameState = (newState: SetActionType<T>) => {
    if (frame.current === null) {
      queue.current = [];
      frame.current = raf(() => {
        setState((preState) => {
          let memoState: any = preState;
          queue.current.forEach((queueState) => {
            memoState = { ...memoState, ...queueState };
          });
          frame.current = null;

          return memoState;
        });
      });
    }

    queue.current.push(newState);
  };

  React.useEffect(() => () => frame.current && raf.cancel(frame.current), []);

  return [state, setFrameState];
}
