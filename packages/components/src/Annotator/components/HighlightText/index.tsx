import React, { useMemo } from 'react';
import { escapeRegExp } from 'lodash';
import { Tag } from 'antd';

import './index.less';

interface IHighlight {
  text: string;
  color: string;
}

interface IProps {
  text: string;
  highlights: IHighlight[];
  onHoverHighlightWord: (text: string) => void;
  onLeaveHighlightWord: () => void;
}

const HighlightText: React.FC<IProps> = ({
  text,
  highlights,
  onHoverHighlightWord,
  onLeaveHighlightWord,
}) => {

  const segments = useMemo(() => {
    const computedSegments: React.ReactNode[] = [];
    const pattern = new RegExp(
      highlights.map(h => `\\b(${escapeRegExp(h.text)})\\b`).join('|'),
      'g'
    );

    const matches = Array.from(text.matchAll(pattern));
    let lastIndex = 0;

    matches.forEach(match => {
      const matchText = match[0];
      const index = match.index ?? 0;

      if (index > lastIndex) {
        computedSegments.push(text.substring(lastIndex, index));
      }

      const highlightConfig = highlights.find(h => h.text === matchText);

      if (highlightConfig) {
        computedSegments.push(
          <Tag
            key={`${index}-${matchText}`}
            color={highlightConfig.color}
            bordered={false}
            onMouseEnter={() => onHoverHighlightWord(matchText)}
            onMouseLeave={onLeaveHighlightWord}
          >
            {matchText}
          </Tag>
        );
      }

      lastIndex = index + matchText.length;
    });

    if (lastIndex < text.length) {
      computedSegments.push(text.substring(lastIndex));
    }

    return computedSegments;
  }, [text, highlights, onHoverHighlightWord, onLeaveHighlightWord]);

  return <div className={'dds-annotator-highlight-text'}>{segments}</div>;
};

export default HighlightText;
