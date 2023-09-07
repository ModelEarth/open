import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { Dialog, DialogContent } from './ui/Dialog';
import SearchForm from './SearchForm';
/*
 * A modal that appears on top of the page containing a search field.
 */
const SearchModal = ({ open, setOpen }) => {
  const intl = useIntl();
  const onClose = () => setOpen(false);
  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent hideCloseButton className="overflow-hidden p-0 sm:rounded-full">
        <SearchForm
          autoFocus
          borderColor="transparent"
          overflow="hidden"
          fontSize="14px"
          height="52px"
          placeholder={intl.formatMessage({ defaultMessage: 'Search for Collectives, organizations, and more...' })}
          showSearchButton
          searchButtonStyles={{ width: '32px', height: '32px' }}
          closeSearchModal={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

SearchModal.propTypes = {
  onClose: PropTypes.func,
  showLinkToDiscover: PropTypes.bool,
};

export default SearchModal;
