import React, { useEffect } from 'react';
import * as Comlink from 'comlink';
import { OffscreenActionTypes } from './types';
import {
  NotaryServer,
  Prover as _Prover,
  RemoteAttestation,
  AttestationObject,
} from '@eternis/tlsn-js';

import { urlify, bigintToHex } from '../../utils/misc';
import { BackgroundActiontype } from '../Background/rpc';
import browser from 'webextension-polyfill';
import { Proof } from '../../utils/types';
import { Method } from '@eternis/tlsn-js/wasm/pkg';
import { IdentityManager } from '../../reducers/identity';

const { init, verify_attestation, Prover, NotarizedSession, TlsProof }: any =
  Comlink.wrap(new Worker(new URL('./worker.ts', import.meta.url)));

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}

const Offscreen = () => {
  useEffect(() => {
    (async () => {
      const loggingLevel = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_logging_level,
      });

      // @ts-ignore
      chrome.runtime.onMessage.addListener(
        async (request, sender, sendResponse) => {
          switch (request.type) {
            case OffscreenActionTypes.remote_attestation_verification: {
              console.log(
                'OffscreenActionTypes.remote_attestation_verification',
              );
              const remoteAttestation: RemoteAttestation =
                request.data.remoteAttestation;
              const nonce = request.data.nonce;
              const pcrs = request.data.pcrs;
              console.log(
                'OffscreenActionTypes.remote_attestation_verification',
                remoteAttestation,
                pcrs,
              );

              try {
                await init({ loggingLevel });
              } catch (error) {
                console.log('wasm aready init');
              }
              const result = await verify_attestation(
                remoteAttestation,
                nonce,
                pcrs,
              );

              console.log('remoteAttestation', remoteAttestation);

              chrome.runtime.sendMessage({
                type: OffscreenActionTypes.remote_attestation_verification_response,
                data: result,
              });
              break;
            }
            case OffscreenActionTypes.notarization_request: {
              const { id } = request.data;

              (async () => {
                try {
                  const proof = await withRetry(() =>
                    createProof(request.data),
                  );
                  browser.runtime.sendMessage({
                    type: BackgroundActiontype.finish_prove_request,
                    data: {
                      id,
                      proof,
                    },
                  });

                  browser.runtime.sendMessage({
                    type: OffscreenActionTypes.notarization_response,
                    data: {
                      id,
                      proof,
                    },
                  });
                } catch (error) {
                  console.error('All attempts failed:', error);
                  browser.runtime.sendMessage({
                    type: BackgroundActiontype.finish_prove_request,
                    data: {
                      id,
                      error,
                    },
                  });

                  browser.runtime.sendMessage({
                    type: OffscreenActionTypes.notarization_response,
                    data: { id, error },
                  });
                }
              })();

              break;
            }
            case BackgroundActiontype.process_prove_request: {
              const notaryRequest = {
                ...request.data,
                maxTranscriptSize: 0, //legacy fields
                maxSentData: 0, //legacy fields
                maxRecvData: 0, //legacy fields
                secretHeaders: [], //legacy fields
                secretResps: [], //legacy fields
              };
              const { id } = notaryRequest;

              (async () => {
                try {
                  const proof = await withRetry(() =>
                    createProof(notaryRequest),
                  );
                  console.log('BackgroundActiontype ', proof);
                  browser.runtime.sendMessage({
                    type: BackgroundActiontype.finish_prove_request,
                    data: {
                      id,
                      proof: proof,
                    },
                  });
                } catch (error) {
                  console.error('All attempts failed:', error);
                  browser.runtime.sendMessage({
                    type: BackgroundActiontype.finish_prove_request,
                    data: {
                      id,
                      error,
                    },
                  });
                }
              })();

              break;
            }
            case BackgroundActiontype.verify_proof: {
              (async () => {
                const result = await verifyProof(request.data);
                sendResponse(result);
              })();

              return true;
            }
            case BackgroundActiontype.verify_prove_request: {
              (async () => {
                const proof: Proof = request.data.proof;
                // const result: { sent: string; recv: string } =
                //   await verifyProof(proof);

                chrome.runtime.sendMessage<any, string>({
                  type: BackgroundActiontype.finish_prove_request,
                  data: {
                    id: request.data.id,
                    verification: {
                      proof,
                    },
                  },
                });
              })();
              break;
            }
            default:
              break;
          }
        },
      );
    })();
  }, []);

  return <div className="App" />;
};

export default Offscreen;

async function createProof(options: {
  url: string;
  notaryUrl: string;
  websocketProxyUrl: string;
  method?: Method;
  headers?: {
    [name: string]: string;
  };
  body?: any;
  id: string;
}): Promise<AttestationObject> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    notaryUrl,
    websocketProxyUrl,
    id,
  } = options;

  const identityManager = new IdentityManager();
  const identity = await identityManager.getIdentity();

  const hostname = urlify(url)?.hostname || '';
  const notary = NotaryServer.from(notaryUrl);
  const prover: _Prover = await new Prover({
    id,
    serverDns: hostname,
    maxSentData: 0, //legacy fields from tlsn, to remove
    maxRecvData: 0, //legacy fields from tlsn, to remove
  });

  await prover.setup(await notary.sessionUrl(0, 0));

  await prover.sendRequest(
    websocketProxyUrl + `?token=${hostname}`,
    {
      url,
      method,
      headers,
      body,
    },
    bigintToHex(identity.commitment),
  );

  const result = await prover.notarize();

  const proof: AttestationObject = {
    version: '1.0',
    meta: {
      notaryUrl,
      websocketProxyUrl,
    },
    signature: result.signature,
    application_data: result.application_data,
    attributes: result.attributes,
  };
  console.log('proof', proof);
  return proof;
}

async function verifyProof(
  proof: Proof,
): Promise<{ sent: string; recv: string }> {
  return { sent: '', recv: '' };

  // switch (proof.version) {
  //   case undefined: {
  //     result = await verify(proof);
  //     break;
  //   }
  //   case '1.0': {
  //     const tlsProof: _TlsProof = await new TlsProof(proof.data);
  //     result = await tlsProof.verify({
  //       typ: 'P256',
  //       key: await NotaryServer.from(proof.meta.notaryUrl).publicKey(),
  //     });
  //     break;
  //   }
  // }
}
