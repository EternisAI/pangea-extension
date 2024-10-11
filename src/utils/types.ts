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

export type Provider = {
  id: string;
  host: string;
  urlRegex: string; // url of request that is notarized
  targetUrl: string; //url where user is redirected to
  method: string;
  type: string;
  title: string;
  description: string;
  responseSelector: string;
  valueTransform: string;
  icon: string;
};

export type NotaryConfig = {
  EXPECTED_PCRS: {
    '1': string;
    '2': string;
  };
  PROVIDERS: Array<Provider>;
};
