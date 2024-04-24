import { LucideIcon } from 'lucide-react';
import type React from 'react';
export enum ActionType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export type Action = {
  type: ActionType;
  label: React.ReactNode;
  onClick: () => void;
  Icon?: LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
  'data-cy'?: string;
};

export type GetActions<V> = (
  value: V,
  onCloseFocusRef?: React.RefObject<HTMLElement>,
  refetch?: () => void,
) => Action[];
