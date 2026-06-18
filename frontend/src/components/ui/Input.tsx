import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full rounded-xl border bg-zinc-900/50 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:bg-zinc-900 focus:outline-hidden focus:ring-1 ${
            error 
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' 
              : 'border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500'
          } ${icon ? 'pl-10' : 'pl-4'} pr-4 ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
};
