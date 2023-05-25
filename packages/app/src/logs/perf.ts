import { decamelizeKeys } from 'humps';
import { useRef } from 'react';
import { getRuntimeBaseParams } from '.';
import { postLogs } from './request';

type TStarttimeRecord = Record<string, number>;

export function usePerfRecord(pageview: string) {
  const perfRecordsRef = useRef<TStarttimeRecord>({});

  /** Record the starting point. */
  const startRecord = (...pointNames: string[]) => {
    const records = { ...perfRecordsRef.current };
    const now = Date.now();
    for (let i = 0; i < pointNames.length; i++) {
      records[pointNames[i]] = now;
    }
    perfRecordsRef.current = records;
  };

  /** Report the corresponding tag. */
  const reportRecord = (
    data: { [key: string]: any },
    pointName: string,
    dura: number,
  ) => {
    const payload = {
      ...getRuntimeBaseParams(),
      page_name: pageview,
      event_name: `${pageview}_${pointName}`,
      dura,
      ...decamelizeKeys(data || {}),
    };
    // console.log('>>>> report Perf', payload);
    postLogs(payload);
  };

  /** End the tagging and report the data. */
  const endRecord = (data: { [key: string]: any }, ...pointNames: string[]) => {
    const records = { ...perfRecordsRef.current };
    const now = Date.now();
    for (let i = 0; i < pointNames.length; i++) {
      if (records[pointNames[i]] === undefined) continue;
      const dura = now - records[pointNames[i]];
      delete records[pointNames[i]];
      reportRecord(data, pointNames[i], dura);
    }
    perfRecordsRef.current = records;
  };

  return {
    startRecord,
    endRecord,
  };
}
