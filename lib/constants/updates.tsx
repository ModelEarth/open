import React from 'react';
import { FormattedMessage } from 'react-intl';

export enum UPDATE_NOTIFICATION_AUDIENCE {
  ALL = 'ALL',
  COLLECTIVE_ADMINS = 'COLLECTIVE_ADMINS',
  FINANCIAL_CONTRIBUTORS = 'FINANCIAL_CONTRIBUTORS',
  NO_ONE = 'NO_ONE',
}

export const UpdateNotificationAudienceLabels = {
  ALL: <FormattedMessage id="UpdateAudience.All" defaultMessage="Everyone" />,
  COLLECTIVE_ADMINS: (
    <FormattedMessage id="UpdateAudience.CollectiveAdmins" defaultMessage="Hosted collective's admins" />
  ),
  FINANCIAL_CONTRIBUTORS: (
    <FormattedMessage id="UpdateAudience.FinancialContributors" defaultMessage="Financial contributors" />
  ),
  NO_ONE: <FormattedMessage id="UpdateAudience.NoOne" defaultMessage="No one" />,
};
