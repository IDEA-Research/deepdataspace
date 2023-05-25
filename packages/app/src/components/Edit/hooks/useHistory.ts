import { DATA } from '@/services/type';
import { useCallback, useState } from 'react';
import { useImmer } from 'use-immer';

const useHistory = (initialState: DATA.BaseObject[]) => {
  const [historyQueue, setHistoryQueue] = useImmer<DATA.BaseObject[][]>([
    initialState,
  ]);
  const [currentIndex, setCurrIndex] = useState(0);
  const maxCacheSize = 20;

  /**
   * Undo the last action
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrIndex((prevIndex) => prevIndex - 1);
      return historyQueue[currentIndex - 1];
    }
    return null;
  }, [currentIndex]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (currentIndex < historyQueue.length - 1) {
      setCurrIndex((prevIndex) => prevIndex + 1);
      return historyQueue[currentIndex + 1];
    }
    return null;
  }, [currentIndex, historyQueue.length]);

  /**
   * Update the history queue with the new objects
   */
  const updateHistory = useCallback(
    (annotations: DATA.BaseObject[]) => {
      setHistoryQueue((queue) => {
        const newQueue = queue.slice(0, currentIndex + 1);
        newQueue.push(annotations);
        if (newQueue.length > maxCacheSize) {
          newQueue.shift();
        }
        setCurrIndex(newQueue.length - 1);
        return newQueue;
      });
    },
    [currentIndex, maxCacheSize],
  );

  const clearHistory = useCallback(() => {
    setHistoryQueue([]);
  }, []);

  return {
    updateHistory,
    undo,
    redo,
    clearHistory,
  };
};

export default useHistory;
