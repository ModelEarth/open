import React from 'react';
import { LucideIcon } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';
import type { BaseModalProps } from './ModalContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlertDialog';
import { toast } from './ui/useToast';

const messages = defineMessages({
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
});

const confirmBtnMsgs = defineMessages({
  confirm: {
    id: 'confirm',
    defaultMessage: 'Confirm',
  },
  delete: {
    id: 'actions.delete',
    defaultMessage: 'Delete',
  },
  remove: {
    id: 'Remove',
    defaultMessage: 'Remove',
  },
});

/**
 * ConfirmationModal component. Uses `StyledModal` to create a reusable modal mainly for
 * confirmation purpose.
 */

export type ConfirmationModalProps = {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive';
  type?: 'confirm' | 'delete' | 'remove';
  onConfirm: () => void | Promise<any>;
  confirmLabel?: React.ReactNode;
  ConfirmIcon?: LucideIcon;
  onCancel?: () => void;
  cancelLabel?: React.ReactNode;
  onCloseFocusRef?: React.MutableRefObject<HTMLElement>;
};
const ConfirmationModal = ({
  title,
  description,
  children,
  open,
  setOpen,
  variant = 'default',
  type = 'confirm',
  cancelLabel,
  confirmLabel,
  ConfirmIcon,
  onCancel,
  onConfirm,
  ...props
}: BaseModalProps & ConfirmationModalProps) => {
  const [submitting, setSubmitting] = React.useState(false);
  const { formatMessage } = useIntl();
  const handleClose = () => setOpen(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen} {...props}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus} {...props}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting} onClick={onCancel} autoFocus data-cy="confirmation-modal-cancel">
            {cancelLabel || formatMessage(messages.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            loading={submitting}
            data-cy="confirmation-modal-continue"
            onClick={async e => {
              e.preventDefault();
              try {
                setSubmitting(true);
                await onConfirm();
                handleClose();
              } catch (error) {
                toast({ variant: 'error', message: error.message });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {ConfirmIcon && <ConfirmIcon size={16} />}
            {confirmLabel || formatMessage(confirmBtnMsgs[type])}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
