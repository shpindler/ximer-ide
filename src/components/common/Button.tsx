import React, { forwardRef } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Визуальный стиль кнопки */
  variant?: ButtonVariant;
  /** Размер кнопки */
  size?: ButtonSize;
  /** Показывать индикатор загрузки */
  isLoading?: boolean;
  /** Полностью закругленная кнопка */
  rounded?: boolean;
  /** Кнопка на всю ширину */
  fullWidth?: boolean;
  /** Иконка слева */
  leftIcon?: React.ReactNode;
  /** Иконка справа */
  rightIcon?: React.ReactNode;
  /** Текст кнопки */
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      rounded = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;
      onClick?.(event);
    };

    const buttonClasses = [
      'ximer-btn',
      `ximer-btn-${variant}`,
      `ximer-btn-${size}`,
      rounded && 'ximer-btn-rounded',
      fullWidth && 'ximer-btn-full-width',
      isLoading && 'ximer-btn-loading',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading && (
          <span className="ximer-btn-spinner">
            <svg
              className="ximer-btn-spinner-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {leftIcon && !isLoading && (
          <span className="ximer-btn-icon ximer-btn-icon-left">{leftIcon}</span>
        )}
        {children && <span className="ximer-btn-text">{children}</span>}
        {rightIcon && !isLoading && (
          <span className="ximer-btn-icon ximer-btn-icon-right">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;