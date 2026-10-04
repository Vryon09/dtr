import React, { useState } from 'react';
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useDeleteInternshipMutation } from '../../hooks/useInternshipQueries';
import type { Internship, InternshipSummary } from '../../types/internship';

interface DeleteInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  internship: Internship | InternshipSummary | null;
  totalInternshipsCount: number;
  onSuccess?: () => void;
}

export const DeleteInternshipModal: React.FC<DeleteInternshipModalProps> = ({
  isOpen,
  onClose,
  internship,
  totalInternshipsCount,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteInternshipMutation();

  if (!internship) return null;

  const isOnlyOne = totalInternshipsCount <= 1;

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(internship.id);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete internship profile');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Internship Profile"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--danger)',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isOnlyOne ? (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: 'var(--text-primary)',
            }}
          >
            <AlertTriangle size={24} color="#eab308" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                Cannot delete only internship
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                You must have at least one internship profile to log attendance and view metrics. To replace it, create a new internship first.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--text-primary)',
            }}
          >
            <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--danger)' }}>
                Warning: Permanent Action
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Are you sure you want to delete <strong>"{internship.title}"</strong>?
                This will permanently delete this internship profile and all of its associated attendance records.
              </p>
              {internship.isActive && (
                <p style={{ margin: '8px 0 0', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
                  This is currently your active profile. Deleting it will switch your active context to another profile.
                </p>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {!isOnlyOne && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              icon={<Trash2 size={16} />}
            >
              Delete Profile
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
