import React, { useState } from 'react';
import { Sparkles, Plus, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { CreateInternshipModal } from '../internship/CreateInternshipModal';
import { useActiveInternship, useUpdateInternshipMutation } from '../../hooks/useInternshipQueries';
import owlMascotCelebrate from '../../assets/own-mascot-celebrate.png';

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
      <div className="goal-completed-banner">
        {/* Content Column */}
        <div className="goal-completed-banner-content">
          <div className="goal-completed-badges">
            <span className="goal-completed-tag">
              <Sparkles size={13} />
              <span>Milestone Achieved</span>
            </span>
            {isCompleted && (
              <span className="goal-completed-status-badge">
                <CheckCircle size={13} />
                <span>Completed</span>
              </span>
            )}
          </div>

          <h2 className="goal-completed-title">
            <span>Goal Hours Reached!</span>
          </h2>

          <p className="goal-completed-desc">
            Amazing milestone! You rendered <strong>{completedHours}</strong> of{' '}
            <strong>{requiredHours}</strong> required hours for{' '}
            <strong>{activeInternship.title}</strong>. Ready to embark on your 2nd internship or OJT?
          </p>

          <div className="goal-completed-progress-strip">
            <div className="goal-completed-progress-bar-track">
              <div className="goal-completed-progress-bar-fill" />
            </div>
            <span className="goal-completed-progress-label">
              {completedHours} / {requiredHours} hrs (100%)
            </span>
          </div>

          <div className="goal-completed-actions">
            {!isCompleted && (
              <Button
                variant="outline"
                onClick={handleMarkCompleted}
                isLoading={updateMutation.isPending}
                icon={<CheckCircle size={16} />}
              >
                <span>Mark as Completed</span>
              </Button>
            )}

            <Button
              variant="primary"
              onClick={() => setIsModalOpen(false || true)}
              icon={<Plus size={16} />}
            >
              <span>Start 2nd Internship / OJT</span>
            </Button>
          </div>
        </div>

        {/* Mascot Column */}
        <div className="goal-completed-mascot-pane">
          <div className="goal-completed-mascot-aura" aria-hidden="true" />
          <img
            src={owlMascotCelebrate}
            alt="Celebrating owl mascot"
            className="goal-completed-mascot-img"
          />
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

