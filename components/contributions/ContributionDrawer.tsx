import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Drawer, DrawerHeader } from '../Drawer';
import LoadingPlaceholder from '../LoadingPlaceholder';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
};

export function ContributionDrawer(props: ContributionDrawerProps) {
  const query = useQuery(
    gql`
      query ContributionDrawer($orderId: Int!) {
        order(order: { legacyId: $orderId }) {
          legacyId
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        orderId: props.orderId,
      },
      skip: !props.open || !props.orderId,
    },
  );

  const isLoading = !query.called || query.loading || query.data?.order?.legacyId !== props.orderId;

  return (
    <Drawer open={props.open} onClose={props.onClose}>
      <DrawerHeader
        title={
          <div className="flex gap-2">
            <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
            <div>{isLoading ? <LoadingPlaceholder height={20} /> : `# ${query.data.order.legacyId}`}</div>
          </div>
        }
        onClose={props.onClose}
        statusTag={'oi!'}
      />
    </Drawer>
  );
}
