import { DownCircleOutlined, UpCircleOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import classNames from 'classnames';
import { useLocale } from 'dds-utils/locale';
import { memo, useMemo, useState } from 'react';
import { Updater } from 'use-immer';

import {
  EElementType,
  EObjectType,
  KEYPOINTS_VISIBLE_TYPE,
} from '../../constants';
import { EditState, EditorMode, IAnnotationObject } from '../../type';
import { FloatWrapper } from '../FloatWrapper';
import PointItem from '../PointItem';

import './index.less';

interface IProps {
  mode: EditorMode;
  isAiAnnotation: boolean;
  currObject: IAnnotationObject | undefined;
  currObjectIndex: number;
  focusObjectIndex: number;
  focusEleType: EElementType;
  focusEleIndex: number;
  onChangePointVisible: (
    pointIndex: number,
    visible: KEYPOINTS_VISIBLE_TYPE,
  ) => void;
  setEditState: Updater<EditState>;
}

const PointsEditModal: React.FC<IProps> = memo(
  ({
    mode,
    isAiAnnotation,
    currObject,
    currObjectIndex,
    focusObjectIndex,
    focusEleType,
    focusEleIndex,
    onChangePointVisible,
    setEditState,
  }) => {
    const { localeText } = useLocale();
    const [collapsed, setCollapsed] = useState(true);

    const show = useMemo(() => {
      if (
        currObjectIndex > -1 &&
        currObject?.type === EObjectType.Skeleton &&
        !isAiAnnotation
      ) {
        return true;
      }
      return false;
    }, [mode, currObject, currObjectIndex, isAiAnnotation]);

    const onFocusEleIndex = (index: number) => {
      setEditState((s) => {
        s.focusObjectIndex = currObjectIndex;
        s.focusEleIndex = index;
        s.focusEleType = EElementType.Circle;
      });
    };

    return (
      <FloatWrapper>
        <Card
          className={classNames('dds-annotator-points-editor', {
            'dds-annotator-points-editor-visible': show,
          })}
          title={
            <div className="title" onClick={() => setCollapsed((s) => !s)}>
              {localeText('DDSAnnotator.points.editor')}
              <div className="extra-btn">
                {collapsed ? <DownCircleOutlined /> : <UpCircleOutlined />}
              </div>
            </div>
          }
        >
          {!collapsed && (
            <div
              className="content"
              onMouseMove={(event: React.MouseEvent) => {
                event.stopPropagation();
              }}
            >
              {currObject &&
                currObject.keypoints &&
                currObject.keypoints.points.map((ele, eleIndex) => (
                  <PointItem
                    key={eleIndex}
                    point={ele}
                    index={eleIndex}
                    active={
                      focusObjectIndex === currObjectIndex &&
                      focusEleType === EElementType.Circle &&
                      focusEleIndex === eleIndex
                    }
                    onMouseEnter={() => onFocusEleIndex(eleIndex)}
                    onVisibleChange={(visible) => {
                      onChangePointVisible(eleIndex, visible);
                    }}
                  />
                ))}
            </div>
          )}
        </Card>
      </FloatWrapper>
    );
  },
);

export default PointsEditModal;
