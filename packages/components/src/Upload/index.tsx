import { useCallback, useRef, useState } from 'react';
import { Button, Spin, message } from 'antd';
import { useDrop } from 'ahooks';
import { cloneDeep } from 'lodash';
import { ReactComponent as UploadIcon } from './assets/upload.svg';
import { useLocale } from 'dds-utils/locale';
import { scanDataTransfer } from 'dds-utils/file';
import FilePreviewList from './components/FilePreviewList';
import classNames from 'classnames';
import './index.less';

export interface UploadFile {
  id: string;
  name: string;
  url: string;
  status?: 'success' | 'error';
  originFileObj?: File;
  path?: string;
  uploadUrl?: string;
  contentType?: string;
  duration?: number;
  frameCount?: number;
  frameRate?: number;
  targetFrameRate?: number;
}

interface IProps {
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  fileType: 'video' | 'image';
  acceptTypes?: string[];
  maxCount?: number;
  maxSize?: number;
  maxDuratuion?: number;
  limitRemoveFile?: (index: number) => boolean;
}

const Upload: React.FC<IProps> = ({
  fileList,
  setFileList,
  acceptTypes,
  maxCount,
  maxSize,
  maxDuratuion,
  limitRemoveFile,
  fileType,
}: IProps) => {
  const { localeText } = useLocale();
  const [loading, setLoading] = useState(false);
  const [draging, setDraging] = useState(false);
  const fileCancleRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = acceptTypes ? acceptTypes.join(', ') : undefined;

  const addFiles = async (files: File[]) => {
    setLoading(true);
    const newFiles: UploadFile[] = [];
    for (let file of files) {
      let [frameCount, frameRate, duration] = [0, 0, 0];
      if (maxSize && file.size && file.size / 1024 / 1024 > maxSize) {
        continue;
      }
      if (maxCount && newFiles.length + fileList.length > maxCount - 1) {
        continue;
      }
      if (fileList.find((item) => item.name === file.name)) {
        continue;
      }
      newFiles.push({
        id: file.name,
        name: file.name,
        url: URL.createObjectURL(file as Blob),
        originFileObj: file,
        frameCount,
        frameRate,
        duration,
      });
    }
    setLoading(false);
    if (newFiles.length > 0) {
      setFileList([...newFiles, ...fileList]);
      message.success(
        localeText('dds-upload.tip.successLoad', {
          count: newFiles.length,
        }),
      );
    }
  };

  const onRemoveFile = useCallback(
    (index: number) => {
      if (limitRemoveFile && limitRemoveFile(index)) return;
      const newList = cloneDeep(fileList);
      newList.splice(index, 1);
      setFileList(newList);
    },
    [fileList],
  );

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fileCancleRef.current = false;

    const files: File[] = e.target.files ? [...e.target.files] : [];
    if (files.length > 0) {
      addFiles(files);
    }

    setDraging(false);
    e.target.value = '';
  };

  const onClickUpload = useCallback(() => {
    if (maxCount && fileList.length >= maxCount) {
      message.warning(
        localeText('dds-upload.tip.fileCountLimitMsg', {
          count: maxCount,
        }),
      );
      return;
    }
    setDraging(true);
    inputRef.current?.click();

    // mock click file cancel
    fileCancleRef.current = true;
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (fileCancleRef.current) {
            setDraging(false);
          }
        }, 100);
      },
      { once: true },
    );
  }, [fileList, maxCount]);

  useDrop(window.document.body, {
    onFiles: async (_files, e) => {
      if (maxCount && fileList.length >= maxCount) {
        message.warning(
          localeText('dds-upload.tip.fileCountLimitMsg', {
            count: maxCount,
          }),
        );
        return;
      }
      const files = await scanDataTransfer(e?.dataTransfer, acceptTypes);
      addFiles(files);
    },
    onDragEnter: () => {
      setDraging(true);
    },
    onDrop: () => {
      setDraging(false);
    },
    onDragLeave: () => {
      setDraging(false);
    },
  });

  return (
    <div className="dds-upload">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleUploadChange}
      ></input>
      {fileList.length <= 0 ? (
        <div
          className={classNames('dds-upload-empty', {
            'dds-upload-draging': draging,
          })}
          onClick={onClickUpload}
        >
          <UploadIcon />
          <p className="dds-upload-title">{localeText('dds-upload.title')}</p>
          <p className="dds-upload-text">
            {fileType === 'video'
              ? localeText('dds-upload.limit.type.video')
              : localeText('dds-upload.limit.type.image')}
          </p>
        </div>
      ) : (
        <div
          className={classNames('dds-upload-content', {
            'dds-upload-draging': draging,
          })}
        >
          <div className="dds-upload-topbar">
            <div>
              <div className="dds-upload-title">
                {localeText('dds-upload.title')}
              </div>
              <div className="dds-upload-text">
                {fileType === 'video'
                  ? localeText('dds-upload.limit.type.video')
                  : localeText('dds-upload.limit.type.image')}
              </div>
            </div>
            <Button type="primary" onClick={onClickUpload}>
              {localeText('dds-upload.upload')}
            </Button>
          </div>
          <div className="dds-upload-content-list">
            {maxCount && (
              <div className="dds-upload-content-list-count">
                {fileList.length} / {maxCount}
              </div>
            )}
            <FilePreviewList
              files={fileList}
              onRemoveFile={onRemoveFile}
              fileType={fileType}
            />
          </div>
        </div>
      )}
      {loading && (
        <Spin
          size="large"
          className="dds-upload-loading"
          spinning={loading}
          delay={500}
        />
      )}
    </div>
  );
};

export default Upload;
