export type DashboardWidgetId =
  | 'metrics'
  | 'clock'
  | 'chart'
  | 'recent'
  | 'rail';

export interface WidgetMeta {
  id: DashboardWidgetId;
  title: string;
  description: string;
}

export type WidgetVisibilityState = Record<DashboardWidgetId, boolean>;

export const WIDGET_REGISTRY: Record<DashboardWidgetId, WidgetMeta> = {
  metrics: {
    id: 'metrics',
    title: 'Hours & Summary Metrics',
    description: 'Summary counters for total hours, remaining target, and attendance rate',
  },
  clock: {
    id: 'clock',
    title: 'Clock In / Out Station',
    description: 'Current shift timer, status badge, and clock/break action buttons',
  },
  chart: {
    id: 'chart',
    title: 'Weekly Hours Breakdown',
    description: 'Bar chart tracking daily hours rendered across the active week',
  },
  recent: {
    id: 'recent',
    title: 'Recent Activity Log',
    description: 'Table listing your latest attendance records with quick actions',
  },
  rail: {
    id: 'rail',
    title: 'Intern Profile & Target Rail',
    description: 'User avatar, milestone progress badge, and supervisor information',
  },
};

export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibilityState = {
  metrics: true,
  clock: true,
  chart: true,
  recent: true,
  rail: true,
};
