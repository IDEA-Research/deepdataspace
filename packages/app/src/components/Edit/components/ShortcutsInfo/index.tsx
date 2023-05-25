import { Dropdown, Menu, MenuProps, Tooltip } from 'antd';
import { ReactComponent as KeyboardIcon } from '@/assets/svg/keyboard.svg';
import Icon from '@ant-design/icons';
import { useMemo } from 'react';
import {
  convertAliasToSymbol,
  EDITOR_SHORTCUTS,
  EShortcuts,
  EShortcutType,
  TShortcutItem,
} from '../../constants/shortcuts';
import styles from './index.less';
import { useLocale } from '@/locales/helper';

interface IProps {
  viewOnly: boolean;
}

export const getIconFromShortcut = (keys: string[]) => {
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
          <span className={styles.key} key={idx}>
            {convertAliasToSymbol(key)}
          </span>
        );
        icons.push(letter);
        if (idx !== combineKeys.length - 1) {
          icons.push(
            <span className={styles.combine} key={idx + 'and'}>
              {' '}
              +{' '}
            </span>,
          );
        }
      });
    } else {
      const letter = (
        <span className={styles.key} key={index}>
          {convertAliasToSymbol(key)}
        </span>
      );
      icons.push(letter);
    }
    if (index !== keys.length - 1) {
      icons.push(
        <span className={styles.combine} key={index + 'or'}>
          {' '}
          /{' '}
        </span>,
      );
    }
  }
  return <span className={styles.keyGroup}>{icons}</span>;
};

export const ShortcutsInfo: React.FC<IProps> = ({ viewOnly }) => {
  const { localeText } = useLocale();

  const convertShortcutsToMenuProps = (
    shortcuts: Record<EShortcuts, TShortcutItem>,
  ): MenuProps['items'] => {
    const categories: Record<any, any> = {};
    for (const key in shortcuts) {
      if (shortcuts.hasOwnProperty(key)) {
        // @ts-ignore
        const { type, descTextKey, shortcut } = shortcuts[key];
        const description = localeText(descTextKey);
        if (viewOnly && type !== EShortcutType.ViewAction) {
          continue;
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
  }, [viewOnly]);

  return (
    <Dropdown
      placement="bottomLeft"
      dropdownRender={() => (
        <Menu className={styles.shortcutsInfo} theme="dark" items={items} />
      )}
      trigger={['click']}
    >
      <Tooltip title={localeText('editor.shortcuts')}>
        <Icon
          component={KeyboardIcon}
          style={{
            color: '#fff',
            width: 24,
          }}
        />
      </Tooltip>
    </Dropdown>
  );
};
