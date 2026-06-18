import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  animate = true,
  ...props
}) => {
  const baseClass = 'rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 backdrop-blur-md transition-colors duration-300';
  const hoverClass = hoverEffect ? 'hover:border-zinc-700/80 hover:bg-zinc-950/60 shadow-lg shadow-zinc-950/50' : '';

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${baseClass} ${hoverClass} ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
