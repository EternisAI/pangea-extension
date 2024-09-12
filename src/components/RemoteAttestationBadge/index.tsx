import React, {
  ChangeEvent,
  Children,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useCallback,
  useState,
} from 'react';

import { useRemoteAttestation } from '../../reducers/remote-attestation';
import Icon from '../Icon';
export default function RemoteAttestationBadge(): ReactElement {
  const { remoteAttestation, loading, error, isValid } = useRemoteAttestation();

  if (isValid === null) return <></>;
  return (
    <>
      {isValid ? <>🟢 Notary Authentified</> : <>🔴 Notary Not Authentified</>}
      <a
        href="https://aws.amazon.com/blogs/compute/validating-attestation-documents-produced-by-aws-nitro-enclaves/"
        target="_blank"
        title={
          (isValid
            ? 'Valid remote attestation ! '
            : 'Invalid remoteattestation') +
          `The remote attestation guarantees the
      authenticity of the code running the notary. Click to learn more`
        }
        style={{ color: 'black', textDecoration: 'none' }}
      ></a>
    </>
  );
}
