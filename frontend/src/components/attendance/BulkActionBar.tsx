import React from 'react';
import { Trash2, X, CheckSquare, Pencil } from 'lucide-react';
import { formatHours } from '../../utils/format';

interface BulkActionBarProps {
  selectedCount: number;
  totalSelectedHours?: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onEditSelected?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalSelectedHours,
  onClearSelection,
  onDeleteSelected,
  onEditSelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: 'var(--primary-light)',
        border: '1px solid rgba(79, 70, 229, 0.25)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: '0.813rem',
          }}
        >
          <CheckSquare size={14} />
          <span>
            {selectedCount} {selectedCount === 1 ? 'log' : 'logs'} selected
          </span>
        </div>

        {totalSelectedHours !== undefined && (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Total: <strong style={{ color: 'var(--primary)' }}>{formatHours(totalSelectedHours)}</strong>
          </span>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.813rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={14} />
          <span>Clear selection</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onEditSelected && (
          <button
            id="bulkEditSelectedButton"
            type="button"
            onClick={onEditSelected}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-card)',
              color: 'var(--primary)',
              border: '1px solid rgba(79, 70, 229, 0.35)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            <Pencil size={15} />
            <span>Edit Selected ({selectedCount})</span>
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteSelected}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
        >
          <Trash2 size={15} />
          <span>Delete Selected ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
};
