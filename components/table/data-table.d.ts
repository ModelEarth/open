import '@tanstack/react-table';

import type { MessageDescriptor } from 'react-intl';

import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import type { Row, RowData, VisibilityState, OnChangeFn } from '@tanstack/react-table';
//   interface TableMeta<TData extends RowData> {
// interface ColumnMeta<TData extends RowData, TValue> {
import type { RefObject } from 'react';
import type { GetActions } from '../../lib/actions/types';
import type { IntlShape } from 'react-intl';
import { Account } from '../../lib/graphql/types/v2/graphql';
declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string;
    labelMsg?: MessageDescriptor;
    align?: 'left' | 'right';
  }
  interface TableMeta<TData extends RowData> {
    intl?: IntlShape;
    queryFilter?: useQueryFilterReturnType<any>;
    setColumnVisibility?: OnChangeFn<VisibilityState>;
    columnVisibility?: VisibilityState;
    defaultColumnVisibility?: VisibilityState;
    hasDefaultColumnVisibility?: boolean;
    onClickRow?: (row: Row<TData>, actionsMenuTriggerRef?: RefObject<HTMLElement>) => void;
    getActions?: GetActions<TData>;

    // TODO: remove types below when all tables use getActions
    // Hosted Collectives table
    onEdit?: () => void;
    host?: Account;

    // AccountingCateriesTable
    disabled?: boolean;
    onDelete?: (v: any) => void;
  }
}
