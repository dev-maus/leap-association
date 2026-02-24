import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  className?: string;
}

const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40 focus-visible:ring-primary',
  secondary: 'bg-white border border-slate-200 text-primary hover:bg-slate-50 focus-visible:ring-primary',
  outline: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus-visible:ring-white/50',
  ghost: 'bg-transparent hover:bg-white/10 text-white focus-visible:ring-white/50',
  accent: 'bg-accent text-white hover:bg-accent-light shadow-lg shadow-accent/25 hover:shadow-accent/40 focus-visible:ring-accent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-2',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-base gap-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
