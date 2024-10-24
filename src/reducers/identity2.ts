import { Identity } from '@semaphore-protocol/identity';
import { useSelector } from 'react-redux';
import { AppRootState } from './index';
import deepEqual from 'fast-deep-equal';

enum ActionType {
  '/identity/setIdentity' = '/identity/setIdentity',
  '/identity/setLoading' = '/identity/setLoading',
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
  meta?: any;
};

type State = {
  loading: boolean;
  identity: Identity | null;
  isSetupCompleted: boolean;
};

const initState: State = {
  loading: true,
  identity: null,
  isSetupCompleted: false,
};

export const setIdentity = async (
  userId: string | null,
): Promise<
  Action<{ identity: Identity | null; isSetupCompleted?: boolean }>
> => {
  if (!userId) {
    return {
      type: ActionType['/identity/setIdentity'],
      payload: {
        identity: null,
      },
    };
  }

  const storage = await chrome.storage.sync.get('isSetupCompleted');
  const isSetupCompleted = storage?.isSetupCompleted ?? false;
  if (!isSetupCompleted) {
    await chrome.storage.sync.set({ isSetupCompleted: true });
  }
  console.log('identity', userId);
  const identity = new Identity(userId);
  return {
    type: ActionType['/identity/setIdentity'],
    payload: {
      identity,
      isSetupCompleted: true,
    },
  };
};

export const initIdentity = async () => {
  // await chrome.storage.sync.remove('isSetupCompleted');
  const storage = await chrome.storage.sync.get('isSetupCompleted');
  console.log('storage', storage);
  const isSetupCompleted = storage?.isSetupCompleted ?? false;
  return {
    type: ActionType['/identity/setLoading'],
    payload: {
      loading: false,
      isSetupCompleted,
    },
  };
};

export default function identity(
  state = initState,
  action: Action<any>,
): State {
  switch (action.type) {
    case ActionType['/identity/setIdentity']:
      return {
        ...state,
        ...action.payload,
      };

    case ActionType['/identity/setLoading']:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

export const useIdentity = (): {
  loading: boolean;
  identity: Identity | null;
  isSetupCompleted: boolean;
} => {
  return useSelector((state: AppRootState) => {
    return {
      loading: state.identity.loading,
      identity: state.identity.identity ?? null,
      isSetupCompleted: state.identity.isSetupCompleted ?? false,
    };
  }, deepEqual);
};
