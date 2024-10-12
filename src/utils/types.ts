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
  host: string; // e.g. api.x.com
  urlRegex: string; // e.g. ^https://api\.x\.com/1\.1/account/settings\.json(\?.*)?$
  targetUrl: string; // URL to redirect user before notarization. e.g. https://www.x.com/home
  method: HttpMethod; // e.g. GET
  transport: TransportMechanism; // e.g. xmlhttprequest
  responseType: ResponseType;
  title: string;
  description: string;
  icon: string; //url to icon image
  actionSelectors?: string[]; // e.g. ["a[href^='/user/'][href$='/']"]
  attributes?: string[]; // List of JMESPath expressions used to extract attributes from the provider's response.  e.g. ["screen_name"]
  preprocessor?: string; // Javascript function e.g. "function(data) { var result = ''; for (var key in data) { result += key + '=' + data[key] + '; '; } return JSON.parse(result); }"
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

const providers: Provider[] = [
  {
    id: 1,
    host: 'x.com',
    urlRegex:
      '^https:\\/\\/api\\.(x|twitter)\\.com\\/1\\.1\\/account\\/settings\\.json(\\?.*)?$',
    targetUrl: 'https://www.x.com/home',
    method: 'GET',
    transport: 'xmlhttprequest',
    title: 'Verify X Profile',
    description:
      'Notarize ownership of a twitter profile. Go to your own profile to trigger the notarization.',
    icon: 'https://sweetwaternow.nyc3.cdn.digitaloceanspaces.com/wp-content/uploads/2024/01/Depositphotos_676194222_XL-scaled.jpg',
    responseType: 'json',
  },
  {
    id: 2,
    host: 'robinhood.com',
    urlRegex:
      '^https:\\/\\/bonfire\\.robinhood\\.com\\/portfolio\\/performance\\/[a-zA-Z0-9]+(\\?.*)?$',
    targetUrl: 'https://robinhood.com/',
    method: 'GET',
    transport: 'xmlhttprequest',
    title: 'Verify Robinhood balance',
    description: 'Notarize if your Robinhood balance is greater than $10,000.',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Robinhood_Logo.png',
    responseType: 'json',
  },
  {
    id: 3,
    host: 'reddit.com',
    urlRegex: '^https:\\/\\/www\\.reddit\\.com\\/user\\/[a-zA-Z0-9]+.*',
    targetUrl: 'https://www.reddit.com',
    method: 'GET',
    transport: 'xmlhttprequest',
    title: 'Reddit account',
    description: 'Go to your profile',
    icon: 'https://seeklogo.com/images/R/reddit-icon-new-2023-logo-3F12137D65-seeklogo.com.png',
    responseType: 'html',
    actionSelectors: ['a[href^="/user/"][href$="/"]'],
    attributes: [''],
    preprocessor: '',
  },
  {
    id: 4,
    host: 'secure.ssa.gov',
    urlRegex: 'https://secure.ssa.gov/myssa/myprofile-api/profileInfo',
    targetUrl: 'https://secure.ssa.gov/myssa/myprofile-ui/main',
    method: 'GET',
    transport: 'xmlhttprequest',
    title: 'US SSA',
    description: 'Go to your profile',
    icon: 'https://brandslogos.com/wp-content/uploads/images/large/us-social-security-administration-logo-black-and-white.png',
    responseType: 'json',
  },
  {
    id: 5,
    host: 'ubereats.com',
    urlRegex:
      '^https:\\/\\/www\\.ubereats\\.com\\/_p\\/api\\/getPastOrdersV1.*',
    targetUrl: 'https://www.ubereats.com/orders',
    method: 'POST',
    transport: 'xmlhttprequest',
    title: 'Uber eats orders',
    description: 'Go to your order history',
    icon: 'https://i.pinimg.com/originals/a3/4a/8c/a34a8c234e27ac9476e7f010f750d136.jpg',
    responseType: 'json',
  },
];
