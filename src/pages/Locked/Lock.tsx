import React, { useCallback } from 'react';
import logo from '../../assets/img/icon-128.png';
import { BackgroundActiontype } from '../../entries/Background/rpc';

export default function Lock() {
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
    </div>
  );
}
