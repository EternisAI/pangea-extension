import React, { useCallback, useState } from 'react';
import logo from '../../assets/img/icon-128.png';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { ArrowRightCircleIcon, XIcon } from 'lucide-react';
import { Identity } from '@semaphore-protocol/identity';
import { useDispatch } from 'react-redux';
import { setIdentity } from '../../reducers/identity';

export default function Lock() {
  const dispatch = useDispatch();
  const [identitySecret, setIdentitySecret] = useState('');

  const handleUseExistingAccount = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({
        type: BackgroundActiontype.request_unlock_extension,
        data: {
          left: window.screenX + 24,
          top: window.screenY,
          width: window.innerWidth - 48,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleUnlockAccount = useCallback(async () => {
    if (identitySecret.length !== 44) {
      return;
    }

    try {
      const storage = await chrome.storage.sync.get('identityPublicKey');
      const identityPublicKey = storage?.identityPublicKey;
      if (!identityPublicKey) {
        return;
      }

      const identity = new Identity(identitySecret);
      const testPublicKey = [
        identity.publicKey[0].toString(),
        identity.publicKey[1].toString(),
      ];
      if (JSON.stringify(testPublicKey) !== identityPublicKey) {
        throw new Error('Invalid identity secret');
        return;
      }

      dispatch(await setIdentity(identitySecret));
    } catch (error) {
      console.error(error);
      setIdentitySecret('');
    }
  }, [identitySecret, dispatch, setIdentity]);

  return (
    <div className="flex flex-col items-center w-full h-full px-[44px]">
      <img src={logo} alt="logo" className="w-[56px] mt-[73px]" />
      <div className="font-bold text-sm mt-9">
        Welcome back to Pangea Attestor
      </div>

      <div className="text-sm text-[#1F2937] mt-8">Unlock your account</div>

      <div className="flex flex-col mt-5 w-full">
        <div
          onClick={handleUseExistingAccount}
          className="bg-[#092EEA] text-white text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-[#092EEA]/80"
        >
          Login with Passkey
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 w-full">
        <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
        <div className="text-sm text-[#1F2937]">or</div>
        <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
      </div>

      <div className="w-full relative mt-3">
        <input
          type={'password'}
          className="border border-[#E4E6EA] rounded-[4px] px-3 py-2 text-sm text-[#1F2937] w-full"
          value={identitySecret}
          onChange={(e) => setIdentitySecret(e.target.value)}
          placeholder="Enter your identity secret"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUnlockAccount();
            }
          }}
        />
        {identitySecret.length === 44 ? (
          <ArrowRightCircleIcon
            onClick={handleUnlockAccount}
            className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          />
        ) : identitySecret.length > 0 ? (
          <XIcon
            onClick={() => {
              setIdentitySecret('');
            }}
            className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          />
        ) : null}
      </div>
    </div>
  );
}
