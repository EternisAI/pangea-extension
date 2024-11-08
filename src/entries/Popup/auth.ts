import { BackgroundActiontype, AuthActiontype } from '../Background/rpc';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../utils/misc';

const webAuthnAuthenticate = async () => {
  try {
    const randomChallenge = new Uint8Array(16);
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

    // @ts-expect-error assertion type needs to be defined globally
    const userId = new Uint8Array(assertion.response.userHandle);
    const userIdBase64 = arrayBufferToBase64(userId);
    chrome.runtime.sendMessage({
      type: BackgroundActiontype.close_auth_popup,
      data: {
        userId: userIdBase64,
      },
    });
  } catch (error) {
    console.error('error', error);
    chrome.runtime.sendMessage({
      type: BackgroundActiontype.close_auth_popup,
      data: {
        userId: null,
      },
    });
  }
};

const webAuthnRegister = async (username: string, userIdBase64: string) => {
  try {
    const userId = base64ToArrayBuffer(userIdBase64);

    const publicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(16), // not required as we are not going to verify the challenge
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
      // @ts-expect-error type not supported
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (!credential) {
      return;
    }

    chrome.runtime.sendMessage({
      type: BackgroundActiontype.close_auth_popup,
      data: {
        userId: userIdBase64,
      },
    });
  } catch (error) {
    console.error('error', error);
    chrome.runtime.sendMessage({
      type: BackgroundActiontype.close_auth_popup,
      data: {
        userId: null,
      },
    });
  }
};

// start listening for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === AuthActiontype.web_authn_authenticate) {
    webAuthnAuthenticate();
  } else if (message.type === AuthActiontype.web_authn_register) {
    const { username, userId } = message.data;
    webAuthnRegister(username, userId);
  }
});
