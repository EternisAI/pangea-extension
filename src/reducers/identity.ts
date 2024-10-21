import { Identity } from '@semaphore-protocol/identity';
import { sha256 } from '../utils/misc';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export class IdentityManager {
  async getExtensionState(): Promise<boolean> {
    const storage = await chrome.storage.sync.get('extensionState');
    return storage['extensionState'] ?? false;
  }

  async setExtensionState(state: boolean): Promise<void> {
    await chrome.storage.sync.set({ extensionState: state });
  }

  async getIdentity(): Promise<Identity> {
    const identityStorageId = await sha256('identity');
    try {
      const storage = await chrome.storage.sync.get(identityStorageId);
      const identity = storage[identityStorageId];
      if (!identity) {
        return this._createIdentity();
      }
      return new Identity(identity);
    } catch (e) {
      return this._createIdentity();
    }
  }

  async _saveIdentity(identity: Identity): Promise<void> {
    const identityStorageId = await sha256('identity');
    try {
      await chrome.storage.sync.set({
        [identityStorageId]: identity.privateKey.toString(), // Only PRIVATE KEY is enough to reconstruct the identity
      });
    } catch (e) {
      console.error('Error saving identity', e);
    }
  }

  async _createIdentity(): Promise<Identity> {
    console.log('creating identity');
    const identity = new Identity();
    await this._saveIdentity(identity);
    return identity;
  }

  async loadIdentity(privateKey: string): Promise<Identity> {
    const identity = new Identity(privateKey);
    await this._saveIdentity(identity);
    return identity;
  }
}

export const useIdentity = (): {
  loading: boolean;
  identity: Identity | null;
  setIdentity: Dispatch<SetStateAction<Identity | null>>;
  isLocked: boolean;
  isSetupCompleted: boolean;
  onFinishSetup: (userId: string) => Promise<void>;
  onUnlock: (userId: string) => Promise<void>;
} => {
  const [loading, setLoading] = useState(true);

  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    (async () => {
      const identityManager = new IdentityManager();
      const extensionState = await identityManager.getExtensionState();
      setIsSetupCompleted(extensionState);
      setLoading(false);
    })();
  }, []);

  const onFinishSetup = async (userId: string) => {
    const identityManager = new IdentityManager();
    await identityManager.setExtensionState(true);
    const identity = await identityManager.loadIdentity(userId);
    setIdentity(identity);
    setIsSetupCompleted(true);
    setIsLocked(false);
    console.log('onFinishSetup', identity);
  };

  const onUnlock = async (userId: string) => {
    const identityManager = new IdentityManager();
    const identity = await identityManager.loadIdentity(userId);
    setIdentity(identity);
    setIsLocked(false);
  };

  return {
    loading,
    identity,
    setIdentity,
    isLocked,
    onUnlock,

    isSetupCompleted,
    onFinishSetup,
  };
};
