import React, { useState } from 'react';
import { LangSelector, LocaleLang } from 'dds-component';

export default () => {
  const [locale, setLocale] = useState<LocaleLang>(LocaleLang.zh);
  const getLocale = () => locale;
  return (
    <LangSelector getLocale={getLocale} setLocale={setLocale} />
  );
};
