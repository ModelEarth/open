import { gql } from '@apollo/client';

export const updateFieldsFragment = gql`
  fragment UpdateFields on Update {
    id
    title
    slug
    isPrivate
    isChangelog
    createdAt
    publishedAt
    updatedAt
    makePublicOn
    notificationAudience
    userCanSeeUpdate
    summary
    tags
    fromAccount {
      id
      slug
      name
      imageUrl
      type
    }
    account {
      id
      slug
      name
      imageUrl
      type
    }
    reactions
    comments(limit: 10) {
      totalCount
      nodes {
        id
        createdAt
        fromAccount {
          id
          slug
          name
          imageUrl
          type
        }
        html
      }
    }
  }
`;

export const updatesDashboardQuery = gql`
  query UpdatesDashboard($slug: String, $limit: Int, $offset: Int) {
    account(slug: $slug) {
      id
      updates(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          ...UpdateFields
        }
      }
    }
  }

  ${updateFieldsFragment}
`;

export const updateViewQuery = gql`
  query UpdateView($updateId: String!) {
    update(id: $updateId) {
      id
      html
      ...UpdateFields
    }
  }

  ${updateFieldsFragment}
`;
