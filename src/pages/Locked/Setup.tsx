import React, { useCallback, useState } from 'react';
import logo from '../../assets/img/icon-128.png';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { ArrowRightCircleIcon, XIcon } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setIdentity } from '../../reducers/identity';

export default function Setup({
  setCreateNewIdentity,
}: {
  setCreateNewIdentity: (value: boolean) => void;
}) {
  const dispatch = useDispatch();
  const [showIdentityInput, setShowIdentityInput] = useState(false);
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
      console.log('error', error);
    }
  }, []);

  const handleCreateAccount = useCallback(async () => {
    if (identitySecret.length !== 44) {
      return;
    }

    const userId = identitySecret;

    try {
      dispatch(await setIdentity(userId));
    } catch (error) {
      console.log('error', error);
    }
  }, [identitySecret, dispatch, setIdentity]);

  return (
    <div className="flex flex-col items-center w-full h-full px-[44px]">
      <img src={logo} alt="logo" className="w-[56px] mt-[73px]" />
      <div className="font-bold text-sm mt-9">Welcome to Pangea Attestor</div>

      <div className="flex flex-col mt-5 w-full">
        <div
          onClick={() => setCreateNewIdentity(true)}
          className="bg-[#092EEA] text-white text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-[#092EEA]/80"
        >
          Get Started
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 w-full">
        <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
        <div className="text-sm text-[#1F2937]">or</div>
        <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
      </div>

      <div className="flex flex-col mt-2 w-full">
        <div className="text-sm text-[#1F2937] mb-2">
          I already have an account
        </div>
        <div
          onClick={handleUseExistingAccount}
          className="bg-[#FFFFFF] text-[#092EEA] text-sm py-2 w-full text-center font-medium cursor-pointer hover:bg-gray-100 rounded-md"
        >
          With Passkey
        </div>

        {showIdentityInput ? (
          <div className="w-full relative">
            <input
              type={'password'}
              className="border border-[#E4E6EA] rounded-[4px] px-3 py-2 text-sm text-[#1F2937] w-full"
              value={identitySecret}
              onChange={(e) => setIdentitySecret(e.target.value)}
              placeholder="Enter your identity secret"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateAccount();
                }
              }}
            />
            {identitySecret.length === 44 ? (
              <ArrowRightCircleIcon
                onClick={handleCreateAccount}
                className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              />
            ) : (
              <XIcon
                onClick={() => {
                  setIdentitySecret('');
                  setShowIdentityInput(false);
                }}
                className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              />
            )}
          </div>
        ) : (
          <div
            onClick={() => setShowIdentityInput(true)}
            className="bg-[#FFFFFF] text-[#092EEA] text-sm py-2 w-full text-center font-medium cursor-pointer hover:bg-gray-100 rounded-md"
          >
            With Identity Secret
          </div>
        )}
      </div>
    </div>
  );
}
