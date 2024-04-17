import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { groupBy, uniq } from 'lodash';
import { Check, Link as LinkIcon, X } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  ActivityType,
  ContributionDrawerQuery,
  ContributionDrawerQueryVariables,
  ContributionFrequency,
  TransactionKind,
  TransactionType,
} from '../../lib/graphql/types/v2/graphql';
import useClipboard from '../../lib/hooks/useClipboard';
import { i18nTaxType } from '../../lib/i18n/taxes';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import ActivityListItem from '../dashboard/sections/ActivityLog/ActivityListItem';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { Button } from '../ui/Button';
import { Sheet, SheetContent } from '../ui/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
  orderUrl: string;
};

const I18nFrequencyMessages = defineMessages({
  [ContributionFrequency.ONETIME]: {
    id: 'Frequency.OneTime',
    defaultMessage: 'One time',
  },
  [ContributionFrequency.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [ContributionFrequency.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

export function ContributionDrawer(props: ContributionDrawerProps) {
  const intl = useIntl();
  const clipboard = useClipboard();
  const query = useQuery<ContributionDrawerQuery, ContributionDrawerQueryVariables>(
    gql`
      query ContributionDrawer($orderId: Int!) {
        order(order: { legacyId: $orderId }) {
          id
          legacyId
          nextChargeDate
          amount {
            value
            valueInCents
            currency
          }
          totalAmount {
            value
            valueInCents
            currency
          }
          paymentMethod {
            id
            type
          }
          status
          description
          createdAt
          processedAt
          frequency
          tier {
            id
            name
            description
          }
          fromAccount {
            ...ContributionDrawerAccountFields
          }
          toAccount {
            ...ContributionDrawerAccountFields
          }
          platformTipEligible
          platformTipAmount {
            value
            valueInCents
            currency
          }
          hostFeePercent
          tags
          tax {
            type
            idNumber
            rate
          }
          accountingCategory {
            id
            name
            friendlyName
            code
          }
          activities {
            nodes {
              id
              type
              createdAt
              fromAccount {
                ...ContributionDrawerAccountFields
              }
              account {
                ...ContributionDrawerAccountFields
              }
              host {
                ...ContributionDrawerAccountFields
              }
              individual {
                ...ContributionDrawerAccountFields
              }
              data
              transaction {
                ...ContributionDrawerTransactionFields
              }
            }
          }
          customData
          memo
          needsConfirmation
          pendingContributionData {
            expectedAt
            paymentMethod
            ponumber
            memo
            fromAccountInfo {
              name
              email
            }
          }
          transactions {
            ...ContributionDrawerTransactionFields
          }
        }
      }

      fragment ContributionDrawerAccountFields on Account {
        id
        name
        slug
        isIncognito
        type
        imageUrl
        hasImage
        isHost
        isArchived
        ... on Individual {
          isGuest
        }
        ... on AccountWithHost {
          host {
            id
            slug
          }
          approvedAt
        }

        ... on AccountWithParent {
          parent {
            id
            slug
          }
        }
      }

      fragment ContributionDrawerTransactionFields on Transaction {
        id
        uuid
        kind
        amount {
          currency
          valueInCents
        }
        netAmount {
          currency
          valueInCents
        }
        group
        type
        description
        createdAt
        isRefunded
        isRefund
        isOrderRejected
        account {
          ...ContributionDrawerAccountFields
        }
        oppositeAccount {
          ...ContributionDrawerAccountFields
        }
        expense {
          id
          type
        }
        permissions {
          id
          canRefund
          canDownloadInvoice
          canReject
        }
        paymentProcessorUrl
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
  const transactionGroups = React.useMemo(() => buildTransactionGroups(query.data?.order), [query.data?.order]);

  return (
    <Sheet open={props.open} onOpenChange={isOpen => !isOpen && props.onClose()}>
      <SheetContent className="max-w-xl">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <div className="mb-4 flex justify-between">
              <div className="flex items-center gap-2">
                <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
                <div>{isLoading ? <LoadingPlaceholder height={20} /> : `# ${query.data.order.legacyId}`}</div>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onPointerDown={e => {
                        e.stopPropagation();
                      }}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        clipboard.copy(props.orderUrl);
                      }}
                    >
                      <LinkIcon size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {clipboard.isCopied ? (
                      <div className="flex items-center gap-1">
                        <Check size={16} />
                        <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
                      </div>
                    ) : (
                      <FormattedMessage id="Clipboard.CopyShort" defaultMessage="Copy" />
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={props.onClose}>
                <X size={16} />
              </Button>
            </div>
            <div className="text-sm">
              <div className="mb-4 flex flex-col gap-1 border-b pb-4  [&>*>*:first-child]:min-w-[180px] [&>*>*:first-child]:max-w-[240px] [&>*>*:first-child]:shrink-0 [&>*>*:first-child]:grow-0 [&>*>*:first-child]:basis-1/4  [&>*>*:first-child]:text-muted-foreground [&>*>*:last-child]:w-full [&>*>*:last-child]:overflow-hidden [&>*]:flex ">
                <div>
                  <div>Contribution ID</div>
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.legacyId}</div>
                </div>
                <div>
                  <div>Status</div>
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.status}</div>
                </div>
                <div>
                  <div>Needs Confirmation</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.needsConfirmation ? (
                      <FormattedMessage defaultMessage="Yes" id="a5msuh" />
                    ) : (
                      <FormattedMessage defaultMessage="No" id="oUWADl" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Description</div>
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.description}</div>
                </div>
                <div>
                  <div>Tags</div>
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.tags.join(',')}</div>
                </div>
                <div>
                  <div>Tier</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      query.data.order.tier?.name ?? <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Contributor</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      <AccountHoverCard
                        account={query.data.order.fromAccount}
                        trigger={
                          <Link
                            className="flex items-center gap-1 font-medium hover:text-primary hover:underline"
                            href={`/${query.data.order.fromAccount.slug}`}
                          >
                            <Avatar radius={20} collective={query.data.order.fromAccount} />
                            {query.data.order.fromAccount.name}
                          </Link>
                        }
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div>Collective</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      <AccountHoverCard
                        account={query.data.order.toAccount}
                        trigger={
                          <Link
                            className="flex items-center gap-1 font-medium hover:text-primary hover:underline"
                            href={`/${query.data.order.toAccount.slug}`}
                          >
                            <Avatar radius={20} collective={query.data.order.toAccount} />
                            {query.data.order.toAccount.name}
                          </Link>
                        }
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div>Payment Method</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      <PaymentMethodTypeWithIcon type={query.data.order.paymentMethod?.type} iconSize={16} />
                    )}
                  </div>
                </div>
                <div>
                  <div>Memo</div>
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.memo}</div>
                </div>
                <div>
                  <div>Frequency</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : !query.data.order.frequency ? (
                      <FormattedMessage {...I18nFrequencyMessages[ContributionFrequency.ONETIME]} />
                    ) : (
                      <FormattedMessage {...I18nFrequencyMessages[query.data.order.frequency]} />
                    )}
                  </div>
                </div>
                <div>
                  <div>Created At</div>
                  <div>
                    {isLoading ? <LoadingPlaceholder height={20} /> : <DateTime value={query.data.order.createdAt} />}
                  </div>
                </div>
                <div>
                  <div>Processed At</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.processedAt ? (
                      <DateTime value={query.data.order.processedAt} />
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Next charge date</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.nextChargeDate ? (
                      <DateTime value={query.data.order.nextChargeDate} />
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Total Amount</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      <FormattedMoneyAmount
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                        currency={query.data.order.totalAmount.currency}
                        amount={query.data.order.totalAmount.valueInCents}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div>Host Fee percentage</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.hostFeePercent ? (
                      `${query.data.order.hostFeePercent.toFixed(2)}%`
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Amount</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      <FormattedMoneyAmount
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                        currency={query.data.order.amount.currency}
                        amount={query.data.order.amount.valueInCents}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div>Platform Eligible</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.platformTipEligible ? (
                      <FormattedMessage defaultMessage="Yes" id="a5msuh" />
                    ) : (
                      <FormattedMessage defaultMessage="No" id="oUWADl" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Platform Tip</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.platformTipAmount ? (
                      <FormattedMoneyAmount
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                        currency={query.data.order.platformTipAmount?.currency ?? query.data.order.amount.currency}
                        amount={query.data.order.platformTipAmount?.valueInCents ?? 0}
                      />
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Tax Amount</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.tax ? (
                      <FormattedMoneyAmount
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                        currency={query.data.order.amount.currency}
                        amount={(query.data.order.tax?.rate ?? 0) * query.data.order.amount.valueInCents}
                      />
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Tax</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.tax ? (
                      <FormattedMoneyAmount
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                        currency={query.data.order.amount.currency}
                        amount={(query.data.order.tax?.rate ?? 0) * query.data.order.amount.valueInCents}
                      />
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Tax Type</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.tax ? (
                      i18nTaxType(intl, query.data.order.tax.type, 'short')
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Tax Rate</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : query.data.order.tax ? (
                      `${query.data.order.tax?.rate ?? 0}%`
                    ) : (
                      <FormattedMessage defaultMessage="N/A" id="PW+sL4" />
                    )}
                  </div>
                </div>
                <div>
                  <div>Expected Funds data</div>
                  <div>
                    {isLoading ? (
                      <LoadingPlaceholder height={20} />
                    ) : (
                      JSON.stringify(query.data.order.pendingContributionData, null, 2)
                    )}
                  </div>
                </div>
                <div>
                  <div>Custom Data</div>
                  <div>
                    {isLoading ? <LoadingPlaceholder height={20} /> : JSON.stringify(query.data.order.customData)}
                  </div>
                </div>
              </div>
              <div className="mb-4 border-b pb-4">
                <h4 className="whitespace-nowrap text-base font-semibold">
                  <FormattedMessage defaultMessage="Activities" id="UmEsZF" />
                </h4>
                {isLoading ? (
                  <div className="flex flex-col gap-1">
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                  </div>
                ) : (
                  <div>
                    <ContributionActivities order={query.data.order} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="whitespace-nowrap text-base font-semibold">
                  <FormattedMessage defaultMessage="Related Transactions" id="Sz+Qhv" />
                </h4>
                {isLoading ? (
                  <div className="flex flex-col gap-1">
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                    <LoadingPlaceholder height={20} />
                  </div>
                ) : (
                  <div>
                    {transactionGroups.map(txnGroup => (
                      <TransactionGroupItem key={txnGroup.group} transactionGroup={txnGroup} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </SheetContent>
    </Sheet>
  );
}

type TransactionGroup = {
  group: string;
  transactions: ContributionDrawerQuery['order']['transactions'];
};

function buildTransactionGroups(order: ContributionDrawerQuery['order']): TransactionGroup[] {
  const transactions = order?.transactions ?? [];
  if (transactions.length === 0) {
    return [];
  }

  const groups = uniq(transactions.map(txn => txn.group));
  const byGroup = groupBy(transactions, txn => txn.group);

  return groups.map(group => ({
    group,
    transactions: byGroup[group]
      .filter(txn => txn.type === TransactionType.DEBIT)
      .sort((a, b) => {
        if (a.kind === TransactionKind.CONTRIBUTION && b.kind !== TransactionKind.CONTRIBUTION) {
          return -1;
        } else if (a.kind !== TransactionKind.CONTRIBUTION && b.kind === TransactionKind.CONTRIBUTION) {
          return 1;
        }
        return a.createdAt - b.createdAt;
      }),
  }));
}

type TransactionGroupItemProps = {
  transactionGroup: TransactionGroup;
};

function TransactionGroupItem(props: TransactionGroupItemProps) {
  const primaryTransaction = (props.transactionGroup?.transactions || []).find(
    txn => txn.kind === TransactionKind.CONTRIBUTION && txn.type === TransactionType.DEBIT,
  );
  if (!primaryTransaction) {
    return null;
  }

  return (
    <div>
      <Accordion type="single" collapsible className="max-w-prose">
        <AccordionItem className="border-b-0" value="item-1">
          <AccordionTrigger>
            <div className="flex gap-3">
              <DateTime value={primaryTransaction.createdAt} dateStyle="medium" timeStyle="medium" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{primaryTransaction.description}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {primaryTransaction.paymentProcessorUrl && (
              <div>
                <Link href={primaryTransaction.paymentProcessorUrl}>View in payment processor dashboard</Link>
              </div>
            )}
            <div>
              {props.transactionGroup.transactions.map(txn => (
                <div key={txn.id} className="flex gap-3">
                  <DateTime value={txn.createdAt} dateStyle="medium" timeStyle="medium" />
                  <span className="whitespace-nowrap">{txn.type}</span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{txn.description}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

type ContributionActivitiesProps = {
  order: ContributionDrawerQuery['order'];
};

function ContributionActivities(props: ContributionActivitiesProps) {
  const filteredActivities = props.order.activities.nodes.filter(a => {
    if (
      a.type === ActivityType.COLLECTIVE_TRANSACTION_CREATED &&
      (a.transaction.kind !== TransactionKind.CONTRIBUTION || a.transaction.type !== TransactionType.DEBIT)
    ) {
      return false;
    }

    return true;
  });

  return filteredActivities.map(activity => <ActivityListItem key={activity.id} activity={activity} />);
}
