import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { StackedAvatars } from '../../../Avatar';
import EmojiReactions from '../../../conversations/EmojiReactions';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { DashboardSectionProps } from '../../types';

import { UpdateDate, UpdateStatus } from './common';
import { updatesDashboardQuery } from './queries';
import SingleUpdateView from './SingleUpdateView';
import UpdateFormView from './UpdateFormView';

const UpdatePost = ({ update }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4">
      <div>
        <div className="flex justify-between">
          <Link href={`${router.asPath}/${update.id}`} className="text-xl font-medium">
            {update.title}
          </Link>
          <UpdateStatus update={update} />
        </div>
        <div className="text-sm">
          <UpdateDate update={update} />
        </div>
      </div>
      {update.summary && <HTMLContent content={update.summary} />}
      <div className="flex flex-grow justify-between">
        <div>
          <EmojiReactions reactions={update.reactions} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <StackedAvatars
            accounts={update.comments?.nodes?.map(comment => comment.fromAccount)}
            maxDisplayedAvatars={5}
            imageSize={24}
          />
          <FormattedMessage
            id="update.comments"
            defaultMessage="{count, plural,=0 {No comments} one {# comment} other {# comments}}"
            values={{ count: update.comments?.totalCount }}
          />
        </div>
      </div>
    </div>
  );
};

const UpdatesList = () => {
  const { account } = React.useContext(DashboardContext);
  const { data, loading } = useQuery(updatesDashboardQuery, {
    variables: {
      slug: account.slug,
      limit: 20,
      offset: 0,
    },
    context: API_V2_CONTEXT,
  });

  return (
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <DashboardHeader
          title={<FormattedMessage id="Updates" defaultMessage="Updates" />}
          description={
            <FormattedMessage
              id="Dashboard.Updates.Subtitle"
              defaultMessage="Updates from your account that are visible to people following your account"
            />
          }
          actions={
            <Link href={getDashboardRoute(account, 'updates/new')}>
              <Button size="sm" className="gap-1.5">
                <FormattedMessage defaultMessage="Create Update" id="IWsAlq" />
              </Button>
            </Link>
          }
        />
        <div className="order-1 space-y-6 xl:order-none xl:col-span-2 ">
          {
            // eslint-disable-next-line react/no-array-index-key
            loading && Array.from({ length: 3 }).map((_, index) => <Skeleton className="h-4 w-80" key={index} />)
          }
          {!loading && data?.account?.updates?.nodes?.map(update => <UpdatePost key={update.id} update={update} />)}

          {/* <TodoList /> */}
          {/* <Timeline accountSlug={slug} withFilter /> */}
        </div>
      </div>
    </div>
  );
};

enum UpdateDashboardAction {
  EDIT = 'edit',
  NEW = 'new',
}

const Updates = ({ subpath }: DashboardSectionProps) => {
  const [action, id] = subpath;

  if (Object.values(UpdateDashboardAction).includes(action as UpdateDashboardAction)) {
    return <UpdateFormView updateId={action === UpdateDashboardAction.EDIT ? id : null} />;
  } else if (action) {
    return <SingleUpdateView updateId={action} />;
  } else {
    return <UpdatesList />;
  }
};

export default Updates;
