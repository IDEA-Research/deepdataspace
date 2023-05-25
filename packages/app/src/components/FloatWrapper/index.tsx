import React, { ReactNode } from 'react';

interface FloatWrapperProps {
  children: ReactNode;
  eventHandler?: (event: React.MouseEvent) => void;
}

export const FloatWrapper: React.FC<FloatWrapperProps> = ({
  children,
  eventHandler,
}) => {
  const mouseEventHandler = (event: React.MouseEvent) => {
    if (eventHandler) {
      eventHandler(event);
    } else {
      event.stopPropagation();
    }
  };

  return (
    <div
      // onMouseMove={mouseEventHandler}
      onMouseDown={mouseEventHandler}
      onMouseUp={mouseEventHandler}
      style={{
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};
