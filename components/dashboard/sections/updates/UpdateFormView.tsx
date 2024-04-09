import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { is } from 'cypress/types/bluebird';
import dayjs from 'dayjs';
import { Field, Form, Formik } from 'formik';
import { isEmpty, pick, toString } from 'lodash';
import { ArrowLeft, BookCheck, BookDashed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

import { UPDATE_NOTIFICATION_AUDIENCE, UpdateNotificationAudienceLabels } from '../../../../lib/constants/updates';
import { toIsoDateStr } from '../../../../lib/date-utils';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import { cn, formatDate } from '../../../../lib/utils';

import Link from '../../../Link';
import RichTextEditor from '../../../RichTextEditor';
import StyledInputFormikField from '../../../StyledInputFormikField';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Select, SelectContent, SelectItem, SelectTriggerMini, SelectValue } from '../../../ui/Select';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';

import { MainColumn, SideColumn, SideColumnItem, TwoColumnContainer } from './common';
import { updateFieldsFragment, updatesDashboardQuery, updateViewQuery } from './queries';

const CREATE_UPDATE_DEFAULT_VALUES = {
  notificationAudience: UPDATE_NOTIFICATION_AUDIENCE.ALL,
  isPrivate: false,
};

const unpublishUpdateMutation = gql`
  mutation PublishUpdate($id: String!) {
    unpublishUpdate(id: $id) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const createUpdateMutation = gql`
  mutation CreateUpdate($update: UpdateCreateInput!) {
    createUpdate(update: $update) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const editUpdateMutation = gql`
  mutation EditUpdate($update: UpdateUpdateInput!) {
    editUpdate(update: $update) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const FormBody = ({ update }) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!update?.id;
  const isDraft = !update?.publishedAt;
  const { account } = React.useContext(DashboardContext);

  const [createUpdate] = useMutation(createUpdateMutation, { context: API_V2_CONTEXT });
  const [editUpdate] = useMutation(editUpdateMutation, { context: API_V2_CONTEXT, variables: { id: update?.id } });
  const [unpublishUpdate] = useMutation(unpublishUpdateMutation, {
    context: API_V2_CONTEXT,
  });

  const initialValues = pick(
    update || CREATE_UPDATE_DEFAULT_VALUES,
    'id',
    'title',
    'html',
    'isPrivate',
    'makePublicOn',
  );

  const handleSubmit = async values => {
    const action = isEditing ? editUpdate : createUpdate;
    if (!isEditing) {
      values.account = { id: account.id };
    }
    try {
      const response = await action({
        variables: { update: values },
        refetchQueries: [
          {
            query: updatesDashboardQuery,
            variables: { slug: account.slug, limit: 20, offset: 0 },
            context: API_V2_CONTEXT,
          },
        ],
      });
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Update saved" id="update.saved" /> });
      const id = response.data.createUpdate?.id || response.data.editUpdate?.id;
      router.push(getDashboardRoute(account, `updates/${id}`));
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishUpdate({ variables: { id: update.id } });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Update was unpublished" id="update.unpublished" />,
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {formik => (
        <Form>
          <TwoColumnContainer>
            <MainColumn>
              <StyledInputFormikField
                name="title"
                label={<FormattedMessage id="Update.Title" defaultMessage="Title" />}
                required
              >
                {({ field }) => <Input {...field} className="flex-grow" maxLength={255} />}
              </StyledInputFormikField>
              <Field name="html">
                {({ field, meta }) => (
                  <div>
                    <label htmlFor={field.id} className="mb-2 font-bold">
                      <FormattedMessage id="Update.Body" defaultMessage="Body" />
                    </label>
                    <RichTextEditor
                      kind="UPDATE"
                      {...field}
                      inputName={field.name}
                      editorMinHeight={300}
                      editorMaxHeight={'100%'}
                      defaultValue={field.value}
                      withBorders
                      data-cy="update-content-editor"
                      videoEmbedEnabled
                      // setUploading={uploading => this.setState({ uploading })}
                    />
                  </div>
                )}
              </Field>
            </MainColumn>
            <SideColumn>
              <h1 className=" text-lg font-bold">
                <FormattedMessage defaultMessage="Settings" id="settings" />
              </h1>
              <div className="flex flex-col gap-8 ">
                {isEditing && (
                  <SideColumnItem>
                    {update.publishedAt ? (
                      <FormattedMessage id="PublishedOn" defaultMessage="Published on" />
                    ) : (
                      <FormattedMessage id="DraftedOn" defaultMessage="Drafted on" />
                    )}
                    {formatDate(update.publishedAt || update.updatedAt, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </SideColumnItem>
                )}
                <SideColumnItem>
                  <FormattedMessage defaultMessage="Update type" id="/N24Lt" />
                  <StyledInputFormikField name="isPrivate" labelFontSize="12px">
                    {({ field }) => (
                      <Select
                        name={field.name}
                        value={toString(field.value)}
                        onValueChange={value => {
                          const isPrivate = value === 'true';
                          formik.setFieldValue(field.name, isPrivate);
                          if (isPrivate) {
                            formik.setFieldValue('makePublicOn', null);
                          }
                        }}
                      >
                        <SelectTriggerMini
                          id={field.name}
                          className={cn('truncate', { 'border-red-500': field.error })}
                        >
                          <SelectValue />
                        </SelectTriggerMini>
                        <SelectContent>
                          <SelectItem value={'false'}>
                            <FormattedMessage defaultMessage="Public" id="Public" />
                          </SelectItem>
                          <SelectItem value={'true'}>
                            <FormattedMessage defaultMessage="Private" id="Private" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </StyledInputFormikField>
                </SideColumnItem>
                {formik.values.isPrivate && (
                  <SideColumnItem>
                    <FormattedMessage id="Update.MakePublicOn" defaultMessage="Automatically make public on" />
                    <StyledInputFormikField name="makePublicOn" labelFontSize="12px" flexGrow={1} required={false}>
                      {({ field }) => (
                        <Input
                          {...field}
                          onChange={e => {
                            const value = isEmpty(e.target.value) ? null : dayjs(e.target.value).toISOString();
                            formik.setFieldValue(field.name, value);
                          }}
                          value={formik.values.makePublicOn ? toIsoDateStr(new Date(formik.values.makePublicOn)) : ''}
                          type="date"
                          width="100%"
                          maxWidth="40em"
                          min={toIsoDateStr(new Date())}
                        />
                      )}
                    </StyledInputFormikField>
                  </SideColumnItem>
                )}
                {/* <SideColumnItem>
                  {formik.values.isPrivate ? (
                    <FormattedMessage defaultMessage="Who can read this update?" id="/N24Lt" />
                  ) : (
                    <FormattedMessage defaultMessage="Who should be notified?" id="+JC301" />
                  )}
                  <StyledInputFormikField name="notificationAudience" labelFontSize="12px">
                    {({ field }) => (
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={value => formik.setFieldValue(field.name, value)}
                      >
                        <MiniSelectTrigger
                          id={field.name}
                          className={cn('truncate', { 'border-red-500': field.error })}
                        >
                          <SelectValue />
                        </MiniSelectTrigger>
                        <SelectContent>
                          {Object.keys(UPDATE_NOTIFICATION_AUDIENCE).map(audience => (
                            <SelectItem value={audience} key={audience}>
                              {UpdateNotificationAudienceLabels[audience]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </StyledInputFormikField>
                </SideColumnItem> */}
              </div>
              <hr />
              <div className="flex gap-2 lg:flex-col lg:justify-stretch">
                {isDraft ? (
                  <React.Fragment>
                    {/* {isEditing && (
                      <Button size="sm" className="w-full gap-1.5">
                        <BookCheck size="16px" />
                        <FormattedMessage defaultMessage="Publish" id="syEQFE" />
                      </Button>
                    )} */}
                    <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5">
                      <BookDashed size="16px" />
                      <FormattedMessage defaultMessage="Save Draft" id="YH2E7O" />
                    </Button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Button type="submit" size="sm" className="w-full gap-1.5">
                      <BookCheck size="16px" />
                      <FormattedMessage defaultMessage="Save Changes" id="jvo0vs" />
                    </Button>
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={handleUnpublish}>
                      <BookDashed size="16px" />
                      <FormattedMessage defaultMessage="Move to Drafts" id="uRbxVi" />
                    </Button>
                  </React.Fragment>
                )}
                <Link
                  href={
                    isEditing
                      ? getDashboardRoute(account, `updates/${update.id}`)
                      : getDashboardRoute(account, `updates`)
                  }
                >
                  <Button size="sm" variant="outline" className="w-full gap-1.5">
                    <FormattedMessage defaultMessage="Cancel" id="47FYwb" />
                  </Button>
                </Link>
              </div>
            </SideColumn>
          </TwoColumnContainer>
        </Form>
      )}
    </Formik>
  );
};

const UpdateFormView = ({ updateId }) => {
  const isEditing = !!updateId;
  const { account } = React.useContext(DashboardContext);
  const { data, loading } = useQuery(updateViewQuery, {
    variables: {
      updateId,
    },
    context: API_V2_CONTEXT,
    skip: !isEditing,
  });

  return (
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <Link
          className="flex items-center text-sm text-gray-500"
          href={isEditing ? getDashboardRoute(account, `updates/${updateId}`) : getDashboardRoute(account, `updates`)}
        >
          <ArrowLeft size="14px" className="mr-1" />
          {isEditing ? (
            <FormattedMessage defaultMessage="Back to update" id="GdkxiL" />
          ) : (
            <FormattedMessage defaultMessage="Back to updates" id="isPw2F" />
          )}
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditing ? (
            <FormattedMessage defaultMessage="Edit Update" id="wEQDC6" />
          ) : (
            <FormattedMessage defaultMessage="New Update" id="IWsAlq" />
          )}
        </h1>
        {!loading && <FormBody update={data?.update} />}
      </div>
    </div>
  );
};

export default UpdateFormView;
