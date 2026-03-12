import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  isGlass?: boolean;
  style?: CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', isGlass = false, style }) => {
  return (
    <div className={`${isGlass ? 'glass-panel' : 'card'} ${className} `} style={style}>
      {children}
    </div>
  );
};
