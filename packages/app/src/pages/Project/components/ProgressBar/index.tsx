import { Progress } from 'antd';

interface IProgressBarProps {
  complete: number;
  total: number;
}

const ProgressBar: React.FC<IProgressBarProps> = (props) => {
  const { complete, total } = props;

  return (
    <>
      <Progress
        percent={(complete / total) * 100}
        showInfo={false}
        trailColor="#e4e4e4"
      />
      <div>{`${complete} / ${total}`}</div>
    </>
  );
};

export default ProgressBar;
