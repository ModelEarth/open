import 'cypress-file-upload';
import './third-party-commands';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { loggedInUserQuery } from '../../../lib/graphql/queries';

import { CreditCards } from '../../stripe-helpers';

import { defaultTestUserEmail } from './data';
import { randomEmail, randomSlug } from './faker';

/**
 * Login with an existing account. If not provided in `params`, the email used for
 * authentication will be `defaultTestUserEmail`.
 *
 * @param {object} params:
 *    - redirect: The redirect URL
 *    - email: User email
 */
Cypress.Commands.add('login', (params = {}) => {
  const { email = defaultTestUserEmail, redirect = null, visitParams, sendLink } = params;
  const user = { email, newsletterOptIn: false };

  return signinRequest(user, redirect, sendLink).then(({ body: { redirect } }) => {
    // Test users are allowed to signin directly with E2E, thus a signin URL
    // is directly returned by the API. See signin function in
    // opencollective-api/server/controllers/users.js for more info
    return cy.visit(redirect, visitParams).then(() => user);
  });
});

Cypress.Commands.add('logout', () => {
  cy.getByDataCy('user-menu-trigger').click();
  cy.getByDataCy('logout').click();
});

/**
 * Create a new account an SignIn. If no email is provided in `params`, the account
 * will be generated using a random email.
 */
Cypress.Commands.add('signup', ({ user = {}, redirect = '/', visitParams } = {}) => {
  if (!user.email) {
    user.email = randomEmail();
  }

  return signinRequest(user, redirect).then(({ body: { redirect } }) => {
    // Test users are allowed to signin directly with E2E, thus a signin URL
    // is directly returned by the API. See signin function in
    // opencollective-api/server/controllers/users.js for more info
    const token = getTokenFromRedirectUrl(redirect);
    if (token) {
      return getLoggedInUserFromToken(token).then(user => {
        return cy.visit(redirect, visitParams).then(() => user);
      });
    } else {
      return cy.visit(redirect, visitParams).then(() => user);
    }
  });
});

/**
 * Open a link not covered by `baseUrl`.
 * See https://github.com/cypress-io/cypress/issues/1777
 */
Cypress.Commands.add('openExternalLink', url => {
  cy.visit('/signin').then(window => {
    const linkIdentifier = '__TMP_CY_EXTERNAL_LINK__';
    const link = window.document.createElement('a');
    link.innerHTML = linkIdentifier;
    link.setAttribute('href', url);
    link.setAttribute('id', linkIdentifier);
    window.document.body.appendChild(link);
    cy.get(`#${linkIdentifier}`).click();
  });
});

/**
 * Returns all the email sent by the API
 */
Cypress.Commands.add('getInbox', () => {
  return cy
    .request({
      url: `${Cypress.env('MAILDEV_URL')}/email`,
      method: 'GET',
    })
    .then(({ body }) => {
      return body;
    });
});

/**
 * Navigate to an email in maildev.
 *
 * API must be configured to use maildev
 * - configured by default in development, e2e and ci environments
 * - otherwise MAILDEV_CLIENT=true and MAILDEV_SERVER=true
 *
 * @param emailMatcher {func} - used to find the email. Gets passed an email. To see the
 *  list of all fields, check https://github.com/djfarrelly/MailDev/blob/master/docs/rest.md
 */
Cypress.Commands.add('openEmail', emailMatcher => {
  return loopOpenEmail(emailMatcher);
});

/**
 * Gets an email in maildev.
 *
 * API must be configured to use maildev
 * - configured by default in development, e2e and ci environments
 * - otherwise MAILDEV_CLIENT=true and MAILDEV_SERVER=true
 *
 * @param emailMatcher {func} - used to find the email. Gets passed an email. To see the
 *  list of all fields, check https://github.com/djfarrelly/MailDev/blob/master/docs/rest.md
 */
Cypress.Commands.add('getEmail', emailMatcher => {
  return getEmail(emailMatcher);
});

/**
 * Clear maildev inbox.
 */
Cypress.Commands.add('clearInbox', () => {
  return cy.request({
    url: `${Cypress.env('MAILDEV_URL')}/email/all`,
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });
});

/**
 * Create a collective. Admin will be the user designated by `email`. If not
 * provided, the email used will default to `defaultTestUserEmail`.
 */
Cypress.Commands.add('createCollective', ({ type = 'ORGANIZATION', email = defaultTestUserEmail, ...params }) => {
  const user = { email, newsletterOptIn: false };
  return signinRequest(user, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQuery(token, {
      operationName: 'createCollective',
      query: `
          mutation createCollective($collective: CollectiveInputType!) {
            createCollective(collective: $collective) {
              id
              slug
              name
              description
              longDescription
              website
              imageUrl
              settings
            }
          }
        `,
      variables: { collective: { location: {}, name: 'TestOrg', slug: '', tiers: [], type, ...params } },
    }).then(({ body }) => {
      return body.data.createCollective;
    });
  });
});

/**
 * Calls the mutation to edit the settings of an account
 */
Cypress.Commands.add('editCollective', (collective, userEmail = defaultTestUserEmail) => {
  return signinRequestAndReturnToken({ email: userEmail }).then(token => {
    return graphqlQuery(token, {
      operationName: 'EditCollective',
      query: `
        mutation EditCollective($collective: CollectiveInputType!) {
          editCollective(collective: $collective) {
            id
            slug
            name
            settings
            location {
              id
              country
            }
          }
        }
      `,
      variables: { collective },
    }).then(({ body }) => {
      return body.data.createCollective;
    });
  });
});

/**
 * Create a collective. Admin will be the user designated by `email`. If not
 * provided, the email used will default to `defaultTestUserEmail`.
 */
Cypress.Commands.add('createHostedCollectiveV2', ({ email = defaultTestUserEmail, testPayload } = {}) => {
  return cy.createCollectiveV2({
    email,
    testPayload,
    host: { slug: 'opensourceorg' },
    collective: {
      repositoryUrl: 'https://github.com/opencollective',
    },
  });
});

/**
 * Create a expense.
 */
Cypress.Commands.add('createExpense', ({ userEmail = defaultTestUserEmail, account, ...params } = {}) => {
  const expense = {
    tags: ['Engineering'],
    type: 'INVOICE',
    payoutMethod: { type: 'PAYPAL', data: { email: userEmail || randomEmail() } },
    description: 'Expense 1',
    items: [{ description: 'Some stuff', amount: 1000 }],
    ...params,
  };

  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQueryV2(token, {
      operationName: 'createExpense',
      query: `
          mutation createExpense($expense: ExpenseCreateInput!, $account: AccountReferenceInput!) {
            createExpense(expense: $expense, account: $account) {
              id
              legacyId
              account {
                id
                slug
              }
            }
          }
        `,
      variables: { expense, account },
      failOnStatusCode: false,
    }).then(({ body }) => {
      return body.data.createExpense;
    });
  });
});

/**
 * Create a collective hosted by the open source collective.
 * TODO: Migrate this to GQLV2 -> `createCollective` with `automateApprovalWithGithub` set to true
 */
Cypress.Commands.add('createHostedCollective', ({ userEmail = defaultTestUserEmail, ...collectiveParams } = {}) => {
  const collective = {
    slug: randomSlug(),
    name: 'Test Collective',
    type: 'COLLECTIVE',
    ...collectiveParams,
  };

  return signinRequest({ email: userEmail }, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQuery(token, {
      operationName: 'CreateCollectiveWithHost',
      query: `
        mutation CreateCollectiveWithHost($collective: CollectiveInputType!) {
          createCollectiveFromGithub(collective: $collective) {
            id
            slug
            isActive
            host {
              id
            }
          }
        }
        `,
      variables: { collective },
    }).then(({ body }) => {
      return body.data.createCollectiveFromGithub;
    });
  });
});

Cypress.Commands.add('createProject', ({ userEmail = defaultTestUserEmail, collective } = {}) => {
  const project = {
    name: 'test-project',
    slug: randomSlug(),
    description: 'make the world a better place',
  };

  return signinRequest({ email: userEmail }, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQueryV2(token, {
      operationName: 'CreateProject',
      query: `
        mutation CreateProject($project: ProjectCreateInput!, $parent: AccountReferenceInput) {
          createProject(project: $project, parent: $parent) {
            id
            name
            slug
            description
            __typename
          }
        }
      `,
      variables: { project, parent: { slug: collective.slug } },
    }).then(({ body }) => {
      return body.data.createProject;
    });
  });
});

/**
 * Add a stripe credit card on the collective designated by `collectiveSlug`.
 */
Cypress.Commands.add('addCreditCardToCollective', ({ collectiveSlug }) => {
  cy.login({ redirect: `/${collectiveSlug}/admin/payment-methods` });
  cy.contains('button', 'Add a credit card').click();
  cy.wait(2000);
  fillStripeInput();
  cy.wait(1000);
  cy.contains('button[type="submit"]', 'Save').click();
  cy.wait(2000);
});

/**
 * Fill a stripe creditcard input.
 *
 * @param container {DOM|null} pass it if you have multiple stripe inputs on the page
 * @param {object} cardParams the credit card info. Defaults to a valid card
 *    - creditCardNumber
 *    - expirationDate
 *    - cvcCode
 *    - postalCode
 */
Cypress.Commands.add('fillStripeInput', fillStripeInput);

/**
 * Completes a 3DSecure Stripe modal
 *
 * @param {boolean} approve: Set to false to reject
 */
Cypress.Commands.add('complete3dSecure', (approve = true) => {
  const iframeSelector = 'iframe[name^="__privateStripeFrame"]';
  const targetBtn = approve ? '#test-source-authorize-3ds' : '#test-source-fail-3ds';

  cy.get(iframeSelector)
    .should($stripeFrame => {
      const frameContent = $stripeFrame.contents();
      const challengeFrame = frameContent.find('body iframe#challengeFrame');
      expect(challengeFrame).to.exist;

      const acsFrame = challengeFrame.contents().find('iframe[name="acsFrame"]');
      expect(acsFrame).to.exist;

      const frameBody = acsFrame.contents().find('body');
      expect(frameBody).to.exist;

      expect(frameBody.find(targetBtn)).to.exist;
    })
    .then($iframe => {
      const btn = cy.wrap(
        $iframe
          .contents()
          .find('body iframe#challengeFrame')
          .contents()
          .find('iframe[name="acsFrame"]')
          .contents()
          .find('body')
          .find(targetBtn),
      );

      btn.click();
    });
});

Cypress.Commands.add('iframeLoaded', { prevSubject: 'element' }, $iframe => {
  const contentWindow = $iframe.prop('contentWindow');
  return new Promise(resolve => {
    if (contentWindow && contentWindow.document.readyState === 'complete') {
      resolve(contentWindow);
    } else {
      $iframe.on('load', () => {
        resolve(contentWindow);
      });
    }
  });
});

/**
 * To use on the "Payment" step in the contribution flow.
 * Use the first payment method if available or fill the
 * stripe form otherwise.
 */
Cypress.Commands.add('useAnyPaymentMethod', () => {
  return cy.get('#PaymentMethod').then($paymentMethod => {
    // Checks if the organization already has a payment method configured
    if (!$paymentMethod.text().includes('VISA **** 4242')) {
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
    }
  });
});

/**
 * A helper for the `StepsProgress` component to check that the steps in params
 * are enabled or disabled. `enabled` and `disabled` can both be passed an array
 * of strings or a single string.
 */
Cypress.Commands.add('checkStepsProgress', ({ enabled = [], disabled = [] }) => {
  const isEnabled = step => cy.get(`[data-cy="progress-step-${step}"][data-disabled=false]`);
  const isDisabled = step => cy.get(`[data-cy="progress-step-${step}"][data-disabled=true]`);

  Array.isArray(enabled) ? enabled.forEach(isEnabled) : isEnabled(enabled);
  Array.isArray(disabled) ? disabled.forEach(isDisabled) : isDisabled(disabled);
});

Cypress.Commands.add('checkToast', ({ type, message }) => {
  const $toast = cy.contains('[data-cy="toast-notification"]', message);
  if (type) {
    $toast.should('have.attr', 'data-type', type);
  }
});

/**
 * Check if user is logged in by searching for its username in navbar
 */
Cypress.Commands.add('assertLoggedIn', user => {
  cy.log('Ensure user is logged in');
  cy.getByDataCy('user-menu-trigger').should('be.visible');
  if (user) {
    cy.getByDataCy('user-menu-trigger').click();
    cy.contains('[data-cy="user-menu"]', user.email);
    cy.getByDataCy('user-menu-trigger').click(); // To close the menu
  }
});

/**
 * A helper to fill input fields generated by the `InputField` component.
 */
Cypress.Commands.add('fillInputField', (fieldname, value, cypressOptions) => {
  return cy.get(`.inputField.${fieldname} input`, cypressOptions).type(value);
});

/**
 * Wrapper around `get` specialized to retrieve data from `data-cy`. You can pass an array
 * for deeper queries.
 */
Cypress.Commands.add('getByDataCy', (query, params) => {
  if (Array.isArray(query)) {
    return cy.get(
      query.map(elem => `[data-cy="${elem}"]`),
      params,
    );
  } else {
    return cy.get(`[data-cy="${query}"]`, params);
  }
});

/**
 * Wrapper around `contains` specialized to retrieve data from `data-cy`. You can pass an array
 * for deeper queries.
 */
Cypress.Commands.add('containsInDataCy', (query, content, params) => {
  if (Array.isArray(query)) {
    return cy.contains(
      query.map(elem => `[data-cy="${elem}"]`),
      content,
      params,
    );
  } else {
    return cy.contains(`[data-cy="${query}"]`, content, params);
  }
});

/**
 * Waits for user to be logged in (or timeout)
 * @param {object} params: passed to `cy.get`
 */
Cypress.Commands.add('waitForLoggedIn', params => {
  return cy.getByDataCy('user-menu-trigger', params);
});

/**
 * Add 2FA to a test account
 */
Cypress.Commands.add('enableTwoFactorAuth', ({ userEmail = defaultTestUserEmail, userSlug, secret } = {}) => {
  let authToken;
  return signinRequestAndReturnToken({ email: userEmail, slug: userSlug }, null).then(token => {
    authToken = token;
    return graphqlQueryV2(authToken, {
      operationName: 'AccountHasTwoFactorAuth',
      query: `
        query AccountHasTwoFactorAuth($slug: String) {
          individual(slug: $slug) {
            id
            slug
            name
            type
            id
            slug
            name
            type
            ... on Individual {
              hasTwoFactorAuth
            }
          }
        }
          `,
      variables: { slug: userSlug },
      options: { context: API_V2_CONTEXT },
    })
      .then(({ body }) => {
        const account = {
          id: body.data.individual.id,
        };
        const token = secret;

        return graphqlQueryV2(authToken, {
          operationName: 'AddTwoFactorAuthToIndividual',
          query: `
          mutation AddTwoFactorAuthToIndividual($account: AccountReferenceInput!, $token: String!) {
            addTwoFactorAuthTokenToIndividual(account: $account, token: $token) {
              account {
                id
                ... on Individual {
                  hasTwoFactorAuth
                }
              }
              recoveryCodes
            }
          }
        `,
          variables: { account, token },
          options: { context: API_V2_CONTEXT },
        });
      })
      .then(({ body }) => {
        return body.data;
      });
  });
});

Cypress.Commands.add('complete2FAPrompt', code => {
  cy.get('#2fa-code-input').type(code);
  cy.contains('button', 'Verify').click();
});

let localStorageSnapshot = {};

Cypress.Commands.add('resetLocalStorage', () => {
  localStorageSnapshot = {};
  localStorage.clear();
});

Cypress.Commands.add('saveLocalStorage', () => {
  localStorageSnapshot = {};
  Object.keys(localStorage).forEach(key => {
    localStorageSnapshot[key] = localStorage[key];
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(localStorageSnapshot).forEach(key => {
    localStorage.setItem(key, localStorageSnapshot[key]);
  });
});

Cypress.Commands.add('getStripePaymentElement', getStripePaymentElement);

Cypress.Commands.add('createCollectiveV2', ({ email = defaultTestUserEmail, testPayload, host, collective } = {}) => {
  const user = { email, newsletterOptIn: false };
  return signinRequest(user, null).then(response => {
    const token = getTokenFromRedirectUrl(response.body.redirect);
    return graphqlQueryV2(token, {
      operationName: 'createCollective',
      query: `
          mutation createCollective($collective: CollectiveCreateInput!, $host: AccountReferenceInput!, $testPayload: JSON) {
            createCollective(collective: $collective, host: $host, testPayload: $testPayload) {
              id
              slug
              name
              description
              settings
            }
          }
        `,
      variables: {
        host,
        testPayload: testPayload || null,
        collective: {
          name: 'TestCollective',
          slug: randomSlug(),
          description: 'A test collective',
          ...collective,
        },
      },
    }).then(({ body }) => {
      return body.data.createCollective;
    });
  });
});

// ---- Private ----

/**
 * @param {object} user - should have `email` and `id` set
 */
function signinRequest(user, redirect, sendLink) {
  return cy.request({
    url: '/api/users/signin',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, redirect, createProfile: true, sendLink }),
  });
}

function getTokenFromRedirectUrl(url) {
  const regex = /\/signin\/([^?]+)/;
  return regex.exec(url)[1];
}

/**
 * @param {object} user - should have `email` and `id` set
 */
function signinRequestAndReturnToken(user, redirect) {
  return signinRequest(user, redirect, true).then(({ body }) => getTokenFromRedirectUrl(body.redirect));
}

function graphqlQuery(token, body) {
  return cy.request({
    url: '/api/graphql/v1',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function graphqlQueryV2(token, body) {
  return cy.request({
    url: '/api/graphql/v2',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function getLoggedInUserFromToken(token) {
  return graphqlQuery(token, {
    operationName: 'LoggedInUser',
    query: loggedInUserQuery.loc.source.body,
  }).then(({ body }) => {
    return body.data.LoggedInUser;
  });
}

/**
 * @param {object} params
 *   - container
 *   - card
 */
function fillStripeInput(params) {
  const { container, card } = params || {};
  const stripeIframeSelector = '.__PrivateStripeElement iframe';
  const iframePromise = container ? container.find(stripeIframeSelector) : cy.get(stripeIframeSelector);
  const cardParams = card || CreditCards.CARD_DEFAULT;

  return iframePromise.then(iframe => {
    const { creditCardNumber, expirationDate, cvcCode, postalCode } = cardParams;
    const body = iframe.contents().find('body');
    const fillInput = (index, value) => {
      if (value === undefined) {
        return;
      }

      return cy.wrap(body).find(`input:eq(${index})`).type(`{selectall}${value}`, { force: true });
    };

    fillInput(1, creditCardNumber);
    fillInput(2, expirationDate);
    fillInput(3, cvcCode);
    fillInput(4, postalCode);
  });
}

function loopOpenEmail(emailMatcher, timeout = 8000) {
  return getEmail(emailMatcher, timeout).then(email => {
    return cy.openExternalLink(`${Cypress.env('MAILDEV_URL')}/email/${email.id}/html`);
  });
}

function getEmail(emailMatcher, timeout = 8000) {
  if (timeout < 0) {
    return assert.fail('Could not find email: getEmail timed out');
  }

  return cy.getInbox().then(inbox => {
    const email = inbox.find(emailMatcher);
    if (email) {
      return cy.wrap(email);
    }
    cy.wait(100);
    return getEmail(emailMatcher, timeout - 100);
  });
}

function getStripePaymentElement() {
  const stripeIframeSelector = '.__PrivateStripeElement iframe';
  const iframePromise = cy.get(stripeIframeSelector).first();

  return iframePromise.then(iframe => {
    return iframe.contents().find('body');
  });
}
