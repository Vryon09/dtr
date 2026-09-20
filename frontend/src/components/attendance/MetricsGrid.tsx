import React from 'react';
import { Target, CheckCircle2, Clock3, Percent } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import type { AttendanceSummaryResponse } from '../../types/attendance';
import { formatHours, formatPercent } from '../../utils/format';

interface MetricsGridProps {
  summary: AttendanceSummaryResponse | null;
  isLoading?: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ summary }) => {
  return (
    <div className="stat-grid">
      <StatCard
        label="Required Target"
        value={formatHours(summary?.requiredHours)}
        icon={<Target size={22} />}
        iconVariant="primary"
        subtext="Total OJT Requirement"
      />
      <StatCard
        label="Hours Rendered"
        value={formatHours(summary?.completedHours)}
        icon={<CheckCircle2 size={22} />}
        iconVariant="success"
        subtext="Completed to date"
        badgeText="+ Hours"
        badgePositive={true}
      />
      <StatCard
        label="Hours Remaining"
        value={formatHours(summary?.remainingHours)}
        icon={<Clock3 size={22} />}
        iconVariant="warning"
        subtext="Needed for completion"
      />
      <StatCard
        label="Overall Progress"
        value={formatPercent(summary?.progressPercentage)}
        icon={<Percent size={22} />}
        iconVariant="info"
        subtext="Target accomplishment"
        badgeText={summary && summary.progressPercentage >= 100 ? 'Complete' : 'In Progress'}
        badgePositive={summary ? summary.progressPercentage >= 100 : false}
      />
    </div>
  );
};
