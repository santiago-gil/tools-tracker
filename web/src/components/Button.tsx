import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const styles: Record<Variant, string> = {
    primary: 'bg-sk-red text-white hover:bg-sk-red-hover',
    secondary: 'bg-sk-gray text-gray-800 hover:bg-sk-gray-hover',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400',
  };

  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all whitespace-nowrap',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
