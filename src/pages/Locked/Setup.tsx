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
  const [username, setUsername] = useState('');
  const onFinishSetup = useCallback(async (userId: string) => {
    console.log('onFinishSetup', userId);
    await loadIdentity(userId);
    await setExtensionStateInStorage(true);
  }, []);

  const handleCreateIdentity = useCallback(async () => {
    try {
      if (!username) {
        return;
      }

      const randomChallenge = generateRandomArrayBuffer(16);
      const userId = generateRandomArrayBuffer(16);

      const publicKeyCredentialCreationOptions = {
        challenge: randomChallenge, // not required as we are not going to verify the challenge
        rp: {
          name: 'Pangea Attestor',
          id: 'eternis.ai',
          transports: ['internal'],
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          requireResidentKey: false,
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
        hints: [],
        extensions: {
          credProps: true,
        },
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (!credential) {
        return;
      }

      const userIdBase64 = arrayBufferToBase64(userId);
      console.log('userIdBase64', userIdBase64);
      await onFinishSetup(userIdBase64);
    } catch (error) {
      console.error(error);
    }
  }, [username]);

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

      // if (!assertion) {
      //   return;
      // }

      // const userId = new Uint8Array(assertion.response.userHandle);
      // const userIdBase64 = arrayBufferToBase64(userId);
      // console.log('userIdBase64', userIdBase64);
      // await onFinishSetup(userIdBase64);
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-full px-[44px]">
      <img src={logo} alt="logo" className="w-[56px] mt-[73px]" />
      <div className="font-bold text-sm mt-9">Welcome to Pangea Attestor</div>

      <div className="flex flex-col gap-2 mt-8 w-full">
        <div className="text-sm text-[#1F2937]">Username</div>
        <input
          type="text"
          placeholder="Pick your username"
          className="border border-[#E4E6EA] rounded-[4px] px-3 py-2 text-sm text-[#1F2937]"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="flex flex-col mt-5 w-full">
        <div
          onClick={handleCreateIdentity}
          className="bg-[#092EEA] text-white text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-[#092EEA]/80"
        >
          Signup
        </div>
      </div>

      <div className="text-sm text-[#1F2937] mt-2">or</div>

      <div className="flex flex-col mt-2 w-full">
        <div
          onClick={handleUseExistingAccount}
          className="bg-[#FFFFFF] text-[#092EEA] border border-[#E4E6EA] text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-gray-100"
        >
          Use existing account
        </div>
      </div>
    </div>
  );
}
