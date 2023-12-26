import { Dropdown, Menu, MenuProps, Tooltip } from 'antd';
import { ReactComponent as KeyboardIcon } from '../../assets/keyboard-down.svg';
import Icon from '@ant-design/icons';
import { memo, useMemo } from 'react';
import {
  convertAliasToSymbol,
  EDITOR_SHORTCUTS,
  EShortcuts,
  EShortcutType,
  TShortcutItem,
} from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import './index.less';
import classNames from 'classnames';
import { EditorMode } from '../../type';

interface IProps {
  mode: EditorMode;
  // viewOnly: boolean;
}

export const getIconFromShortcut = (keys: string[], withStyle = true) => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMac = userAgent.indexOf('mac') > -1;
  const icons: any[] = [];
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if ((!isMac && key.includes('meta')) || (isMac && key.includes('ctrl'))) {
      continue;
    }
    if (key.includes('.')) {
      const combineKeys = key.split('.');
      combineKeys.forEach((key, idx) => {
        const letter = (
          <span
            className={classNames({
              'dds-annotator-shortcutsinfo-key': withStyle,
            })}
            key={idx}
          >
            {convertAliasToSymbol(key)}
          </span>
        );
        icons.push(letter);
        if (idx !== combineKeys.length - 1) {
          icons.push(
            <span
              className={classNames({
                'dds-annotator-shortcutsinfo-combine': withStyle,
              })}
              key={idx + 'and'}
            >
              {' '}
              +{' '}
            </span>,
          );
        }
      });
    } else {
      const letter = (
        <span
          className={classNames({
            'dds-annotator-shortcutsinfo-key': withStyle,
          })}
          key={index}
        >
          {convertAliasToSymbol(key)}
        </span>
      );
      icons.push(letter);
    }
    if (index !== keys.length - 1) {
      icons.push(
        <span
          className={classNames({
            'dds-annotator-shortcutsinfo-combine': withStyle,
          })}
          key={index + 'or'}
        >
          {' '}
          /{' '}
        </span>,
      );
    }
  }
  return <span>{icons}</span>;
};

export const ShortcutsInfo: React.FC<IProps> = memo(({ mode }) => {
  const { localeText } = useLocale();

  const convertShortcutsToMenuProps = (
    shortcuts: Record<EShortcuts, TShortcutItem>,
  ): MenuProps['items'] => {
    const categories: Record<any, any> = {};
    for (const key in shortcuts) {
      if (shortcuts.hasOwnProperty(key)) {
        // @ts-ignore
        const { name, type, descTextKey, shortcut } = shortcuts[key];
        const description = localeText(descTextKey);
        if (mode === EditorMode.View && type !== EShortcutType.ViewAction) {
          continue;
        }
        if (mode === EditorMode.Review) {
          if (
            [EShortcutType.AnnotationAction, EShortcutType.Tool].includes(type)
          ) {
            continue;
          }
          if (
            [EShortcutType.GeneralAction].includes(type) &&
            name !== 'Accept' &&
            name !== 'Reject'
          ) {
            continue;
          }
        }

        if (categories[type]) {
          categories[type].children.push({
            key,
            label: description,
            icon: <span>{getIconFromShortcut(shortcut)}</span>,
          });
        } else {
          categories[type] = {
            key: type,
            type: 'group',
            label: localeText(type),
            children: [
              {
                key,
                label: description,
                icon: <span>{getIconFromShortcut(shortcut)}</span>,
              },
            ],
          };
        }
      }
    }
    return Object.values(categories);
  };

  const items = useMemo(() => {
    return convertShortcutsToMenuProps(EDITOR_SHORTCUTS) || [];
  }, [mode]);

  return (
    <Dropdown
      placement="bottomLeft"
      dropdownRender={() => (
        <Menu
          className="dds-annotator-shortcutsinfo"
          theme="dark"
          items={items}
        />
      )}
      trigger={['click']}
    >
      <Tooltip title={localeText('DDSAnnotator.shortcuts')}>
        <Icon
          className="dds-annotator-shortcutsinfo-icon"
          component={KeyboardIcon}
        />
      </Tooltip>
    </Dropdown>
  );
});
