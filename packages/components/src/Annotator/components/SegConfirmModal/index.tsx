import { useKeyPress } from 'ahooks';
import { Button, Card } from 'antd';
import classNames from 'classnames';
import { useLocale } from 'dds-utils/locale';
import { memo, useMemo } from 'react';

import { EObjectType } from '../../constants';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { EditorMode, IAnnotationObject } from '../../type';
import { FloatWrapper } from '../FloatWrapper';

import './index.less';

interface IProps {
  mode: EditorMode;
  isAiAnnotation: boolean;
  latestLabelId: string;
  currObject: IAnnotationObject | undefined;
  onFinishCurrCreate: (labelId: string) => void;
}

const SegConfirmModal: React.FC<IProps> = memo(
  ({ mode, isAiAnnotation, latestLabelId, currObject, onFinishCurrCreate }) => {
    const { localeText } = useLocale();

    const show = useMemo(() => {
      if (mode !== EditorMode.Edit) return false;
      if (
        currObject?.type === EObjectType.Mask ||
        (currObject?.type === EObjectType.Polygon && isAiAnnotation)
      ) {
        return true;
      }
      return false;
    }, [mode, currObject, isAiAnnotation]);

    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.SaveCurrObject].shortcut,
      (event: KeyboardEvent) => {
        if (currObject) {
          event.preventDefault();
          onFinishCurrCreate(latestLabelId);
        }
      },
      {
        exactMatch: true,
      },
    );

    return (
      <FloatWrapper>
        <Card
          className={classNames('dds-annotator-seg-confirm', {
            'dds-annotator-seg-confirm-visible': show,
          })}
          title={
            <div className="title">{localeText('DDSAnnotator.seg.tool')}</div>
          }
        >
          <div className="content">
            <div>{localeText('DDSAnnotator.seg.tool.content')}</div>
            <Button
              type="primary"
              onClick={(event) => {
                event.preventDefault();
                onFinishCurrCreate(latestLabelId);
              }}
            >
              {localeText('DDSAnnotator.confirm')}
            </Button>
          </div>
        </Card>
      </FloatWrapper>
    );
  },
);

export default SegConfirmModal;
