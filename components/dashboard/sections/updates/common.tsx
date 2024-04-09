import React from 'react';
import { FormattedMessage } from 'react-intl';

import { elementFromClass } from '../../../../lib/react-utils';
import { formatDate } from '../../../../lib/utils';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import LinkCollective from '../../../LinkCollective';
import { Badge } from '../../../ui/Badge';

export const TwoColumnContainer = elementFromClass('div', 'flex flex-col gap-6 lg:flex-row lg:gap-10');
export const MainColumn = elementFromClass('div', 'flex w-full max-w-2xl flex-col gap-6');
const SideColumnWrapper = elementFromClass('div', 'w-full lg:max-w-56');
export const SideColumn = ({ children }) => (
  <SideColumnWrapper>
    <div className="sticky top-10 flex flex-col gap-6">{children}</div>
  </SideColumnWrapper>
);

export const SideColumnItem = ({ children }) => {
  const [label, ...items] = children;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="text-xs font-bold">{label}</div>
      {items}
    </div>
  );
};

export const UpdateStatus = ({ update }) => {
  let type, message;
  if (update.publishedAt) {
    type = 'info';
    message = <FormattedMessage id="update.status.published" defaultMessage="Published" />;
    if (update.isPrivate) {
      message = (
        <React.Fragment>
          {message}&nbsp;(
          <FormattedMessage id="Private" defaultMessage="Private" />)
        </React.Fragment>
      );
    }
  } else {
    type = 'neutral';
    message = <FormattedMessage id="update.status.drafted" defaultMessage="Drafted" />;
  }
  return (
    <Badge type={type} className="ml-2 inline-flex self-start" size="sm">
      {message}
    </Badge>
  );
};

export const UpdateDate = ({ update }) => {
  const author = (
    <AccountHoverCard
      key={update.fromAccount.id}
      account={update.fromAccount}
      includeAdminMembership={{ accountSlug: update.account.slug }}
      trigger={
        <div className="mx-1 inline-flex flex-row items-baseline gap-1">
          <Avatar collective={update.fromAccount} radius={16} className="self-center" />
          <LinkCollective collective={update.fromAccount} />
        </div>
      }
    />
  );

  return update.publishedAt ? (
    <FormattedMessage
      id="update.publishedAtBy"
      defaultMessage="Published on {date} by {author}"
      values={{
        date: formatDate(update.publishedAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        author,
      }}
    />
  ) : (
    <FormattedMessage
      id="update.draftedBy"
      defaultMessage="Drafted on {date} by {author}"
      values={{
        date: formatDate(update.createdAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        author,
      }}
    />
  );
};
