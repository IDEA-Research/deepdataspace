import { useLocale } from 'dds-utils/locale';
import styles from './index.less';
import { NsProject } from '@/types/project';

interface IProps {
  data?: NsProject.ProjectWorker;
}

const TaskProgress: React.FC<IProps> = ({ data }) => {
  const { localeText } = useLocale();
  if (!data) return <>-</>;

  const {
    labelNumWaiting,
    reviewNumWaiting,
    reviewNumRejected,
    reviewNumAccepted,
  } = data;

  const total =
    labelNumWaiting + reviewNumWaiting + reviewNumRejected + reviewNumAccepted;
  const records = [
    {
      label: localeText('proj.taskProgress.done'),
      color: '#72c240',
      progressColor: '#72c240',
      value: reviewNumAccepted,
    },
    {
      label: localeText('proj.taskProgress.inRework'),
      color: '#ec5b56',
      progressColor: '#ec5b56',
      value: reviewNumRejected,
    },
    {
      label: localeText('proj.taskProgress.toReview'),
      color: '#448ef7',
      progressColor: '#448ef7',
      value: reviewNumWaiting,
    },
    {
      label: localeText('proj.taskProgress.toLabel'),
      color: '#575252',
      progressColor: '#e4e4e4',
      value: labelNumWaiting,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {records.map((item, index) => {
          return (
            <div
              className={styles.progressItem}
              style={{
                backgroundColor: item.progressColor,
                width: `${(item.value * 100) / total}%`,
              }}
              key={index}
            />
          );
        })}
      </div>
      <div className={styles.labels}>
        {records.map((item, index) => {
          // if(item.value <= 0) return null;
          return (
            <div style={{ color: item.color }} key={index}>
              {index !== 0 ? <span className={styles.split}>|</span> : null}
              <span>{item.label}</span>({item.value})
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskProgress;
