import React, { useState, useCallback } from 'react';
import logo from '../../assets/img/icon-128.png';
import {
  loadIdentity,
  setExtensionStateInStorage,
  useIdentity,
} from '../../reducers/identity2';

const generateRandomArrayBuffer = (size: number) => {
  const array = new Uint8Array(size);
  window.crypto.getRandomValues(array);
  return array;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
};

export default function Setup() {
  const onFinishSetup = useCallback(async (userId: string) => {
    console.log('onFinishSetup', userId);
    await loadIdentity(userId);
    await setExtensionStateInStorage(true);
  }, []);

  const handleUseExistingAccount = useCallback(async () => {
    try {
      const randomChallenge = generateRandomArrayBuffer(16);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge,
          rpId: 'eternis.ai',
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) {
        return;
      }

      const userId = new Uint8Array(assertion.response.userHandle);
      const userIdBase64 = arrayBufferToBase64(userId);
      console.log('userIdBase64', userIdBase64);
      await onFinishSetup(userIdBase64);
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-full px-[44px]">
      <img src={logo} alt="logo" className="w-[56px] mt-[73px]" />
      <div className="font-bold text-sm mt-9 mb-2">
        Welcome to Pangea Attestor
      </div>

      <div className="text-sm text-[#1F2937] mt-auto">
        Your account is locked
      </div>

      <div className="flex flex-col mt-2 w-full mb-auto">
        <div
          onClick={handleUseExistingAccount}
          className="bg-[#092EEA] text-white text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-[#092EEA]/80"
        >
          Unlock with Passkey
        </div>
      </div>
    </div>
  );
}
