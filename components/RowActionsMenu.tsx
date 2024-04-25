import React from 'react';
import { Row, Table } from '@tanstack/react-table';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { ActionType } from '../lib/actions/types';

import { Button } from './ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import StyledSpinner from './StyledSpinner';

function ActionItem({ action }) {
  return (
    <DropdownMenuItem
      key={action.label}
      onClick={action.onClick}
      className="gap-2.5"
      disabled={action.disabled}
      data-cy={action['data-cy']}
    >
      {action.Icon && <action.Icon className="shrink-0 text-muted-foreground" size={16} />}
      {action.label}
      {action.isLoading && <StyledSpinner className="ml-auto size-4 text-muted-foreground" />}
    </DropdownMenuItem>
  );
}
interface RowActionsMenuProps<TData> {
  table: Table<TData>;
  row: Row<TData>;
  actionsMenuTriggerRef: React.MutableRefObject<HTMLButtonElement>;
}

export function RowActionsMenu<TData>({ row, actionsMenuTriggerRef, table }: RowActionsMenuProps<TData>) {
  if (!row.original) {
    return null;
  }
  const { getActions, onClickRow } = table.options.meta;

  const actions = getActions(row.original, actionsMenuTriggerRef);
  const openDetails = () => {
    onClickRow?.(row, actionsMenuTriggerRef);
  };
  const primaryActions = actions.filter(a => a.type === ActionType.PRIMARY);
  const secondaryActions = actions.filter(a => a.type === ActionType.SECONDARY);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild ref={actionsMenuTriggerRef}>
        <Button
          size="icon-xs"
          variant="outline"
          className="border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm group-hover/row:border-border data-[state=open]:border-border data-[state=open]:text-foreground"
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openDetails()} className="gap-2.5">
          <PanelRightOpen className="text-muted-foreground" size={16} />
          <FormattedMessage defaultMessage="Open details" id="iIXH4W" />
        </DropdownMenuItem>
        {primaryActions.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {primaryActions.map(action => (
              <ActionItem key={action.label} action={action} />
            ))}
          </React.Fragment>
        )}

        {secondaryActions.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {secondaryActions.map(action => {
              return <ActionItem key={action.label} action={action} />;
            })}
          </React.Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
