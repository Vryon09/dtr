import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconVariant?: 'primary' | 'success' | 'warning' | 'info';
  subtext?: string;
  badgeText?: string;
  badgePositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconVariant = 'primary',
  subtext,
  badgeText,
  badgePositive,
}) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconVariant}`}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="stat-label">{label}</span>
          {badgeText && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: badgePositive ? 'var(--success-text)' : 'var(--warning-text)',
                background: badgePositive ? 'var(--success-light)' : 'var(--warning-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div className="stat-value" style={{ marginTop: '4px' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.813rem', color: 'var(--text-light)', marginTop: '2px' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
