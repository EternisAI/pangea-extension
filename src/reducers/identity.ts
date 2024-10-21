import { Identity } from '@semaphore-protocol/identity';
import { sha256 } from '../utils/misc';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export class IdentityManager {
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
  identity: Identity | null;
  setIdentity: Dispatch<SetStateAction<Identity | null>>;
  locked: boolean;
  getIdentity: () => Promise<Identity | null>;
  loading: boolean;
} => {
  const MAXIMUM_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [identity, setIdentity] = useState<Identity | null>(null);

  const getIdentity = async () => {
    console.log('getIdentity');

    // reset for testing
    await chrome.storage.local.set({ lastUnlockedTimestamp: 0 });

    const lastUnlockedTimestamp = (
      await chrome.storage.local.get('lastUnlockedTimestamp')
    ).lastUnlockedTimestamp;
    const currentTimestamp = Date.now();
    console.log('lastUnlockedTimestamp', lastUnlockedTimestamp);
    console.log('currentTimestamp', currentTimestamp);
    // setLocked(false);

    if (
      lastUnlockedTimestamp &&
      currentTimestamp - lastUnlockedTimestamp.lastUnlockedTimestamp >
        MAXIMUM_TIME
    ) {
      setLocked(true);
      return null;
    }

    const identityManager = new IdentityManager();
    const identity = await identityManager.getIdentity();
    // await chrome.storage.local.set({ lastUnlockedTimestamp: currentTimestamp });
    // setLocked(false);
    setIdentity(identity);
    return identity;
  };

  useEffect(() => {
    (async () => {
      // const identityManager = new IdentityManager();
      // const identity = await identityManager.getIdentity();
      // setIdentity(identity);
      await getIdentity();
      setLoading(false);
    })();
  }, []);
  return { identity, setIdentity, locked, getIdentity, loading };
};
