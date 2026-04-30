import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantBg: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-primary-soft text-primary hover:bg-primary-soft/80',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
  gold: 'bg-accent text-text hover:bg-accent/90',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const widthClass = fullWidth ? 'w-full' : '';
  const opacityClass = isDisabled ? 'opacity-60 cursor-not-allowed' : '';
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${variantBg[variant]} ${sizeClass[size]} ${widthClass} ${opacityClass} ${className}`}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      {loading ? 'Loading…' : label}
    </button>
  );
}

export default Button;
