import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Download, Filter, MinusCircle, Undo2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import TransactionRejectModal from '../../components/dashboard/sections/transactions/TransactionRejectModal';
import { useModal } from '../../components/ModalContext';
import { toast } from '../../components/ui/useToast';

import { API_V2_CONTEXT } from '../graphql/helpers';
import { Transaction } from '../graphql/types/v2/graphql';
import { useAsyncCall } from '../hooks/useAsyncCall';
import { saveInvoice } from '../transactions';

import { ActionType, GetActions } from './types';

const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

export const useTransactionActions = ({ resetFilters, refetchList }) => {
  const intl = useIntl();

  const { showModal, showConfirmationModal } = useModal();

  const [refundTransaction] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });

  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });

  const getActions: GetActions<Transaction> = (
    transaction: Transaction,
    onCloseFocusRef?: React.RefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!transaction) {
      return [];
    }
    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };

    const handleRefundTransaction = async () => {
      await refundTransaction({ variables: { transaction: { id: transaction.id } } });
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Transaction refunded', id: 's766TH' }),
      });
      onMutationSuccess?.();
    };

    const handleDownloadInvoice = async () => {
      const params = transaction.expense?.id
        ? { expenseId: transaction.expense.id }
        : { transactionUuid: transaction.uuid, toCollectiveSlug: transaction.toAccount?.slug };
      const download = downloadInvoiceWith(params);
      return download();
    };

    return [
      {
        type: ActionType.PRIMARY,
        label: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
        if: transaction?.permissions.canRefund && !transaction.isRefunded,
        onClick: () => {
          showConfirmationModal(
            {
              title: intl.formatMessage({
                defaultMessage: 'Are you sure you want to refund this transaction?',
                id: 'RL9ufl',
              }),
              description: intl.formatMessage({
                defaultMessage:
                  'Refunding will reimburse the full amount back to your contributor. They can contribute again in the future.',
                id: 'Ntm6k6',
              }),
              onConfirm: handleRefundTransaction,
              confirmLabel: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
              ConfirmIcon: Undo2,
            },
            {
              onCloseFocusRef: onCloseFocusRef,
            },
          );
        },
        Icon: Undo2,
      },
      {
        type: ActionType.PRIMARY,
        label: intl.formatMessage({ defaultMessage: 'Reject', id: 'actions.reject' }),
        if: transaction?.permissions.canReject,
        onClick: () => {
          showModal(
            TransactionRejectModal,
            {
              id: transaction.id,
              onMutationSuccess,
              canRefund: transaction.permissions.canRefund && !transaction.isRefunded,
            },
            {
              onCloseFocusRef,
              id: `reject-transaction-${transaction.id}`,
            },
          );
        },
        Icon: MinusCircle,
      },
      {
        type: ActionType.SECONDARY,
        label: intl.formatMessage({ defaultMessage: 'View related transactions', id: '+9+Ty6' }),
        onClick: () =>
          resetFilters({
            group: [transaction.group, transaction.refundTransaction?.group].filter(Boolean),
          }),
        Icon: Filter,
        if: Boolean(transaction.group),
      },
      {
        type: ActionType.SECONDARY,
        label: transaction?.expense
          ? intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' })
          : intl.formatMessage({ defaultMessage: 'Download Receipt', id: 'Mwh/vo' }),
        onClick: handleDownloadInvoice,
        if: Boolean(transaction?.permissions.canDownloadInvoice),
        Icon: Download,
      },
    ].filter(a => a.if ?? true);
  };

  return getActions;
};
