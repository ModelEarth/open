import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Banner from '../components/collectives/Banner';
import CreateCollective from '../components/collectives/sections/CreateCollective';
import FeaturesSection from '../components/collectives/sections/Features';
import FiscalHostSection from '../components/collectives/sections/FiscalHost';
import JoinUsSection from '../components/collectives/sections/JoinUs';
import LearnMoreSection from '../components/collectives/sections/LearnMore';
import MakeCommunitySection from '../components/collectives/sections/MakeCommunity';
import OCUsersSection from '../components/collectives/sections/OCUsers';
import WeAreOpenSection from '../components/collectives/sections/WeAreOpen';
import WhatCanYouDoSection from '../components/collectives/sections/WhatCanYouDo';
import Page from '../components/Page';

const menuItems = { pricing: true, howItWorks: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const HomePage = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
      <Banner />
      <MakeCommunitySection />
      <WhatCanYouDoSection />
      <FeaturesSection />
      <FiscalHostSection />
      <CreateCollective />
      <OCUsersSection />
      <WeAreOpenSection />
      <LearnMoreSection />
      <JoinUsSection />
    </Page>
  );
};

HomePage.getInitialProps = ({ req, res }) => {
  if (res && req && (req.language || req.locale === 'en')) {
    res.set('Cache-Control', 'public, s-maxage=3600');
  }

  let skipDataFromTree = false;

  // If on server side
  if (req) {
    skipDataFromTree = true;
  }

  return { skipDataFromTree };
};

export default HomePage;
