import React, { createContext, useContext, useReducer } from 'react';

import ConfirmationModal, { ConfirmationModalProps } from './NewConfirmationModal';

interface ModalConfig {
  onCloseFocusRef?: React.MutableRefObject<any>;
  id?: string;
}

interface BaseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCloseAutoFocus?: (e: Event) => void;
}

interface ModalContextValues {
  showModal: <P extends BaseModalProps>(
    component: React.ComponentType<P>,
    modalProps?: Omit<P, keyof BaseModalProps>,
    config?: ModalConfig,
  ) => void;
  showConfirmationModal: (modalProps: ConfirmationModalProps, config?: ModalConfig) => void;
  hideModal: (id: string) => void;
  modals: BaseModal[];
}

type BaseModal = {
  id: string;
  type: ModalType;
  open: boolean;
  onCloseFocusRef?: React.MutableRefObject<any>;
  component?: React.FC<any>;
  modalProps?: any;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const ModalContext = createContext<ModalContextValues>({
  modals: [],
  showModal: () => undefined,
  showConfirmationModal: () => undefined,
  hideModal: () => undefined,
});

const { Provider } = ModalContext;

type BaseModalAction = {
  type: 'openModal' | 'hideModal';
  payload: {
    id: string;
  };
};

enum ModalType {
  COMPONENT = 'COMPONENT',
  CONFIRMATION = 'CONFIRMATION',
}

type OpenModalAction = BaseModalAction & {
  type: 'openModal';
  payload: {
    id: string;
    type: ModalType;
    component?: React.FC<any>;
    modalProps?: unknown;
    onCloseFocusRef?: React.MutableRefObject<any>;
  };
};

type HideModalAction = BaseModalAction & {
  type: 'hideModal';
  payload: {
    id: string;
  };
};

type ModalAction = OpenModalAction | HideModalAction;

const findModalIndex = (modals: BaseModal[], id: string) => modals.findIndex(m => m.id === id);

const reducer = (state: ModalContextValues, action: ModalAction) => {
  const index = findModalIndex(state.modals, action.payload.id);
  switch (action.type) {
    case 'openModal':
      if (index > -1) {
        const updatedModals = [...state.modals];
        updatedModals[index] = {
          ...updatedModals[index],
          ...action.payload,
          open: true,
        };

        return { ...state, modals: updatedModals };
      } else {
        return {
          ...state,
          modals: [...state.modals, { open: true, ...action.payload }],
        };
      }

    case 'hideModal':
      return {
        ...state,
        modals: state.modals.map(m => ({
          ...m,
          open: m.id === action.payload.id ? false : m.open,
        })),
      };
    default:
      throw new Error('Unspecified reducer action');
  }
};

export type CloseComponentType = React.ComponentType<{
  onClick: React.MouseEventHandler<any>;
}>;

export type ContentComponentType = React.ComponentType<{
  className?: string;
  children: React.ReactNode;
}>;

const ModalRoot = () => {
  const { modals, hideModal } = useModal();
  return modals.map(({ component: Component, modalProps, type, id, open, onCloseFocusRef }) => {
    const onCloseAutoFocus = e => {
      if (onCloseFocusRef.current) {
        e.preventDefault();
        onCloseFocusRef.current.focus();
      }
    };

    if (type === ModalType.CONFIRMATION) {
      return (
        <ConfirmationModal
          {...modalProps}
          key={id}
          open={open}
          setOpen={open => (!open ? hideModal(id) : null)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      );
    }
    return (
      <Component
        {...modalProps}
        key={id}
        open={open}
        setOpen={open => {
          if (!open) {
            hideModal(id);
            modalProps.onClose?.();
          }
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        onCloseFocusRef={onCloseFocusRef}
      />
    );
  });
};

const ModalProvider = ({ children }) => {
  const initialState = {
    modals: [],
    showModal: (component, modalProps = {}, config) => {
      const id = config?.id || genId();
      dispatch({ type: 'openModal', payload: { id, component, type: ModalType.COMPONENT, modalProps, ...config } });
      return { id, closeModal: () => dispatch({ type: 'hideModal', payload: { id } }) };
    },
    showConfirmationModal: (modalProps = {}, config) => {
      const id = config?.id || genId();
      dispatch({ type: 'openModal', payload: { id, type: ModalType.CONFIRMATION, modalProps, ...config } });
      return { id, closeModal: () => dispatch({ type: 'hideModal', payload: { id } }) };
    },
    hideModal: id => {
      dispatch({ type: 'hideModal', payload: { id } });
    },
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <Provider value={state}>
      <ModalRoot />
      {children}
    </Provider>
  );
};

const useModal = () => useContext(ModalContext);

export { ModalProvider, useModal };
