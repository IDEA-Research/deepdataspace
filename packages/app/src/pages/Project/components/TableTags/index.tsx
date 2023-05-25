import { UserOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import styles from './index.less';

interface ITagProps {
  isPerson?: boolean;
  max?: number;
  data: {
    text: string;
    color?: string;
  }[];
}

const TableTags: React.FC<ITagProps> = (props) => {
  const { data, max, isPerson } = props;
  const list = max ? data.slice(0, max) : data;
  return (
    <div className={styles.tagsWrap}>
      {list &&
        list.map((item) => (
          <Tag
            key={item.text}
            icon={isPerson ? <UserOutlined /> : null}
            color={item.color || 'geekblue'}
          >
            {item.text}
          </Tag>
        ))}
      {list.length < data.length ? '...' : ''}
    </div>
  );
};

export default TableTags;
