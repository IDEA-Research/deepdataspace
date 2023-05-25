import { decamelizeKeys } from 'humps';
import { ClientJS } from 'clientjs';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { postLogs } from './request';

let track_idx = 0;

const baseParams = {
  useragent: window.navigator.userAgent,
  fingerprint: new ClientJS().getFingerprint(),
  trace_uuid: uuidv4(),
};

export const getRuntimeBaseParams = () => ({
  ...baseParams,
  page_url: window.location.href,
  referrer_url: document.referrer,
  client_time: Date.now(),
  track_idx: track_idx++,
});

export const reportPv = (name: string) => {
  postLogs({
    ...getRuntimeBaseParams(),
    pageview: name,
  });
};

export const reportEvent = (name: string, params?: { [key: string]: any }) => {
  postLogs({
    ...getRuntimeBaseParams(),
    event_name: name,
    ...decamelizeKeys(params || {}),
  });
};

export const usePageReport = (pageview: string) => {
  const [enterPageTime, setEnterPageTime] = useState(0);

  const reportPageView = () => {
    setEnterPageTime(Date.now());
    reportPv(pageview);
  };

  const reportPageDataLoaded = (params: { [key: string]: any }) => {
    if (!enterPageTime) return;
    reportEvent(`page_${pageview}_loaded`, {
      ...params,
      load_time: Date.now() - enterPageTime,
    });
    setEnterPageTime(0);
  };

  return {
    reportPageView,
    reportPageDataLoaded,
  };
};

export default {
  reportPv,
  reportEvent,
  usePageReport,
};
