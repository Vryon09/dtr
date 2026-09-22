import React from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Modal } from '../common/Modal';
import type {
  DashboardWidgetId,
  WidgetVisibilityState,
} from '../../types/dashboardWidgets';
import { WIDGET_REGISTRY } from '../../types/dashboardWidgets';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibility: WidgetVisibilityState;
  onToggleVisibility: (id: DashboardWidgetId) => void;
  onResetVisibility: () => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  visibility,
  onToggleVisibility,
  onResetVisibility,
}) => {
  if (!isOpen) return null;

  const widgetKeys: DashboardWidgetId[] = ['metrics', 'clock', 'chart', 'recent', 'rail'];
  const visibleCount = widgetKeys.filter((id) => visibility[id] !== false).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 4px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Dashboard Elements
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {visibleCount} of {widgetKeys.length} visible
          </span>
        </div>

        {/* Widget list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '2px',
          }}
        >
          {widgetKeys.map((id) => {
            const meta = WIDGET_REGISTRY[id];
            const isItemVisible = visibility[id] !== false;

            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isItemVisible ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: '1px solid',
                  borderColor: isItemVisible ? 'var(--border-subtle)' : 'transparent',
                  opacity: isItemVisible ? 1 : 0.65,
                  transition: 'var(--transition)',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--text-main)',
                      marginBottom: '2px',
                    }}
                  >
                    {meta.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.3,
                    }}
                  >
                    {meta.description}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVisibility(id)}
                  className={`widget-visibility-toggle ${isItemVisible ? 'is-visible' : 'is-hidden'}`}
                  title={isItemVisible ? 'Hide element' : 'Show element'}
                >
                  {isItemVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{isItemVisible ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={onResetVisibility}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <RotateCcw size={14} />
            <span>Show All</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 22px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              transition: 'var(--transition)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
