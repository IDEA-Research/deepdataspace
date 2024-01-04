import { useCallback, useState } from 'react';
import { DraftFunction, Updater, useImmer } from 'use-immer';
import { cloneDeep, isEqual } from 'lodash';
import { scaleDrawData, scaleFramesObjects } from '../utils/compute';
import { BaseObject, DrawData, VideoFramesData } from '../type';

export interface HistoryItem {
  drawData: DrawData;
  framesData?: VideoFramesData;
  clientSize: ISize;
}

interface IProps {
  clientSize: ISize;
  naturalSize: ISize;
  framesData?: VideoFramesData;
  setFramesData?: Updater<VideoFramesData>;
  setDrawData: Updater<DrawData>;
  onAutoSave?: (annotations: BaseObject[], naturalSize: ISize) => void;
  translateObject?: (object: any) => any;
}

const useHistory = ({
  clientSize,
  naturalSize,
  onAutoSave,
  setDrawData,
  translateObject,
  framesData,
  setFramesData,
}: IProps) => {
  const [historyQueue, setHistoryQueue] = useImmer<HistoryItem[]>([]);
  const [currentIndex, setCurrIndex] = useState(0);
  const maxCacheSize = 20;

  const autoSave = (item: HistoryItem) => {
    if (onAutoSave) {
      const annotations = item.drawData.objectList.map(
        (obj) => translateObject?.(obj) || {},
      );
      onAutoSave(annotations, naturalSize);
    }
  };

  const updateCurrentRecord = useCallback(
    (record: HistoryItem) => {
      if (record.framesData) {
        setFramesData?.({
          ...record.framesData,
          objects: scaleFramesObjects(
            record.framesData.objects,
            record.clientSize,
            clientSize,
          ),
        });
      }
      const updateDrawData = scaleDrawData(
        record.drawData,
        record.clientSize,
        clientSize,
      );
      setDrawData(updateDrawData);
      autoSave(record);
    },
    [clientSize.width, clientSize.height],
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrIndex((prevIndex) => prevIndex - 1);
      updateCurrentRecord(historyQueue[currentIndex - 1]);
    }
  }, [currentIndex, historyQueue, updateCurrentRecord]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (currentIndex < historyQueue.length - 1) {
      setCurrIndex((prevIndex) => prevIndex + 1);
      updateCurrentRecord(historyQueue[currentIndex + 1]);
    }
  }, [currentIndex, historyQueue, updateCurrentRecord]);

  /**
   * Update the history queue with the new objects
   */
  const updateHistory = (
    drawData: DrawData,
    theframesData?: VideoFramesData,
  ) => {
    const item = {
      drawData,
      clientSize,
      framesData: theframesData || framesData,
    };
    setHistoryQueue((queue) => {
      if (queue[currentIndex] && isEqual(item, queue[currentIndex])) {
        return queue;
      }
      if (
        currentIndex === 0 &&
        isEqual(item.drawData, queue[currentIndex]?.drawData)
      ) {
        // fix to change image current render
        return queue;
      }
      // console.log('>>> updata history', item.drawData, framesData);
      queue.splice(currentIndex + 1);
      queue.push(item);
      if (queue.length > maxCacheSize) {
        queue.shift();
      }
      setCurrIndex(queue.length - 1);
    });
    autoSave(item);
  };

  const clearHistory = useCallback(() => {
    setHistoryQueue([]);
  }, []);

  const setDrawDataWithHistory: Updater<DrawData> = (
    updater: DrawData | DraftFunction<DrawData>,
  ) => {
    if (typeof updater === 'function') {
      setDrawData((s) => {
        updater(s);
        updateHistory(cloneDeep(s));
      });
    } else {
      setDrawData(updater);
      updateHistory(cloneDeep(updater));
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
