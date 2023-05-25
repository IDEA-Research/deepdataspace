import * as Sentry from '@sentry/react';
import ReactGA from 'react-ga4';

// Analytics tracking
if (process.env.GA_KEY) {
  // ga key insert
  ReactGA.initialize(process.env.GA_KEY);
}
if (process.env.BAIDU_KEY) {
  // baidu script insert
  (function () {
    let hm = document.createElement('script');
    hm.src = `https://hm.baidu.com/hm.js?${process.env.BAIDU_KEY}`;
    let s = document.getElementsByTagName('script')[0];
    s?.parentNode?.insertBefore(hm, s);
  })();
}

// Sentry performance & error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    release: process.env.TAG_VERSION,
    environment: process.env.UMI_ENV,
    dsn: process.env.SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,
  });
}
