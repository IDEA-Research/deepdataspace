import { useLocale } from 'dds-utils/locale';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Input, InputRef, Space } from 'antd';
import { memo, useRef, useState } from 'react';
interface IProps {
  onAdd: (value: string) => void;
}

const CategoryCreator: React.FC<IProps> = memo(({ onAdd }) => {
  const { localeText } = useLocale();

  const inputRef = useRef<InputRef>(null);

  const [inputValue, setInputValue] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setInputValue(event.target.value);
  };

  const addCategory = () => {
    if (inputValue === '') return;
    onAdd(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <Space style={{ padding: '0 8px 4px' }}>
        <Input
          placeholder={localeText('DDSAnnotator.annotsEditor.addCategory')}
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.code === 'Enter') {
              addCategory();
            }
            event.stopPropagation();
          }}
        />
        <Button type="text" icon={<PlusOutlined />} onClick={addCategory}>
          {localeText('DDSAnnotator.annotsEditor.add')}
        </Button>
      </Space>
    </>
  );
});

export default CategoryCreator;
