export type Proof = ProofV0 | AttrAttestation;

export type ProofV0 = {
  version?: undefined;
  session: any;
  substrings: any;
  notaryUrl: string;
};

export type NotaryRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  notaryUrl: string;
  websocketProxyUrl: string;
  timestamp: number;
  type: string;
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
  host: string; // e.g. api.x.com
  title: string;
  description: string;
  icon: string; //url to icon image

  urlRegex: string; // e.g. ^https://api\.x\.com/1\.1/account/settings\.json(\?.*)?$
  targetUrl: string; // URL to redirect user before notarization. e.g. https://www.x.com/home
  method: HttpMethod; // e.g. GET
  transport?: TransportMechanism; //NOTE: LEGACY, type of request, is not used anymore. e.g. xmlhttprequest
  responseType: ResponseType;

  actionSelectors?: string[]; // url to redirect user before notarization. e.g. ["a[href^='/user/'][href$='/']"] or ["https://www.x.com/home"]
  preprocessor?: string; // Javascript function to process the response in a form that is more easy to evaluate. e.g. "function(data) { var result = ''; for (var key in data) { result += key + '=' + data[key] + '; '; } return JSON.parse(result); }"
  attributes?: string[]; // List of JMESPath expressions used to extract attributes from the provider's response.  e.g. ["screen_name"]
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
