import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUpdateInternshipMutation, useInternships } from '../../hooks/useInternshipQueries';
import { DeleteInternshipModal } from './DeleteInternshipModal';
import type { Internship, InternshipStatus } from '../../types/internship';

interface EditInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  internship: Internship | null;
  onSuccess?: () => void;
}

export const EditInternshipModal: React.FC<EditInternshipModalProps> = ({
  isOpen,
  onClose,
  internship,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requiredHours, setRequiredHours] = useState<number>(300);
  const [status, setStatus] = useState<InternshipStatus>('ACTIVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: allInternships = [] } = useInternships();
  const updateMutation = useUpdateInternshipMutation();

  useEffect(() => {
    if (internship) {
      setTitle(internship.title || '');
      setCompanyName(internship.companyName || '');
      setRequiredHours(internship.requiredHours || 300);
      setStatus(internship.status || 'ACTIVE');
      setStartDate(internship.startDate ? internship.startDate.split('T')[0] : '');
      setEndDate(internship.endDate ? internship.endDate.split('T')[0] : '');
      setError(null);
      setIsDeleteModalOpen(false);
    }
  }, [internship, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internship) return;
    setError(null);

    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (!requiredHours || requiredHours <= 0) {
      setError('Target required hours must be greater than 0');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: internship.id,
        payload: {
          title: title.trim(),
          companyName: companyName.trim() ? companyName.trim() : null,
          requiredHours: Number(requiredHours),
          status,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update internship details');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Internship Details"
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Update the title, target required hours, and company information for this internship profile.
          </p>

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

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text-primary)',
              }}
            >
              Internship Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. 1st OJT - Software Engineering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--text-primary)',
              }}
            >
              Company / Organization
            </label>
            <Input
              type="text"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                Required Target Hours <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={2000}
                value={requiredHours}
                onChange={(e) => setRequiredHours(Number(e.target.value))}
                required
                helperText="Updates remaining hours & progress"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                Status <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InternshipStatus)}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="ACTIVE">Active (In Progress)</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--danger)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <Trash2 size={16} />
              <span>Delete Profile</span>
            </Button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <DeleteInternshipModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        internship={internship}
        totalInternshipsCount={allInternships.length}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          onClose();
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
};
