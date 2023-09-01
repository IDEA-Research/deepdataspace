import { useState } from 'react';
import {
  default as LangSelector,
  LocaleLang as LocaleLang,
} from '@/LangSelector';

export default () => {
  const [locale, setLocale] = useState<LocaleLang>(LocaleLang.zh);
  const getLocale = () => locale;
  return <LangSelector getLocale={getLocale} setLocale={setLocale} />;
};
