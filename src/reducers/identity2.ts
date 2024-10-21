import { Identity } from '@semaphore-protocol/identity';
import { sha256 } from '../utils/misc';
import { useSelector } from 'react-redux';
import { AppRootState } from './index';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/identity/setIdentity' = '/identity/setIdentity',
  '/identity/setExtensionState' = '/identity/setExtensionState',
  '/identity/setIsLocked' = '/identity/setIsLocked',
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
  meta?: any;
};

type State = {
  identity: Identity | null;
  extensionState: boolean;
  isLocked: boolean;
};

const initState: State = {
  identity: null,
  extensionState: false,
  isLocked: true,
};

export const setIdentity = (
  identity: Identity | null,
): Action<Identity | null> => ({
  type: ActionType['/identity/setIdentity'],
  payload: identity,
});

export const setExtensionState = (state: boolean): Action<boolean> => ({
  type: ActionType['/identity/setExtensionState'],
  payload: state,
});

export const setIsLocked = (isLocked: boolean): Action<boolean> => ({
  type: ActionType['/identity/setIsLocked'],
  payload: isLocked,
});

export default function identity(
  state = initState,
  action: Action<any>,
): State {
  switch (action.type) {
    case ActionType['/identity/setIdentity']:
      return {
        ...state,
        identity: action.payload,
      };
    case ActionType['/identity/setExtensionState']:
      return {
        ...state,
        extensionState: action.payload,
      };
    case ActionType['/identity/setIsLocked']:
      return {
        ...state,
        isLocked: action.payload,
      };
    default:
      return state;
  }
}

export const getExtensionState = async (): Promise<boolean> => {
  const storage = await chrome.storage.sync.get('extensionState');
  return storage['extensionState'] ?? false;
};

export const setExtensionStateInStorage = async (
  state: boolean,
): Promise<void> => {
  await chrome.storage.sync.set({ extensionState: state });
};

export const getIdentity = async (): Promise<Identity> => {
  const identityStorageId = await sha256('identity');
  try {
    const storage = await chrome.storage.sync.get(identityStorageId);
    const identity = storage[identityStorageId];
    if (!identity) {
      return createIdentity();
    }
    return new Identity(identity);
  } catch (e) {
    return createIdentity();
  }
};

const saveIdentity = async (identity: Identity): Promise<void> => {
  const identityStorageId = await sha256('identity');
  try {
    await chrome.storage.sync.set({
      [identityStorageId]: identity.privateKey.toString(),
    });
  } catch (e) {
    console.error('Error saving identity', e);
  }
};

const createIdentity = async (): Promise<Identity> => {
  console.log('creating identity');
  const identity = new Identity();
  await saveIdentity(identity);
  return identity;
};

export const loadIdentity = async (privateKey: string): Promise<Identity> => {
  const identity = new Identity(privateKey);
  await saveIdentity(identity);
  return identity;
};

export const useIdentity = (): {
  loading: boolean;
  identity: Identity | null;
  isLocked: boolean;
  isSetupCompleted: boolean;
} => {
  return useSelector((state: AppRootState) => {
    return {
      loading: false,
      identity: state.identity.identity ?? null,
      isLocked: state.identity.isLocked ?? true,
      isSetupCompleted: state.identity.extensionState ?? false,
    };
  }, deepEqual);
};
