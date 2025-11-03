import React from 'react';
import { Link } from 'react-router-dom';

// Helper for className merging
const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const Card = ({ 
  as: Component = 'div',  // allow rendering as different elements
  variant = 'default',    // default, hover, interactive, outline, subtle
  size = 'default',       // small, default, large
  to,                     // for Link cards
  onClick,               // for clickable cards
  className,
  children,
  ...props
}) => {
  // If 'to' prop is provided, use Link component
  const ElementType = to ? Link : Component;
  
  // Base card styles
  const baseStyles = 'rounded-lg bg-[var(--panel-bg)] border border-[var(--border-color)]';
  
  // Size-specific padding
  const sizeStyles = {
    small: 'p-3',
    default: 'p-4',
    large: 'p-6',
  }[size];
  
  // Variant-specific styles
  const variantStyles = {
    default: 'shadow-sm',
    hover: 'shadow-sm hover:shadow-md transition-shadow duration-200',
    interactive: 'shadow-sm hover:shadow-md active:shadow-sm transition-all cursor-pointer',
    outline: 'border-2',
    subtle: 'bg-gray-50 border-transparent',
  }[variant];

  // If card is clickable (has onClick or to), add interactive styles
  const isClickable = onClick || to;
  const interactiveStyles = isClickable ? 'hover:border-gray-300' : '';
  
  return (
    <ElementType
      to={to}
      onClick={onClick}
      className={classNames(
        baseStyles,
        sizeStyles,
        variantStyles,
        interactiveStyles,
        className
      )}
      {...props}
    >
      {children}
    </ElementType>
  );
};

// Sub-components for consistent card content layout
Card.Header = ({ className, children, ...props }) => (
  <div className={classNames('mb-4 last:mb-0', className)} {...props}>
    {children}
  </div>
);

Card.Title = ({ as: Component = 'h3', className, children, ...props }) => (
  <Component className={classNames('text-lg font-semibold text-gray-900', className)} {...props}>
    {children}
  </Component>
);

Card.Description = ({ className, children, ...props }) => (
  <p className={classNames('text-sm text-gray-500', className)} {...props}>
    {children}
  </p>
);

Card.Body = ({ className, children, ...props }) => (
  <div className={classNames('space-y-3', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ className, children, ...props }) => (
  <div className={classNames('mt-4 first:mt-0 flex items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
);

// Container component for page sections
export const Container = ({
  as: Component = 'div',
  size = 'default',
  className,
  children,
  ...props
}) => {
  const sizeStyles = {
    small: 'max-w-3xl',
    default: 'max-w-5xl',
    large: 'max-w-7xl',
  }[size];

  return (
    <Component
      className={classNames(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizeStyles,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Section component for content grouping
export const Section = ({
  as: Component = 'section',
  spacing = 'default',
  className,
  children,
  ...props
}) => {
  const spacingStyles = {
    small: 'py-4',
    default: 'py-8',
    large: 'py-12',
  }[spacing];

  return (
    <Component
      className={classNames(
        spacingStyles,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};