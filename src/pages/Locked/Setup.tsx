import React, { useState, useCallback } from 'react';
import logo from '../../assets/img/icon-128.png';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { useDispatch } from 'react-redux';

export default function Setup() {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');

  const handleCreateIdentity = useCallback(async () => {
    try {
      if (!username) {
        return;
      }

      await chrome.runtime.sendMessage({
        type: BackgroundActiontype.request_create_identity,
        data: {
          left: window.screenX + 24,
          top: window.screenY,
          username,
        },
      });
    } catch (error) {
      console.log('error', error);
      await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 1,
        height: 1,
      });
    }
  }, [username, dispatch]);

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
      console.log('error', error);
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
