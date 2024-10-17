import React, { ReactElement } from 'react';

import { useRemoteAttestation } from '../../reducers/remote-attestation';

import { useExtensionEnabled } from '../../reducers/requests';
import Lock from '../SvgIcons/Lock';

export default function RemoteAttestationBadge(): ReactElement {
  const { remoteAttestation, loading, error, isValid } = useRemoteAttestation();
  const isExtensionEnabled = useExtensionEnabled();

  if (isValid === null) return <></>;
  return (
    <>
      <div className="mt-5 items-center">
        <>
          {isValid ? (
            <div
              className="inline-flex items-center gap-2.5"
              role="status"
              aria-live="polite"
            >
              <Lock />
              <span className="text-xs font-medium text-[#2EB022]">
                Connection is secure
              </span>
            </div>
          ) : (
            <>
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-1"></div>
              <span className="text-xs mr-2"> Notary Not Authenticated</span>

              <div className="text-xs mr-2">{error}</div>
            </>
          )}
        </>
      </div>
    </>
  );
}
