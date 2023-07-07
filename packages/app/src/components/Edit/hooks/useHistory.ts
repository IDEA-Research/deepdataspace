import { useState } from 'react';
import { DraftFunction, Updater, useImmer } from 'use-immer';
import { cloneDeep, isEqual } from 'lodash';
import { scaleDrawData, translateObjectsToAnnotations } from '@/utils/compute';
import { DATA } from '@/services/type';
import { DrawData } from '../type';

export interface HistoryItem {
  drawData: DrawData;
  clientSize: ISize;
}

interface IProps {
  clientSize: ISize;
  naturalSize: ISize;
  setDrawData: Updater<DrawData>;
  onAutoSave?: (annotations: DATA.BaseObject[]) => void;
}

const useHistory = ({
  clientSize,
  naturalSize,
  onAutoSave,
  setDrawData,
}: IProps) => {
  const [historyQueue, setHistoryQueue] = useImmer<HistoryItem[]>([]);
  const [currentIndex, setCurrIndex] = useState(0);
  const maxCacheSize = 20;

  const autoSave = (item: HistoryItem) => {
    const annotations = translateObjectsToAnnotations(
      item.drawData.objectList,
      naturalSize,
      item.clientSize,
      true,
    );
    if (onAutoSave) onAutoSave(annotations);
  };

  /**
   * Undo the last action
   */
  const undo = () => {
    if (currentIndex > 0) {
      setCurrIndex((prevIndex) => prevIndex - 1);
      const record = historyQueue[currentIndex - 1];
      const updateDrawData = scaleDrawData(
        record.drawData,
        record.clientSize,
        clientSize,
      );
      setDrawData(updateDrawData);
      autoSave(record);
    }
  };

  /**
   * Redo the last undone action
   */
  const redo = () => {
    if (currentIndex < historyQueue.length - 1) {
      setCurrIndex((prevIndex) => prevIndex + 1);
      const record = historyQueue[currentIndex + 1];
      const updateDrawData = scaleDrawData(
        record.drawData,
        record.clientSize,
        clientSize,
      );
      setDrawData(updateDrawData);
      autoSave(record);
    }
  };

  /**
   * Update the history queue with the new objects
   */
  const updateHistory = (item: HistoryItem) => {
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
    autoSave(item);
  };

  const clearHistory = () => {
    setHistoryQueue([]);
  };

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
