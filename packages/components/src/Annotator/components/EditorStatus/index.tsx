import { memo } from 'react';
import classNames from 'classnames';
import { useLocale } from 'dds-utils/locale';
import { EditorMode } from '../../type';
import { ReactComponent as LabelIcon } from '../../assets/label.svg';
import { ReactComponent as ReviewIcon } from '../../assets/review.svg';
import './index.less';

interface IProps {
  mode: EditorMode;
}

const EditorStatus: React.FC<IProps> = memo(({ mode }) => {
  const { localeText } = useLocale();

  if (mode === EditorMode.View) return null;

  return (
    <div
      className={classNames(
        'dds-annotator-editor-status',
        `dds-annotator-editor-status-${mode}`,
      )}
    >
      {mode === EditorMode.Edit ? (
        <>
          <LabelIcon />
          {localeText('DDSAnnotator.status.labeling')}
        </>
      ) : (
        <>
          <ReviewIcon />
          {localeText('DDSAnnotator.status.reviewing')}
        </>
      )}
    </div>
  );
});

export default EditorStatus;
