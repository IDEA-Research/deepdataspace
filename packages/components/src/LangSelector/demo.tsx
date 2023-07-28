import React, { useState } from 'react';
import { LangSelector, LocaleLang } from 'dds-components';

export default () => {
  const [locale, setLocale] = useState<LocaleLang>(LocaleLang.zh);
  const getLocale = () => locale;
  return (
    <LangSelector getLocale={getLocale} setLocale={setLocale} />
  );
};
