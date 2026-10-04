import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  ChevronDown,
  Plus,
  CheckCircle,
  Check,
  Pencil,
} from 'lucide-react';
import {
  useInternships,
  useSwitchInternshipMutation,
  useUpdateInternshipMutation,
} from '../../hooks/useInternshipQueries';
import { CreateInternshipModal } from './CreateInternshipModal';
import { EditInternshipModal } from './EditInternshipModal';
import type { InternshipSummary } from '../../types/internship';

interface InternshipSwitcherProps {
  className?: string;
  style?: React.CSSProperties;
}

export const InternshipSwitcher: React.FC<InternshipSwitcherProps> = ({
  className = '',
  style,
}) => {
  const { data: internships = [], isLoading } = useInternships();
  const switchMutation = useSwitchInternshipMutation();
  const updateMutation = useUpdateInternshipMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<InternshipSummary | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const active = internships.find((i) => i.isActive) || internships[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (id: string) => {
    if (id === active?.id) {
      setIsOpen(false);
      return;
    }
    await switchMutation.mutateAsync(id);
    setIsOpen(false);
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    id: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    await updateMutation.mutateAsync({
      id,
      payload: { status: nextStatus },
    });
  };

  if (isLoading || !active) {
    return (
      <div
        className={`internship-switcher ${className}`}
        style={{
          padding: '6px 12px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          ...style,
        }}
      >
        <Briefcase size={16} />
        <span>Loading profiles...</span>
      </div>
    );
  }

  const isCompleted = active.status === 'COMPLETED';

  return (
    <div
      ref={dropdownRef}
      style={style}
      className={`internship-switcher ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="internship-switcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-expanded={isOpen}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: isCompleted
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(59, 130, 246, 0.15)',
            color: isCompleted ? 'var(--success)' : 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <Briefcase size={14} />
        </div>

        <div className="internship-switcher-info" style={{ textAlign: 'left', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          <div
            className="internship-switcher-title"
            style={{
              fontWeight: 600,
              fontSize: '0.85rem',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {active.title}
          </div>
          {active.companyName && (
            <div
              className="internship-switcher-company"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {active.companyName}
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '12px',
            fontWeight: 600,
            background:
              active.status === 'COMPLETED'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
            color:
              active.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)',
            flexShrink: 0,
          }}
        >
          {active.status === 'COMPLETED' ? 'Completed' : `${active.progressPercentage}%`}
        </span>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="internship-switcher-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: '290px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 10px 6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Internship Profiles ({internships.length})</span>
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {internships.map((item) => {
              const isItemActive = item.isActive;
              const isItemCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isItemActive
                      ? 'var(--bg-hover)'
                      : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isItemActive) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isItemActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: isItemActive ? 600 : 500,
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {isItemActive && (
                        <Check size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                      )}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '3px',
                      }}
                    >
                      <span>
                        {item.completedHours} / {item.requiredHours} hrs
                      </span>
                      <span>•</span>
                      <span>{item.progressPercentage}%</span>
                      {item.companyName && (
                        <>
                          <span>•</span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '80px',
                            }}
                          >
                            {item.companyName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '4px',
                        width: '100%',
                        borderRadius: '2px',
                        background: 'var(--border-subtle)',
                        marginTop: '5px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(item.progressPercentage, 100)}%`,
                          background: isItemCompleted ? 'var(--success)' : 'var(--primary)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      title="Edit Internship Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setEditingInternship(item);
                      }}
                      style={{
                        padding: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      title={
                        isItemCompleted
                          ? 'Mark as Active'
                          : 'Mark as Completed'
                      }
                      onClick={(e) => handleToggleStatus(e, item.id, item.status)}
                      style={{
                        padding: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        color: isItemCompleted
                          ? 'var(--success)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px dashed var(--border-subtle)',
                background: 'transparent',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Plus size={16} />
              <span>Start New Internship / OJT</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to add new internship */}
      <CreateInternshipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        suggestedTitle={`Internship ${internships.length + 1}`}
      />

      {/* Modal to edit internship */}
      <EditInternshipModal
        isOpen={Boolean(editingInternship)}
        onClose={() => setEditingInternship(null)}
        internship={editingInternship}
      />
    </div>
  );
};
