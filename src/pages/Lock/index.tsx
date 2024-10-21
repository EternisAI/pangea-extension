import React, { useEffect, useState } from 'react';
import logo from '../../assets/img/icon-128.png';

// import React, { useState, useEffect } from 'react';
// import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return window.btoa(binary);
};

export default function Lock() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('passkey_publicKey');
    const storedPublicKey = localStorage.getItem('passkey_publicKey');
    if (storedPublicKey) {
      setPublicKey(storedPublicKey);
      setIsRegistered(true);
    }
    // (async () => {
    //   const credentials = await navigator.credentials.get();
    //   console.log(credentials);
    // })();
  }, []);

  const generateChallenge = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
  };

  const register = async () => {
    try {
      console.log('register');
      const challenge = generateChallenge();
      const id = new Uint8Array(16);
      const origin = window.location.hostname;

      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Passkey Demo App',
          id: origin,
        },
        user: {
          id,
          name: 'demo@example.com',
          displayName: 'Demo User',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
        password: {
          id,
          name: 'demo@example.com',
          origin,
          password: '123456',
        },
      });

      if (!credential) {
        throw new Error('Credential not found');
      }
      console.log(credential);

      const publicKeyBase64 = arrayBufferToBase64(
        credential.response.getPublicKey(),
      );
      setPublicKey(publicKeyBase64);
      localStorage.setItem('passkey_publicKey', publicKeyBase64);
      setIsRegistered(true);
      setError(null);

      const existingCredential = await navigator.credentials.get({
        publicKey: publicKeyCredentialCreationOptions,
      });

      console.log('existingCredential', existingCredential);
    } catch (err) {
      console.log(err);
      if (err instanceof Error) {
        setError(`Registration failed: ${err.message}`);
      } else {
        setError(`Registration failed: ${err}`);
      }
    }
  };

  const authenticate = async () => {
    try {
      console.log('authenticate');

      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      console.log('assertion', assertion);

      // In a real-world scenario, you would verify the assertion on the server
      // Here, we're just checking if an assertion was returned
      if (assertion) {
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err) {
      console.log(err);
      setError(`Authentication failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden bg-[#F9FAFB]">
      <div className="mb-8">
        <img src={logo} alt="logo" className="w-16 h-16" />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-gray-800">
        Welcome to Pangea Attestor
      </h1>
      <p className="text-gray-600 mb-12 text-center max-w-xs">
        Please use your passkey to unlock the extension
      </p>
      <button
        className="cursor-pointer border border-[#092EEA] bg-[#092EEA] hover:bg-[#0721A8] text-white text-sm font-medium py-3 px-6 rounded-lg text-center w-64 transition duration-300 ease-in-out"
        onClick={() => {
          if (isRegistered) {
            authenticate();
          } else {
            register();
          }
        }}
      >
        Continue with Passkey
      </button>
    </div>
  );
}
