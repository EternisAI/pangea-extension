export type Proof = ProofV0 | AttrAttestation;

export type ProofV0 = {
  version?: undefined;
  session: any;
  substrings: any;
  notaryUrl: string;
};

export type AttrAttestation = {
  version: '1.0';
  meta: {
    notaryUrl: string;
    websocketProxyUrl: string;
    pluginUrl?: string;
  };
  signature: string;
  signedSession: string;
  applicationData: string;
  attestations: string;
};

export type TargetPage = {
  url: string;
  selector: string;
};

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH';
type TransportMechanism = 'xmlhttprequest' | 'main_frame';
type ResponseType = 'json' | 'text' | 'xml' | 'html';

export interface Provider {
  id: number;
  url: string;
  urlRegex: string;
  targetUrl: string;
  method: HttpMethod;
  transport: TransportMechanism;
  responseType: ResponseType;
  title: string;
  description: string;
  icon: string;
  attributes?: string[];
  actionSelectors?: string[];
  preprocessor?: string;
  [key: string]: any; // For additional properties
}

interface ExpectedPcrs {
  [key: string]: string; // Base64-encoded PCR value
}

export interface NotaryConfig {
  version: string;
  EXPECTED_PCRS: ExpectedPcrs;
  PROVIDERS: Provider[];
  [key: string]: any; // For additional properties
}
