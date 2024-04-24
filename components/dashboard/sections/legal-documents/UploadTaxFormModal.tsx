import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { Account, Host, LegalDocument, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { getMessageForRejectedDropzoneFiles } from '../../../../lib/hooks/useImageUploader';

import StyledDropzone, { DROPZONE_ACCEPT_PDF } from '../../../StyledDropzone';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';

const uploadTaxFormMutation = gql`
  mutation UploadTaxForm(
    $id: String!
    $host: AccountReferenceInput!
    $status: LegalDocumentRequestStatus!
    $file: Upload!
  ) {
    editLegalDocumentStatus(id: $id, status: $status, host: $host) {
      id
      status
      documentLink
    }
  }
`;

const MIN_SIZE = 10e2; // in bytes, =1kB
const MAX_SIZE = 10e6; // in bytes, =10MB

export const UploadTaxFormModal = ({
  legalDocument,
  host,
  onSuccess,
  ...props
}: {
  legalDocument: LegalDocument;
  host: Account | Host;
  onSuccess?: () => void;
} & React.ComponentProps<typeof Dialog>) => {
  const intl = useIntl();
  const [file, setFile] = React.useState<File | null>(null);
  const { toast } = useToast();
  const [uploadTaxForm, { loading }] = useMutation(uploadTaxFormMutation, { context: API_V2_CONTEXT });
  return (
    <Dialog {...props} onOpenChange={loading ? null : props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Upload Tax Form" id="bTvaZQ" />
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async e => {
            e.preventDefault();
            try {
              await uploadTaxForm({
                variables: {
                  id: legalDocument.id,
                  host: { id: host.id },
                  status: LegalDocumentRequestStatus.RECEIVED,
                  file,
                },
              });
              props.onOpenChange(false);
              onSuccess?.();
              toast({
                variant: 'success',
                title: intl.formatMessage({ defaultMessage: 'Tax form submitted', id: 'pj+yxv' }),
              });
            } catch (e) {
              toast({
                variant: 'error',
                title: intl.formatMessage({ defaultMessage: 'Failed to submit the tax form', id: 'aip+9Q' }),
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <div className="mb-6 text-base">
            <p className="mb-3">
              <FormattedMessage
                defaultMessage="Use the box below to manually upload the {year} tax form for {account}."
                id="/SbDdx"
                values={{
                  year: legalDocument.year,
                  account: legalDocument.account.name,
                }}
              />
            </p>
            <StyledDropzone
              name="taxFormFileInput"
              accept={DROPZONE_ACCEPT_PDF}
              collectFilesOnly
              minSize={MIN_SIZE}
              maxSize={MAX_SIZE}
              isMulti={false}
              value={file}
              showInstructions
              showIcon
              showActions
              previewSize={56}
              p="16px"
              onSuccess={(accepted, rejected) => {
                if (rejected.length) {
                  toast({
                    variant: 'error',
                    title: intl.formatMessage({ defaultMessage: 'Invalid file', id: 'L0xyX3' }),
                    message: getMessageForRejectedDropzoneFiles(intl, rejected, DROPZONE_ACCEPT_PDF, {
                      minSize: MIN_SIZE,
                      maxSize: MAX_SIZE,
                    }),
                  });
                } else {
                  setFile(accepted[0] || null);
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => props.onOpenChange(false)} disabled={loading}>
              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
            </Button>
            <Button type="submit" loading={loading} disabled={!file}>
              <FormattedMessage defaultMessage="Upload Tax Form" id="TaxForm.Upload" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
