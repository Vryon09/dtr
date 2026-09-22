import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardWidgetId,
  WidgetVisibilityState,
} from '../types/dashboardWidgets';
import { DEFAULT_WIDGET_VISIBILITY } from '../types/dashboardWidgets';

const STORAGE_PREFIX = 'dtr_dashboard_visibility_v1_';

export function useDashboardLayout(userId?: string) {
  const storageKey = `${STORAGE_PREFIX}${userId || 'default'}`;

  const loadVisibility = (): WidgetVisibilityState => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { ...DEFAULT_WIDGET_VISIBILITY };
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_WIDGET_VISIBILITY,
        ...parsed,
      };
    } catch {
      return { ...DEFAULT_WIDGET_VISIBILITY };
    }
  };

  const [visibility, setVisibility] = useState<WidgetVisibilityState>(loadVisibility);

  useEffect(() => {
    setVisibility(loadVisibility());
  }, [storageKey]);

  const persistVisibility = useCallback(
    (nextState: WidgetVisibilityState) => {
      setVisibility(nextState);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextState));
      } catch (err) {
        console.error('Failed to save dashboard visibility:', err);
      }
    },
    [storageKey]
  );

  const toggleVisibility = useCallback(
    (id: DashboardWidgetId) => {
      const updated = {
        ...visibility,
        [id]: !visibility[id],
      };
      persistVisibility(updated);
    },
    [visibility, persistVisibility]
  );

  const showAll = useCallback(() => {
    persistVisibility({ ...DEFAULT_WIDGET_VISIBILITY });
  }, [persistVisibility]);

  const resetVisibility = useCallback(() => {
    persistVisibility({ ...DEFAULT_WIDGET_VISIBILITY });
  }, [persistVisibility]);

  const isVisible = useCallback(
    (id: DashboardWidgetId): boolean => {
      return visibility[id] ?? true;
    },
    [visibility]
  );

  const hiddenCount = Object.values(visibility).filter((v) => !v).length;

  return {
    visibility,
    toggleVisibility,
    showAll,
    resetVisibility,
    isVisible,
    hiddenCount,
  };
}
