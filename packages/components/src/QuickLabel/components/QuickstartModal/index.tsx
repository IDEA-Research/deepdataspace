import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, UploadFile as AntdUploadFile } from 'antd';
import { UploadChangeParam } from 'antd/es/upload';
import { UploadPreAnno } from 'dds-components';
import Upload, { UploadFile } from 'dds-components/Upload';
import { globalLocaleText } from 'dds-utils/locale';

import './index.less';

const MAX_COUNT = 1000;
const MAX_SIZE = 10;

interface IProps {
  open: boolean;
  isInit: boolean;
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  onClickOk: () => void;
  onClickCancel: () => void;
  limitRemoveFile?: (index: number) => boolean;
  limitClose?: boolean;
  okText?: string;
  uploadPreAnnot: AntdUploadFile[];
  onChangePreAnnotFile: (info: UploadChangeParam<AntdUploadFile<any>>) => void;
  onRemovePreAnnotFile: (file: AntdUploadFile) => void;
}

const QuickstartModal: React.FC<IProps> = ({
  open,
  isInit,
  fileList,
  setFileList,
  onClickOk,
  onClickCancel,
  limitRemoveFile,
  okText,
  limitClose,
  uploadPreAnnot,
  onChangePreAnnotFile,
  onRemovePreAnnotFile,
}: IProps) => {
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <Modal
        title={globalLocaleText('quicklabel.title')}
        width={675}
        open={open}
        onOk={onClickOk}
        onCancel={onClickCancel}
        okText={okText}
        okButtonProps={{
          disabled: fileList.length === 0,
        }}
        cancelButtonProps={{
          hidden: limitClose,
        }}
        closable={!limitClose}
        destroyOnClose
      >
        <Alert
          message={globalLocaleText('quicklabel.formModal.attn')}
          description={globalLocaleText('quicklabel.formModal.tip')}
          type="info"
          showIcon
        />
        <div className="dds-quicklabel-subtitle">
          {globalLocaleText('quicklabel.formModal.importImages')}
        </div>
        <div className="dds-quicklabel-upload">
          <Upload
            fileList={fileList}
            setFileList={setFileList}
            fileType={'image'}
            acceptTypes={['image/png', 'image/jpeg', 'image/jpg']}
            limitRemoveFile={limitRemoveFile}
            maxCount={MAX_COUNT}
            maxSize={MAX_SIZE}
          />
        </div>
        <Alert
          className={'dds-quicklabel-upload-tip'}
          message={globalLocaleText('quicklabel.formModal.imageTips', {
            count: MAX_COUNT,
            size: MAX_SIZE,
          })}
          type="info"
          showIcon
        />
        {isInit && (
          <UploadPreAnno
            uploadFiles={uploadPreAnnot}
            onChangeFile={onChangePreAnnotFile}
            onRemoveFile={onRemovePreAnnotFile}
          >
            <Button
              icon={<UploadOutlined />}
              className="dds-quicklabel-upload-preannot-btn"
            >
              {globalLocaleText('quicklabel.formModal.importPreAnnots')}
            </Button>
          </UploadPreAnno>
        )}
      </Modal>
    </div>
  );
};

export default QuickstartModal;
