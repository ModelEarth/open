/**
 * @deprecated Will be replaced by `components/navigation/TopBar` when Workspace moves out of preview feature
 */

import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';
import theme from '../lib/theme';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import NewTopBar from './navigation/TopBar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Image from './Image';
import Link from './Link';
import PopupMenu from './PopupMenu';
import SearchModal from './Search';
import SearchIcon from './SearchIcon';
import StyledButton from './StyledButton';
import StyledLink from './StyledLink';
import { Span } from './Text';
import TopBarMobileMenu from './TopBarMobileMenu';
import TopBarProfileMenu from './TopBarProfileMenu';

const NavList = styled(Flex)`
  list-style: none;
  min-width: 12.5rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
  width: 140px;
`;

const NavButton = styled(StyledButton)`
  color: #323334;
  font-weight: 500;
  font-size: 16px;
  padding: 10px;
  cursor: pointer;
  @media (hover: hover) {
    :hover {
      background-color: white !important;
    }
  }
  :focus {
    background-color: white;
    border-radius: 1px;
  }
  :active {
    color: black;
  }
`;

const NavItem = styled(StyledLink)`
  color: #323334;
  font-weight: 500;
  font-size: 14px;
  @media (hover: hover) {
    :hover {
      text-decoration: underline;
    }
  }
`;

const TopBar = ({ showSearch, menuItems, showProfileAndChangelogMenu, account, navTitle, loading }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const ref = useRef();
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const router = useRouter();
  // We debounce this function to avoid conflicts between the menu button and TopBarMobileMenu useGlobalBlur hook.
  const debouncedSetShowMobileMenu = debounce(setShowMobileMenu);

  const toggleMobileMenu = () => {
    debouncedSetShowMobileMenu(state => !state);
  };

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');

  const useDashboard =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD) ||
    (onDashboardRoute && !LoggedInUser && loadingLoggedInUser);

  if (useDashboard) {
    return <NewTopBar {...{ showSearch, menuItems, showProfileAndChangelogMenu, account, navTitle, loading }} />;
  }

  return (
    <Flex
      px={3}
      py={showSearch ? 2 : 3}
      alignItems="center"
      flexDirection="row"
      justifyContent="space-around"
      css={{ height: theme.sizes.navbarHeight, background: 'white', borderBottom: '1px solid rgb(232, 233, 235)' }}
      ref={ref}
    >
      <Link href="/">
        <Flex alignItems="center">
          <Image width="36" height="36" src="/static/images/opencollective-icon.png" alt="Open Collective" />
          <Hide xs sm md>
            <Box mx={2}>
              <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
            </Box>
          </Hide>
        </Flex>
      </Link>

      <Flex alignItems="center" justifyContent={['flex-end', 'flex-end', 'center']} flex="1 1 auto">
        <Hide xs sm>
          <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
            {menuItems.solutions && (
              <PopupMenu
                zIndex={2000}
                closingEvents={['focusin', 'mouseover']}
                Button={({ onMouseOver, onClick, popupOpen, onFocus }) => (
                  <NavButton
                    isBorderless
                    onMouseOver={onMouseOver}
                    onFocus={onFocus}
                    onClick={onClick}
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage defaultMessage="Solutions" />
                    {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </NavButton>
                )}
                placement="bottom"
                popupMarginTop="-10px"
              >
                <NavLinkContainer>
                  <Link href="/collectives">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />
                    </NavItem>
                  </Link>
                  <Link href="/become-a-sponsor">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage defaultMessage="For Sponsors" />
                    </NavItem>
                  </Link>
                  <Link href="/become-a-host">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage id="pricing.fiscalHost" defaultMessage="For Fiscal Hosts" />
                    </NavItem>
                  </Link>
                </NavLinkContainer>
              </PopupMenu>
            )}

            {menuItems.product && (
              <PopupMenu
                zIndex={2000}
                closingEvents={['focusin', 'mouseover']}
                Button={({ onClick, onMouseOver, popupOpen, onFocus }) => (
                  <NavButton
                    isBorderless
                    onMouseOver={onMouseOver}
                    onFocus={onFocus}
                    onClick={onClick}
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage id="ContributionType.Product" defaultMessage="Product" />
                    {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </NavButton>
                )}
                placement="bottom"
                popupMarginTop="-10px"
              >
                <NavLinkContainer>
                  <Link href="/pricing">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                    </NavItem>
                  </Link>
                  <Link href="/how-it-works">
                    <NavItem as={Container}>
                      <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                    </NavItem>
                  </Link>
                  <Link href="/fiscal-hosting">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage id="editCollective.fiscalHosting" defaultMessage="Fiscal Hosting" />
                    </NavItem>
                  </Link>
                </NavLinkContainer>
              </PopupMenu>
            )}

            {menuItems.company && (
              <PopupMenu
                zIndex={2000}
                closingEvents={['focusin', 'mouseover']}
                Button={({ onClick, onMouseOver, popupOpen, onFocus }) => (
                  <NavButton
                    isBorderless
                    onMouseOver={onMouseOver}
                    onFocus={onFocus}
                    onClick={onClick}
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage id="company" defaultMessage="Company" />
                    {popupOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </NavButton>
                )}
                placement="bottom"
                popupMarginTop="-10px"
              >
                <NavLinkContainer>
                  <a href="https://blog.opencollective.com/">
                    <NavItem as={Container} mt={16} mb={16}>
                      <FormattedMessage id="company.blog" defaultMessage="Blog" />
                    </NavItem>
                  </a>
                  <Link href="/e2c">
                    <NavItem as={Container} mb={16}>
                      <FormattedMessage id="OC.e2c" defaultMessage="Exit to Community" />
                    </NavItem>
                  </Link>
                  <a href="https://docs.opencollective.com/help/about/introduction">
                    <NavItem as={Container} mb={16}>
                      <FormattedMessage id="collective.about.title" defaultMessage="About" />
                    </NavItem>
                  </a>
                </NavLinkContainer>
              </PopupMenu>
            )}
            {menuItems.docs && (
              <Link href="/help">
                <NavButton as={Container} whiteSpace="nowrap">
                  <FormattedMessage defaultMessage="Help & Support" />
                </NavButton>
              </Link>
            )}
            {showSearch && menuItems.docs && <Container borderRight="2px solid #DCDDE0" height="20px" padding="5px" />}
          </NavList>
        </Hide>
        {showSearch && (
          <NavButton isBorderless onClick={() => setShowSearchModal(true)}>
            <Flex>
              <SearchIcon fill="#75777A" size={18} />
              <Hide xs sm>
                <Span ml="5px">
                  <FormattedMessage id="Search" defaultMessage="Search" />
                </Span>
              </Hide>
            </Flex>
          </NavButton>
        )}
        {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}
      </Flex>

      {showProfileAndChangelogMenu && (
        <React.Fragment>
          <div className="mr-2 hidden sm:block">
            <ChangelogTrigger />
          </div>
          <TopBarProfileMenu />
        </React.Fragment>
      )}
      <Hide md lg>
        <Box mx={3} onClick={toggleMobileMenu}>
          <Flex as="a">
            <MenuIcon color="#aaaaaa" size={24} />
          </Flex>
        </Box>
        {showMobileMenu && <TopBarMobileMenu closeMenu={toggleMobileMenu} />}
      </Hide>
    </Flex>
  );
};

TopBar.propTypes = {
  showSearch: PropTypes.bool,
  showProfileAndChangelogMenu: PropTypes.bool,
  menuItems: PropTypes.object,
  account: PropTypes.object,
  navTitle: PropTypes.string,
  loading: PropTypes.bool,
};

TopBar.defaultProps = {
  showSearch: true,
  showProfileAndChangelogMenu: true,
  menuItems: { solutions: true, product: true, company: true, docs: true },
};

export default TopBar;
