import Icon from '@ant-design/icons';
import { Card, Upload, UploadFile } from 'antd';
import { ReactNode } from 'react';
import { ReactComponent as UploadFileIcon } from './assets/upload_file.svg';
import { UploadChangeParam } from 'antd/es/upload';
import { useLocale } from 'dds-utils/locale';
import './index.less';

const DEFAULT_PRE_ANNO_MAX_SIZE = 20;

interface IProps {
  children?: ReactNode;
  uploadFiles: UploadFile[];
  onChangeFile: (info: UploadChangeParam<UploadFile<any>>) => void;
  onRemoveFile: (file: UploadFile) => void;
}

const UploadPreAnno: React.FC<IProps> = ({
  uploadFiles,
  onChangeFile,
  onRemoveFile,
  children,
}) => {
  const { localeText } = useLocale();

  return (
    <Upload
      className="dds-upload-pre-anno"
      maxCount={1}
      beforeUpload={() => false}
      fileList={uploadFiles}
      onChange={onChangeFile}
      onRemove={onRemoveFile}
      accept={'.json'}
      showUploadList={true}
    >
      {children ? (
        children
      ) : (
        <Card>
          <Card.Meta
            avatar={<Icon component={UploadFileIcon} />}
            title={localeText('dds-upload-pre-anno')}
            description={localeText('dds-upload-pre-anno.tip', {
              maxSize: DEFAULT_PRE_ANNO_MAX_SIZE,
            })}
          />
        </Card>
      )}
    </Upload>
  );
};

export default UploadPreAnno;
