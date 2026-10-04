import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCreateInternshipMutation } from '../../hooks/useInternshipQueries';

interface CreateInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  suggestedTitle?: string;
}

export const CreateInternshipModal: React.FC<CreateInternshipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  suggestedTitle = '2nd Internship / OJT',
}) => {
  const [title, setTitle] = useState(suggestedTitle);
  const [companyName, setCompanyName] = useState('');
  const [requiredHours, setRequiredHours] = useState<number>(300);
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateInternshipMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for this internship or OJT');
      return;
    }

    if (!requiredHours || requiredHours <= 0) {
      setError('Target required hours must be greater than 0');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        companyName: companyName.trim() || undefined,
        requiredHours: Number(requiredHours),
        startDate: startDate || undefined,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create internship profile');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Internship / OJT"
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Start a new tracking cycle with fresh target hours. Your past internship logs will be safely preserved.
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
          <div style={{ position: 'relative' }}>
            <Input
              type="text"
              placeholder="e.g. 2nd OJT - Software Engineering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
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
            Company / Organization (Optional)
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
              Required Hours <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={2000}
              value={requiredHours}
              onChange={(e) => setRequiredHours(Number(e.target.value))}
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
              Start Date (Optional)
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
            disabled={createMutation.isPending}
          >
            Create & Switch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
