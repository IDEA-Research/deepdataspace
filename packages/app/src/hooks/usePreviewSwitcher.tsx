import React from 'react';
import { useKeyPress } from 'ahooks';

interface IProps {
  visible: boolean;
  current: number;
  total: number;
  onCurrentChange: (current: number) => void;
  limitConfirm?: () => Promise<unknown>;
}

export default function usePreviewSwitcher({
  visible,
  current,
  total,
  onCurrentChange,
  limitConfirm = () =>
    new Promise((resolve) => {
      resolve(null);
    }),
}: IProps) {
  const switchLeft = () => {
    limitConfirm().then(() => {
      if (current > 0) {
        onCurrentChange(current - 1);
      }
    });
  };

  const switchRight = () => {
    limitConfirm().then(() => {
      if (current < total - 1) {
        onCurrentChange(current + 1);
      }
    });
  };

  const onSwitchLeft: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    switchLeft();
  };

  const onSwitchRight: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    switchRight();
  };

  useKeyPress(['leftarrow', 'rightarrow'], (e: KeyboardEvent) => {
    if (!visible) return;
    if (['ArrowLeft'].includes(e.key)) {
      switchLeft();
    } else if (['ArrowRight'].includes(e.key)) {
      switchRight();
    }
  });

  return {
    onSwitchLeft,
    onSwitchRight,
  };
}
