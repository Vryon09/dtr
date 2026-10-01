import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<NonNullable<ModalProps['size']>, string> = {
  sm: '400px',
  md: '500px',
  lg: '640px',
  xl: '780px',
  '2xl': '960px',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size,
  maxWidth,
  className,
  style,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedMaxWidth = maxWidth || (size ? SIZE_MAP[size] : undefined);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className || ''}`.trim()}
        style={{
          ...(resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : {}),
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              fontSize: '1.5rem',
              lineHeight: 1,
              color: 'var(--text-light)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
