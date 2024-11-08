import React, { useState, useCallback, useEffect } from 'react';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { useDispatch } from 'react-redux';
import {
  ArrowLeft,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import {
  arrayBufferToBase64,
  generateRandomArrayBuffer,
} from '../../utils/misc';
import { setIdentity } from '../../reducers/identity';

export default function NewIdentity({
  setCreateNewIdentity,
}: {
  setCreateNewIdentity: (value: boolean) => void;
}) {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [identitySecret, setIdentitySecret] = useState('');
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [userConsent, setUserConsent] = useState(false);

  const [showIdentitySecret, setShowIdentitySecret] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const allowPasskey = username.length > 0 && isPasskeySupported === true;
  const allowAccountCreate = username.length > 0 && userConsent === true;

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('mac') !== -1) {
      setIsPasskeySupported(true);
    }
    if (userAgent.indexOf('win') !== -1) {
      setIsPasskeySupported(true);
    }
  }, []);

  useEffect(() => {
    const identitySecret = generateRandomArrayBuffer(32);
    setIdentitySecret(arrayBufferToBase64(identitySecret));
  }, []);

  const handleCreateIdentity = useCallback(async () => {
    if (!allowPasskey) {
      return;
    }

    try {
      if (!username) {
        return;
      }

      const userId = identitySecret;

      await chrome.runtime.sendMessage({
        type: BackgroundActiontype.request_create_identity,
        data: {
          left: window.screenX + 24,
          top: window.screenY,
          width: window.innerWidth - 48,
          username,
          userId,
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
  }, [username, dispatch, identitySecret, allowPasskey]);

  const handleCreateAccount = useCallback(async () => {
    if (!allowAccountCreate) {
      return;
    }

    const userId = identitySecret;

    try {
      dispatch(await setIdentity(userId));
    } catch (error) {
      console.log('error', error);
    }
  }, [allowAccountCreate, identitySecret, dispatch, setIdentity]);

  const handleCopyIdentitySecret = useCallback(() => {
    navigator.clipboard.writeText(identitySecret);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  }, [identitySecret]);

  return (
    <>
      <div className="flex items-center w-full mt-5">
        <ArrowLeft
          onClick={() => setCreateNewIdentity(false)}
          className="cursor-pointer opacity-50 hover:opacity-100 h-4 w-4 ml-5"
        />
      </div>
      <div className="flex flex-col items-center w-full h-full px-[44px]">
        {/* <img src={logo} alt="logo" className="w-[56px] mt-[73px]" />
      <div className="font-bold text-sm mt-9">Welcome to Pangea Attestor</div> */}

        <div className="flex flex-col gap-2 mt-8 w-full">
          <div className="text-sm text-[#1F2937]">Username (Required)</div>
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
            onClick={() => handleCreateIdentity()}
            className={`
              bg-[#092EEA] text-white text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-[#092EEA]/80
              ${!allowPasskey ? 'opacity-50 cursor-not-allowed hover:bg-[#092EEA]' : ''}
            `}
          >
            Secure with Passkey
            <br />
            {isPasskeySupported
              ? '(Recommended)'
              : isPasskeySupported === false
                ? 'Not Supported'
                : ''}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 w-full">
          <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
          <div className="text-sm text-[#1F2937]">or</div>
          <div className="h-[1px] w-full bg-[#E4E6EA]"></div>
        </div>

        <div className="flex flex-col gap-2 mt-4 w-full">
          <div className="flex items-center gap-2">
            <div className="text-sm text-[#1F2937] mr-auto">
              Save Your Identity Secret
            </div>
            {isCopied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon
                onClick={() => handleCopyIdentitySecret()}
                className="cursor-pointer opacity-50 hover:opacity-100 w-4 h-4"
              />
            )}
            {showIdentitySecret ? (
              <EyeIcon
                onClick={() => setShowIdentitySecret(!showIdentitySecret)}
                className="cursor-pointer opacity-50 hover:opacity-100 w-4 h-4"
              />
            ) : (
              <EyeOffIcon
                onClick={() => setShowIdentitySecret(!showIdentitySecret)}
                className="cursor-pointer opacity-50 hover:opacity-100 w-4 h-4"
              />
            )}
          </div>
          <input
            type={showIdentitySecret ? 'text' : 'password'}
            className="border border-[#E4E6EA] rounded-[4px] px-3 py-2 text-sm text-[#1F2937] bg-[#E4E6EA] w-full"
            value={identitySecret}
            readOnly
          />
        </div>

        <div className="flex items-start gap-2 mt-6 w-full">
          <input
            type="checkbox"
            className="mt-1"
            checked={userConsent}
            onChange={(e) => setUserConsent(e.target.checked)}
          />
          <div className="text-sm text-[#1F2937] flex flex-col">
            <div>Identity Secret is the only way to generate your account.</div>
            <div>It needs to be kept securely and not shared with anyone.</div>
            <div>
              Your account cannot be recovered if you lose your Identity Secret.
            </div>
          </div>
        </div>

        <div className="flex flex-col mt-2 w-full">
          <div
            onClick={() => handleCreateAccount()}
            className={`
              bg-[#FFFFFF] text-[#092EEA] border border-[#E4E6EA] text-sm py-5 w-full rounded-lg text-center font-medium cursor-pointer hover:bg-gray-100
              ${!allowAccountCreate ? 'opacity-50 cursor-not-allowed hover:bg-[#FFFFFF]' : ''}
            `}
          >
            Create Account
          </div>
        </div>
      </div>
    </>
  );
}
