import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`form-input ${className}`}
          style={error ? { borderColor: 'var(--danger)' } : {}}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
        {!error && helperText && (
          <span style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
