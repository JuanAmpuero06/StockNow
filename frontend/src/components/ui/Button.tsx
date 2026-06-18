import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium transition-all rounded-xl focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 select-none cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 focus:ring-emerald-500 border-none',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 focus:ring-zinc-500 border border-zinc-700/50',
    danger: 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-zinc-950 focus:ring-rose-500 border border-rose-500/20',
    outline: 'bg-transparent hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 focus:ring-zinc-500',
    ghost: 'bg-transparent hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border-none',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      whileHover={isDisabled ? {} : { y: -1 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      disabled={isDisabled}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Procesando...
        </span>
      ) : (
        <>
          {leftIcon && <span className="flex items-center shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex items-center shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};
