import { getCacheByTabId } from './cache';
import {
  BackgroundActiontype,
  RequestLog,
  handleProveRequestStart,
} from './rpc';
import mutex from './mutex';
import browser from 'webextension-polyfill';
import { addRequest } from '../../reducers/requests';
import { urlify } from '../../utils/misc';
import {
  setCookies,
  setHeaders,
  getNotaryRequestsByUrl,
  getNotaryRequests,
  getLastNotaryRequest,
} from './db';
import {
  NOTARY_API,
  NOTARY_PROXY,
  NOTARIZATION_BUFFER_TIME,
} from '../../utils/constants';
import { Bookmark, BookmarkManager } from '../../reducers/bookmarks';
import {
  get,
  NOTARY_API_LS_KEY,
  PROXY_API_LS_KEY,
  EXTENSION_ENABLED,
} from '../../utils/storage';

export const onSendHeaders = (
  details: browser.WebRequest.OnSendHeadersDetailsType,
) => {
  return mutex.runExclusive(async () => {
    const { method, tabId, requestId } = details;

    if (method !== 'OPTIONS') {
      const cache = getCacheByTabId(tabId);
      const existing = cache.get<RequestLog>(requestId);
      const { hostname } = urlify(details.url) || {};

      if (hostname && details.requestHeaders) {
        details.requestHeaders.forEach((header) => {
          const { name, value } = header;
          if (/^cookie$/i.test(name) && value) {
            value
              .split(';')
              .map((v) => v.split('='))
              .forEach((cookie) => {
                setCookies(hostname, cookie[0].trim(), cookie[1]);
              });
          } else {
            setHeaders(hostname, name, value);
          }
        });
      }

      cache.set(requestId, {
        ...existing,
        method: details.method as 'GET' | 'POST',
        type: details.type,
        url: details.url,
        initiator: details.initiator || null,
        requestHeaders: details.requestHeaders || [],
        tabId: tabId,
        requestId: requestId,
      });
    }
  });
};

export const onBeforeRequest = (
  details: browser.WebRequest.OnBeforeRequestDetailsType,
) => {
  mutex.runExclusive(async () => {
    const { method, requestBody, tabId, requestId } = details;

    if (method === 'OPTIONS') return;

    if (requestBody) {
      const cache = getCacheByTabId(tabId);
      const existing = cache.get<RequestLog>(requestId);

      if (requestBody.raw && requestBody.raw[0]?.bytes) {
        try {
          cache.set(requestId, {
            ...existing,
            requestBody: Buffer.from(requestBody.raw[0].bytes).toString(
              'utf-8',
            ),
          });
        } catch (e) {
          console.error(e);
        }
      } else if (requestBody.formData) {
        cache.set(requestId, {
          ...existing,
          formData: requestBody.formData,
        });
      }
    }
  });
};

export const handleNotarization = (
  details: browser.WebRequest.OnCompletedDetailsType,
) => {
  //console.log('🟢 handleNotarization', details);
  mutex.runExclusive(async () => {
    const isEnabled = await get(EXTENSION_ENABLED);
    if (!isEnabled) return;

    const { tabId, requestId, frameId, url, method, type } = details;
    const cache = getCacheByTabId(tabId);

    //console.log('🟢 intercepted request', url);
    if (tabId === -1 || frameId === -1) return;

    const req = cache.get<RequestLog>(requestId);
    if (!req) return;

    //console.log('🟢 check bookmark exist', url, method, type);
    const bookmarkManager = new BookmarkManager();
    const bookmark = await bookmarkManager.findBookmark(url, method, type);
    if (!bookmark) return;
    //console.log('🟢 bookmark exist', bookmark);

    const lastNotaryRequest = await getLastNotaryRequest(bookmark.urlRegex);

    //@TEST:
    if (bookmark.notarizedAt) {
      const notarizedDate = new Date(bookmark.notarizedAt);
      console.log(
        '🟢  === \n  buffer notarizedDate',
        notarizedDate,
        '\n current date:',
        new Date(Date.now()),
        '\n lastNotaryRequest',
        lastNotaryRequest,
        '\n notarizedAt',
        bookmark.notarizedAt,
        '\n toNotarize',
        bookmark.toNotarize,
      );
    }

    if (bookmark.notarizedAt && !bookmark.toNotarize) {
      const timeDiff = Date.now() - bookmark.notarizedAt;
      console.log(
        '🟢 buffer timeDiff, NOTARIZATION_BUFFER_TIME',
        timeDiff,
        NOTARIZATION_BUFFER_TIME,
      );
      if (timeDiff < NOTARIZATION_BUFFER_TIME * 1000) {
        console.log('🟢 buffer timediff not ok');
        return;
      }
      console.log('🟢 buffer timediff ok');
    }

    const hostname = urlify(req.url)?.hostname;
    if (!hostname) return;
    const headers = req.requestHeaders.reduce<{ [k: string]: string }>(
      (acc: { [k: string]: string }, h) => {
        if (!h.name || !h.value) return acc;
        acc[h.name] = h.value;
        return acc;
      },
      { Host: hostname },
    );

    //TODO: for some reason, these needs to be override to work
    headers['Accept-Encoding'] = 'identity';
    headers['Connection'] = 'close';

    const notaryUrl = await get(NOTARY_API_LS_KEY, NOTARY_API);
    const websocketProxyUrl = await get(PROXY_API_LS_KEY, NOTARY_PROXY);

    // Convert body to JSON if content-type is application/json
    let parsedBody = req.requestBody;
    if (
      headers['Content-Type']?.toLowerCase().includes('application/json') &&
      req.requestBody
    ) {
      try {
        parsedBody = JSON.parse(req.requestBody);
      } catch (error) {
        console.error('Failed to parse JSON body:', error);
      }
    }
    await handleProveRequestStart(
      {
        type: BackgroundActiontype.prove_request_start,
        data: {
          cid: requestId,
          url: req.url,
          method: req.method,
          headers: headers,
          body: parsedBody,
          notaryUrl,
          websocketProxyUrl,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async () => {
        await bookmarkManager.updateBookmark({
          ...bookmark,
          toNotarize: false,
          notarizedAt: Date.now(),
        });
      },
    );
  });
};

export const onResponseStarted = (
  details: browser.WebRequest.OnResponseStartedDetailsType,
) => {
  mutex.runExclusive(async () => {
    const { method, responseHeaders, tabId, requestId } = details;

    if (method === 'OPTIONS') return;

    const cache = getCacheByTabId(tabId);

    const existing = cache.get<RequestLog>(requestId);
    const newLog: RequestLog = {
      requestHeaders: [],
      ...existing,
      method: details.method,
      type: details.type,
      url: details.url,
      initiator: details.initiator || null,
      tabId: tabId,
      requestId: requestId,
      responseHeaders,
    };

    cache.set(requestId, newLog);

    chrome.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: details.tabId,
        request: newLog,
      },
      action: addRequest(newLog),
    });
  });
};
