import { useCallback, useState } from 'react';
import { DraftFunction, Updater, useImmer } from 'use-immer';
import { cloneDeep, isEqual } from 'lodash';
import { DrawData } from '../type';

export interface HistoryItem {
  drawData: DrawData;
  clientSize: ISize;
}

interface IProps {
  clientSize: ISize;
  setDrawData: Updater<DrawData>;
  onAutoSave?: (item: HistoryItem) => void;
}

const useHistory = ({ clientSize, onAutoSave, setDrawData }: IProps) => {
  const [historyQueue, setHistoryQueue] = useImmer<HistoryItem[]>([]);
  const [currentIndex, setCurrIndex] = useState(0);
  const maxCacheSize = 20;

  /**
   * Undo the last action
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrIndex((prevIndex) => prevIndex - 1);
      onAutoSave?.(historyQueue[currentIndex - 1]);
      return historyQueue[currentIndex - 1];
    }
    return null;
  }, [currentIndex, historyQueue]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (currentIndex < historyQueue.length - 1) {
      setCurrIndex((prevIndex) => prevIndex + 1);
      onAutoSave?.(historyQueue[currentIndex + 1]);
      return historyQueue[currentIndex + 1];
    }
    return null;
  }, [currentIndex, historyQueue]);

  /**
   * Update the history queue with the new objects
   */
  const updateHistory = useCallback(
    (item: HistoryItem) => {
      setHistoryQueue((queue) => {
        if (queue[currentIndex] && isEqual(item, queue[currentIndex])) {
          return queue;
        }
        queue.splice(currentIndex + 1);
        queue.push(item);
        if (queue.length > maxCacheSize) {
          queue.shift();
        }
        setCurrIndex(queue.length - 1);
      });
      onAutoSave?.(item);
    },
    [currentIndex, maxCacheSize],
  );

  const clearHistory = useCallback(() => {
    setHistoryQueue([]);
  }, []);

  const setDrawDataWithHistory: Updater<DrawData> = (
    updater: DrawData | DraftFunction<DrawData>,
  ) => {
    if (typeof updater === 'function') {
      setDrawData((s) => {
        updater(s);
        updateHistory(
          cloneDeep({
            drawData: s,
            clientSize,
          }),
        );
      });
    } else {
      setDrawData(updater);
      updateHistory(
        cloneDeep({
          drawData: updater,
          clientSize,
        }),
      );
    }
  };

  return {
    updateHistory,
    undo,
    redo,
    clearHistory,
    setDrawDataWithHistory,
    hadChangeRecord: historyQueue.length > 1 && currentIndex !== 0,
  };
};

export default useHistory;
