import NodeCache from 'node-cache';
import { RequestLog } from './rpc';

let RequestsLogs: {
  [tabId: string]: NodeCache;
} = {};

export const deleteCacheByTabId = (tabId: number) => {
  delete RequestsLogs[tabId];
};

export const getCacheByTabId = (tabId: number): NodeCache => {
  RequestsLogs[tabId] =
    RequestsLogs[tabId] ||
    new NodeCache({
      stdTTL: 60 * 5, // default 5m TTL
      maxKeys: 1000000,
    });

  return RequestsLogs[tabId];
};

export const getCachedRequestByText = (tabId: number, text: string) => {
  const cache = getCacheByTabId(tabId);
  if (!cache) return;
  const key = cache
    .keys()
    .find((key: string) =>
      cache.get<RequestLog>(key)?.responseBody?.includes(text),
    );
  if (!key) return;
  return cache.get<RequestLog>(key);
};

export const clearRequestCache = () => {
  RequestsLogs = {};
};

export const clearCache = () => {
  clearRequestCache();
};
