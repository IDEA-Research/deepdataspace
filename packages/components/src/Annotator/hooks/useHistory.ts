import { cloneDeep, isEqual } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { DraftFunction, Updater, useImmer } from 'use-immer';

import { BaseObject, DrawData, VideoFramesData } from '../type';
import {
  convertFrameObjectsIntoFramesObjects,
  scaleDrawData,
  scaleFramesObjects,
} from '../utils/compute';

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
  const hadChangeRecordRef = useRef(false);
  const [historyQueue, setHistoryQueue] = useImmer<HistoryItem[]>([]);
  const [currentIndex, setCurrIndex] = useState(0);
  const maxCacheSize = 20;

  const flagSaved = () => {
    hadChangeRecordRef.current = false;
  };

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
      // video
      setFramesData?.((s) => {
        if (record.framesData) {
          s.activeIndex = record.framesData?.activeIndex;
          s.objects = scaleFramesObjects(
            record.framesData.objects,
            record.clientSize,
            clientSize,
          );
        }
      });

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
      setCurrIndex((prevIndex) => {
        hadChangeRecordRef.current = Boolean(
          historyQueue.length > 1 && prevIndex - 1 !== 0,
        );
        return prevIndex - 1;
      });
      updateCurrentRecord(historyQueue[currentIndex - 1]);
    }
  }, [currentIndex, historyQueue, updateCurrentRecord]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (currentIndex < historyQueue.length - 1) {
      setCurrIndex((prevIndex) => {
        hadChangeRecordRef.current = Boolean(
          historyQueue.length > 1 && prevIndex + 1 !== 0,
        );
        return prevIndex + 1;
      });
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
    const item = cloneDeep({
      drawData,
      clientSize,
      framesData: theframesData || framesData,
    });
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

      if (
        !theframesData &&
        item.framesData &&
        setFramesData &&
        item.drawData.objectList.length &&
        !isEqual(
          item.drawData.objectList,
          queue[currentIndex]?.drawData?.objectList,
        )
      ) {
        // video && not update framesData && single frame objectList changed
        // sync frame objectlist change to every frame
        item.framesData.objects = convertFrameObjectsIntoFramesObjects(
          item.drawData.objectList,
          item.framesData.objects,
          item.framesData.list.length,
          item.framesData.activeIndex,
          naturalSize,
        );
        setFramesData((s) => {
          s.objects = cloneDeep(item.framesData!.objects);
        });
      }
      queue.splice(currentIndex + 1);
      queue.push(item);
      if (queue.length > maxCacheSize) {
        queue.shift();
      }
      setCurrIndex(queue.length - 1);

      hadChangeRecordRef.current = Boolean(
        queue.length > 1 && queue.length - 1 !== 0,
      );
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
    flagSaved,
    hadChangeRecord: hadChangeRecordRef.current,
  };
};

export default useHistory;
