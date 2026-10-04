import React, { useState } from 'react';
import { Award, Plus, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { CreateInternshipModal } from '../internship/CreateInternshipModal';
import { useActiveInternship, useUpdateInternshipMutation } from '../../hooks/useInternshipQueries';

interface GoalCompletedBannerProps {
  completedHours: number;
  requiredHours: number;
}

export const GoalCompletedBanner: React.FC<GoalCompletedBannerProps> = ({
  completedHours,
  requiredHours,
}) => {
  const activeInternship = useActiveInternship();
  const updateMutation = useUpdateInternshipMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!activeInternship || requiredHours <= 0 || completedHours < requiredHours) {
    return null;
  }

  const isCompleted = activeInternship.status === 'COMPLETED';

  const handleMarkCompleted = async () => {
    await updateMutation.mutateAsync({
      id: activeInternship.id,
      payload: { status: 'COMPLETED' },
    });
  };

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flex: 1 }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}
          >
            <Award size={26} />
          </div>

          <div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Goal Hours Reached!</span>
              {isCompleted && (
                <span
                  style={{
                    fontSize: '0.725rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--success)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  Completed
                </span>
              )}
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              You have rendered <strong>{completedHours}</strong> of <strong>{requiredHours}</strong> required hours for{' '}
              <strong>{activeInternship.title}</strong>. Ready for your 2nd internship or OJT?
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isCompleted && (
            <Button
              variant="outline"
              onClick={handleMarkCompleted}
              isLoading={updateMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={16} />
              <span>Mark as Completed</span>
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Start 2nd Internship / OJT</span>
          </Button>
        </div>
      </div>

      <CreateInternshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        suggestedTitle="2nd Internship / OJT"
      />
    </>
  );
};
