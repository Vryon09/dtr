import React from 'react';
import owlMascotEmpty from '../../assets/owl-mascot-empty.png';

interface EmptyStateProps {
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  size?: 'sm' | 'md' | 'lg';
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description = 'Search by title or description',
  imageSrc = owlMascotEmpty,
  imageAlt = 'No data',
  size = 'md',
  action,
  className = '',
  style = {},
}) => {
  const imageSizes = {
    sm: { width: '80px', maxHeight: '80px', gap: '8px', padding: '20px 12px' },
    md: { width: '120px', maxHeight: '120px', gap: '12px', padding: '36px 16px' },
    lg: { width: '160px', maxHeight: '160px', gap: '16px', padding: '48px 24px' },
  };

  const currentSize = imageSizes[size] || imageSizes.md;

  return (
    <div
      className={`empty-state-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: currentSize.padding,
        gap: currentSize.gap,
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{
            width: currentSize.width,
            height: 'auto',
            maxHeight: currentSize.maxHeight,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.05))',
            userSelect: 'none',
          }}
          loading="lazy"
        />
      </div>

      <div style={{ maxWidth: '360px' }}>
        {title && (
          <h4
            style={{
              fontSize: size === 'sm' ? '0.938rem' : '1.063rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
            }}
          >
            {title}
          </h4>
        )}
        {description && (
          <p
            style={{
              fontSize: size === 'sm' ? '0.813rem' : '0.875rem',
              color: 'var(--text-light)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div style={{ marginTop: '4px' }}>
          {action}
        </div>
      )}
    </div>
  );
};
