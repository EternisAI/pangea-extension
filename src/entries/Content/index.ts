import browser from 'webextension-polyfill';
import { ContentScriptRequest, ContentScriptTypes, RPCServer } from './rpc';
import { BackgroundActiontype, RequestHistory } from '../Background/rpc';
import { urlify } from '../../utils/misc';
import { TARGET_PAGES } from '../../utils/constants';
import { Bookmark } from '../../reducers/bookmarks';

// Custom console log
const originalConsoleLog = console.log;
console.log = function (...args) {
  originalConsoleLog.apply(console, ['[🌎Pangea]', ...args]);
};

(async () => {
  loadScript('content.bundle.js');

  const server = new RPCServer();
  server.on(
    ContentScriptTypes.load_page,
    async (request: ContentScriptRequest<{ url: string }>) => {
      const { url } = request.params || {};

      console.log('load_page', url);

      if (!url) throw new Error('params must include url.');

      if (window.location.href === url) {
        window.location.reload();
      }
    },
  );

  server.on(ContentScriptTypes.connect, async () => {
    const connected = await browser.runtime.sendMessage({
      type: BackgroundActiontype.connect_request,
      data: {
        ...getPopupData(),
      },
    });

    if (!connected) throw new Error('user rejected.');

    return connected;
  });

  server.on(
    ContentScriptTypes.get_history,
    async (
      request: ContentScriptRequest<{
        method: string;
        url: string;
        metadata?: { [k: string]: string };
      }>,
    ) => {
      const {
        method: filterMethod,
        url: filterUrl,
        metadata,
      } = request.params || {};

      if (!filterMethod || !filterUrl)
        throw new Error('params must include method and url.');

      const response: RequestHistory[] = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_history_request,
        data: {
          ...getPopupData(),
          method: filterMethod,
          url: filterUrl,
          metadata,
        },
      });

      return response;
    },
  );

  server.on(
    ContentScriptTypes.get_proof,
    async (request: ContentScriptRequest<{ id: string }>) => {
      const { id } = request.params || {};

      if (!id) throw new Error('params must include id.');

      const proof = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_proof_request,
        data: {
          ...getPopupData(),
          id,
        },
      });

      return proof;
    },
  );

  server.on(
    ContentScriptTypes.notarize,
    async (
      request: ContentScriptRequest<{
        url: string;
        method?: string;
        headers?: { [key: string]: string };
        metadata?: { [key: string]: string };
        body?: string;
        notaryUrl?: string;
        websocketProxyUrl?: string;
        maxSentData?: number;
        maxRecvData?: number;
        maxTranscriptSize?: number;
      }>,
    ) => {
      const {
        url,
        method,
        headers,
        body,
        maxSentData,
        maxRecvData,
        maxTranscriptSize,
        notaryUrl,
        websocketProxyUrl,
        metadata,
      } = request.params || {};

      if (!url || !urlify(url)) throw new Error('invalid url.');

      const proof = await browser.runtime.sendMessage({
        type: BackgroundActiontype.notarize_request,
        data: {
          ...getPopupData(),
          url,
          method,
          headers,
          body,
          maxSentData,
          maxRecvData,
          maxTranscriptSize,
          notaryUrl,
          websocketProxyUrl,
          metadata,
        },
      });

      return proof;
    },
  );

  server.on(
    ContentScriptTypes.install_plugin,
    async (
      request: ContentScriptRequest<{
        url: string;
        metadata?: { [k: string]: string };
      }>,
    ) => {
      const { url, metadata } = request.params || {};

      if (!url) throw new Error('params must include url.');

      const response: RequestHistory[] = await browser.runtime.sendMessage({
        type: BackgroundActiontype.install_plugin_request,
        data: {
          ...getPopupData(),
          url,
          metadata,
        },
      });

      return response;
    },
  );

  server.on(
    ContentScriptTypes.get_plugins,
    async (
      request: ContentScriptRequest<{
        url: string;
        origin?: string;
        metadata?: { [k: string]: string };
      }>,
    ) => {
      const {
        url: filterUrl,
        origin: filterOrigin,
        metadata,
      } = request.params || {};

      if (!filterUrl) throw new Error('params must include url.');

      const response = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_plugins_request,
        data: {
          ...getPopupData(),
          url: filterUrl,
          origin: filterOrigin,
          metadata,
        },
      });

      return response;
    },
  );

  server.on(
    ContentScriptTypes.run_plugin,
    async (request: ContentScriptRequest<{ hash: string }>) => {
      const { hash } = request.params || {};

      if (!hash) throw new Error('params must include hash');

      const response = await browser.runtime.sendMessage({
        type: BackgroundActiontype.run_plugin_request,
        data: {
          ...getPopupData(),
          hash,
        },
      });

      return response;
    },
  );
})();

function loadScript(filename: string) {
  const url = browser.runtime.getURL(filename);
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', url);
  document.body.appendChild(script);
}

function getPopupData() {
  return {
    origin: window.origin,
    position: {
      left: window.screen.width / 2 - 240,
      top: window.screen.height / 2 - 300,
    },
  };
}

// redirect to appropriate pages where request to notarize is located
// for example, redirecting to reddit user profile page after landing on main page
// profile

function findTargetPage(bookmark: Bookmark) {
  return TARGET_PAGES.filter((page) => window.location.href === page.url)[0];
}

// Function to find and click the specified element
function findAndClickElement(selector: string) {
  // Updated selector to find 'a' tags with href matching /user/{something}/
  const element: HTMLLinkElement | null = document.querySelector(selector);

  console.log(element);

  if (element) {
    element.click();
  } else {
    console.log('🟡 No html element found matching the pattern.');
  }
}

// Main function
async function performPreNotarizationAction() {
  //check if there is a notarization ongoing
  const request: Bookmark | undefined = await browser.runtime.sendMessage({
    type: BackgroundActiontype.get_notarization_status,
  });

  if (!request) return console.log('No notarization to run. 😴');

  console.log('request.targetUrl', request.targetUrl, window.location.href);
  if (
    !window.location.href.includes(request.targetUrl) &&
    !request.targetUrl.includes(window.location.href)
  )
    return;

  const targetPage = findTargetPage(request);

  if (targetPage) {
    console.log(`We are on ${targetPage.url} page. Redirecting...`);
    findAndClickElement(targetPage.selector);
  } else {
    console.log(
      '🟡 A notarization is ongoing but no action to perform was found.',
    );
  }
}

// Run the script when the page is fully loaded
window.addEventListener('load', performPreNotarizationAction);
