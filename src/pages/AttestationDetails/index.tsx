import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { download, urlify, bigintToHex } from '../../utils/misc';
import { useRequestHistory } from '../../reducers/history';
import { CheckCircle } from 'lucide-react';
import { useIdentity } from '../../reducers/identity';
import { VERIFIER_APP_URL } from '../../utils/constants';
import { AttestationObject, decodeAppData, Attribute } from '@eternis/tlsn-js';
export default function AttestationDetails() {
  const [identity] = useIdentity();
  const params = useParams<{ host: string; requestId: string }>();

  const request = useRequestHistory(params.requestId);
  const requestUrl = urlify(request?.url || '');

  const [attributeAttestation, setAttributeAttestation] =
    useState<AttestationObject>();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [sessionData, setSessionData] = useState<string>('');

  useEffect(() => {
    const AttributeAttestation = request?.proof;

    console.log('AttributeAttestation', AttributeAttestation);

    if (!AttributeAttestation) return;
    setAttributeAttestation(AttributeAttestation);

    const { attributes } = AttributeAttestation;
    if (attributes) setAttributes(attributes);

    console.log('application_data', AttributeAttestation.application_data);
    const decodedAppData = decodeAppData(AttributeAttestation.application_data);
    setSessionData(decodedAppData?.response_body || '');
  }, [request]);

  const copyAttestation = () => {
    const text = JSON.stringify(request?.proof);
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const downloadAttestation = () => {
    if (!request) return;
    download(request.id, JSON.stringify(request.proof));
  };

  const copyAndVerify = async () => {
    const text = JSON.stringify(request?.proof);
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.open(VERIFIER_APP_URL, '_blank');
  };
  if (!attributeAttestation) return <>ahi</>;
  return (
    <div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1">
      <div className="flex flex-col flex-nowrap justify-center gap-2 mx-4">
        <div className="flex mt-4">
          <div
            onClick={copyAttestation}
            className="flex-1 text-center cursor-pointer border border-[#E9EBF3] bg-white hover:bg-[#dfe0e5] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
          >
            Copy
          </div>

          <div
            onClick={downloadAttestation}
            className="flex-1 ml-2 text-center cursor-pointer border border-[#E9EBF3] bg-white hover:bg-[#dfe0e5] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
          >
            Download
          </div>

          <div
            onClick={copyAndVerify}
            className="flex-1 ml-2 text-center cursor-pointer border border-[#E9EBF3] bg-white hover:bg-[#dfe0e5] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
          >
            Verify
          </div>
        </div>

        <div className="p-4 border border-[#E4E6EA] bg-white rounded-xl flex flex-col">
          <div className="flex flex-row items-center">
            <div className="flex-1 font-bold text-[#4B5563] text-lg truncate">
              Your public key
            </div>
          </div>
          <div className="text-base mt-4 text-[#9BA2AE] break-all">
            {bigintToHex(identity?.commitment)}
          </div>
          <div className="text-sm text-[#1F2937] mt-4">
            Every attestation you create will be associated with your public
            cryptographic key.&nbsp;
            <span
              className="text-[#092EEA] cursor-pointer"
              onClick={() => {
                chrome.tabs.create({
                  url: 'https://eternis.ai/',
                });
              }}
            >
              Learn more
            </span>
          </div>
        </div>

        <div className="p-4 border border-[#E4E6EA] bg-white rounded-xl flex flex-col">
          <div className="flex flex-row items-center">
            <div className="flex-1 font-bold text-[#4B5563] text-lg truncate">
              Attestation for {requestUrl?.host}
            </div>
          </div>

          <div>
            <AttributeAttestation
              attrAttestation={attributeAttestation}
              attributes={attributes}
              sessionData={sessionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttributeAttestation(props: {
  attrAttestation: AttestationObject;
  attributes: Attribute[];
  sessionData: string;
}) {
  const { attrAttestation, attributes, sessionData } = props;
  return (
    <div className="text-[#9BA2AE] text-[14px] w-full max-w-3xl mx-auto  overflow-hidden relative">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Notary</h3>
            <p className="break-all">{attrAttestation?.meta?.notaryUrl}</p>
          </div>
          <div>
            <h3 className="font-semibold">Version</h3>
            <p>{attrAttestation.version}</p>
          </div>
          <div>
            <h3 className="font-semibold">Websocket proxy</h3>
            <p className="break-all">
              {attrAttestation?.meta?.websocketProxyUrl}
            </p>
          </div>

          <div className="col-span-2">
            <h3 className="font-semibold">Signature</h3>
            <p className="break-all text-xs">{attrAttestation.signature}</p>
          </div>
        </div>
        <div className="border-t pt-4">
          {attributes.length > 0 ? (
            <>
              <h3 className="font-semibold mb-2">Attributes</h3>
              {props.attributes.map((attribute) => (
                <div className="m-1 inline-flex items-center px-3 py-1 rounded-full bg-green-700 text-green-100 text-sm font-medium ">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {attribute.attribute_name}
                </div>
              ))}
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-2">Data</h3>

              {(() => {
                try {
                  const parsedData = JSON.parse(sessionData);
                  return <StylizedJSON data={parsedData} />;
                } catch (error) {
                  return <p>{sessionData}</p>;
                }
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StylizedJSONProps {
  data: any;
}

const StylizedJSON: React.FC<StylizedJSONProps> = ({ data }) => {
  const convertToStylizedYAML = (obj: any, indent = 0): React.ReactNode[] => {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Input must be a valid JSON object');
    }

    return Object.entries(obj).map(([key, value], index) => {
      const indentation = '  '.repeat(indent);
      const isArray = Array.isArray(value);
      const isObject = typeof value === 'object' && value !== null && !isArray;

      let content: React.ReactNode;

      if (isObject || isArray) {
        content = (
          <>
            <span className="text-purple-600">{key}:</span> {isArray ? '▼' : ''}
            {convertToStylizedYAML(value, indent + 1)}
          </>
        );
      } else {
        let valueClass = 'text-blue-600';
        if (typeof value === 'string') {
          valueClass = 'text-green-600';
          value = `"${value}"`;
        } else if (typeof value === 'number') {
          valueClass = 'text-orange-600';
        }
        content = (
          <>
            <span className="text-purple-600">{key}:</span>{' '}
            <span className={valueClass}>{value as any}</span>
          </>
        );
      }

      return (
        <div key={index} style={{ marginLeft: `${indent * 20}px` }}>
          {indentation}
          {content}
        </div>
      );
    });
  };

  try {
    const stylizedContent = convertToStylizedYAML(data);
    return (
      <pre className="font-mono text-sm bg-gray-100 p-4 rounded-lg overflow-x-auto">
        {stylizedContent}
      </pre>
    );
  } catch (error) {
    return (
      <div className="text-red-600">Error: {(error as Error).message}</div>
    );
  }
};
