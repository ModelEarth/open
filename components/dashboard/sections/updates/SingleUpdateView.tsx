import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowLeft, BookCheck, Eye, Pencil, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

import { UPDATE_NOTIFICATION_AUDIENCE, UpdateNotificationAudienceLabels } from '../../../../lib/constants/updates';
import { getDateFromValue, toIsoDateStr } from '../../../../lib/date-utils';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import CommentForm from '../../../conversations/CommentForm';
import Thread from '../../../conversations/Thread';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import { Button } from '../../../ui/Button';
import { Select, SelectContent, SelectItem, SelectTriggerMini, SelectValue } from '../../../ui/Select';
import { Skeleton } from '../../../ui/Skeleton';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';

import { MainColumn, SideColumn, SideColumnItem, TwoColumnContainer, UpdateDate } from './common';
import { updateFieldsFragment, updatesDashboardQuery, updateViewQuery } from './queries';

const publishUpdateMutation = gql`
  mutation PublishUpdate($id: String!, $notificationAudience: UpdateAudience) {
    publishUpdate(id: $id, notificationAudience: $notificationAudience) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const deleteUpdateMutation = gql`
  mutation DeleteUpdate($id: String!) {
    deleteUpdate(id: $id) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const LoadingBody = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-24 w-full" />
  </div>
);

const SingleUpdateView = ({ updateId }) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const { account } = React.useContext(DashboardContext);
  const [notificationAudience, setNotificationAudience] = React.useState(UPDATE_NOTIFICATION_AUDIENCE.ALL);
  const { data, loading } = useQuery(updateViewQuery, {
    variables: {
      updateId,
    },
    context: API_V2_CONTEXT,
    onCompleted(data) {
      setNotificationAudience(data.update?.notificationAudience || UPDATE_NOTIFICATION_AUDIENCE.ALL);
    },
  });
  const [deleteUpdate] = useMutation(deleteUpdateMutation, { context: API_V2_CONTEXT });
  const [publishUpdate] = useMutation(publishUpdateMutation, {
    context: API_V2_CONTEXT,
  });

  const update = data?.update;
  const isDraft = !update?.publishedAt;
  const comments = update?.comments;

  const handlePublish = async () => {
    try {
      await publishUpdate({
        variables: { notificationAudience, id: updateId },
        refetchQueries: [
          {
            query: updatesDashboardQuery,
            variables: { slug: account.slug, limit: 20, offset: 0 },
            context: API_V2_CONTEXT,
          },
        ],
      });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Update published" id="update.published" />,
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUpdate({ variables: { id: updateId } });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Update deleted" id="update.deleted" />,
      });
      router.push(getDashboardRoute(account, `updates`));
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <div className="flex max-w-screen-lg flex-col-reverse lg:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <Link className="flex items-center text-sm text-gray-500" href={getDashboardRoute(account, `updates`)}>
          <ArrowLeft size="14px" className="mr-1" />
          <FormattedMessage defaultMessage="Back to updates" id="isPw2F" />
        </Link>
        {loading ? (
          <LoadingBody />
        ) : (
          update && (
            <React.Fragment>
              <TwoColumnContainer>
                <MainColumn>
                  <article className="flex flex-col gap-6">
                    <header>
                      <h1 className="mb-2 text-2xl font-bold">{update.title}</h1>
                      <div className=" text-sm">
                        <UpdateDate update={update} />
                      </div>
                    </header>
                    <HTMLContent content={update.html} />
                    <hr />
                    {update.userCanSeeUpdate && (
                      <footer>
                        {comments?.nodes?.length > 0 && (
                          <Thread
                            collective={account}
                            hasMore={comments?.nodes?.length < comments?.totalCount}
                            // fetchMore={fetchMoreComments}
                            items={comments?.nodes}
                            // onCommentDeleted={() => queryResult.refetch()}
                            // getClickedComment={setReplyingToComment}
                          />
                        )}
                        {!isDraft && (
                          <div className="flex">
                            <CommentForm
                              id="new-update"
                              // replyingToComment={replyingToComment}
                              UpdateId={update.id}
                              // onSuccess={() => queryResult.refetch()}
                            />
                          </div>
                        )}
                      </footer>
                    )}
                  </article>
                </MainColumn>
                <SideColumn>
                  <h1 className="mb-6 text-lg font-bold">
                    <FormattedMessage defaultMessage="Settings" id="settings" />
                  </h1>

                  <div className="flex flex-col gap-8 ">
                    <SideColumnItem>
                      <FormattedMessage defaultMessage="Update type" id="/N24Lt" />
                      {update.isPrivate ? (
                        <FormattedMessage defaultMessage="Private" id="Private" />
                      ) : (
                        <FormattedMessage defaultMessage="Public" id="Public" />
                      )}
                    </SideColumnItem>
                    {update.makePublicOn && (
                      <SideColumnItem>
                        <FormattedMessage id="Update.MakePublicOn" defaultMessage="Automatically make public on" />
                        {toIsoDateStr(getDateFromValue(update.makePublicOn))}
                      </SideColumnItem>
                    )}
                    <SideColumnItem>
                      {update.isPrivate ? (
                        <FormattedMessage defaultMessage="Who can read this update?" id="/N24Lt" />
                      ) : (
                        <FormattedMessage defaultMessage="Who should be notified?" id="+JC301" />
                      )}
                      {isDraft ? (
                        <Select onValueChange={setNotificationAudience} value={notificationAudience}>
                          <SelectTriggerMini>
                            <SelectValue />
                          </SelectTriggerMini>
                          <SelectContent>
                            {Object.keys(UPDATE_NOTIFICATION_AUDIENCE).map(audience => (
                              <SelectItem value={audience} key={audience}>
                                {UpdateNotificationAudienceLabels[audience]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        UpdateNotificationAudienceLabels[update.notificationAudience]
                      )}
                    </SideColumnItem>
                  </div>
                  <hr />
                  <div className="flex gap-2 lg:flex-col lg:justify-stretch">
                    {isDraft && (
                      <Button size="sm" className="gap-1.5" onClick={handlePublish}>
                        <BookCheck size="16px" />
                        <FormattedMessage defaultMessage="Publish" id="syEQFE" />
                      </Button>
                    )}
                    <Link className="w-full" href={`${getCollectivePageRoute(account)}/updates/${update.slug}`}>
                      <Button size="sm" variant="outline" className="w-full gap-1.5">
                        <Eye size="16px" />
                        <FormattedMessage defaultMessage="View Update Page" id="wEQDC6" />
                      </Button>
                    </Link>
                    <Link className="w-full" href={getDashboardRoute(account, `updates/edit/${updateId}`)}>
                      <Button size="sm" variant="outline" className="w-full gap-1.5">
                        <Pencil size="16px" />
                        <FormattedMessage defaultMessage="Edit Update" id="wEQDC6" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="outlineDestructive" className="w-full gap-1.5" onClick={handleDelete}>
                      <Trash size="16px" />
                      <FormattedMessage defaultMessage="Delete Update" id="ef1dfd" />
                    </Button>
                  </div>
                </SideColumn>
              </TwoColumnContainer>
            </React.Fragment>
          )
        )}
      </div>
    </div>
  );
};

export default SingleUpdateView;
