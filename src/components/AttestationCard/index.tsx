import React, { ReactElement, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { download, urlify } from '../../utils/misc';
import { useRequestHistory } from '../../reducers/history';
import { deleteRequestHistory } from '../../reducers/history';
import { getNotaryApi, getProxyApi } from '../../utils/storage';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import Modal, { ModalContent } from '../Modal/Modal';
import Error from '../SvgIcons/Error';
import { BadgeCheck } from 'lucide-react';
import { useDevMode } from '../../reducers/requests';
import { urlToRegex, extractHostFromUrl } from '../../utils/misc';
import { useBookmarks, BookmarkManager } from '../../reducers/bookmarks';
import { AttestationObject, Attribute } from '@eternis/tlsn-js';
import { CheckCircle } from 'lucide-react';

const charwise = require('charwise');

function formatDate(requestId: string) {
  const date = new Date(charwise.decode(requestId, 'hex'));
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return 'Today';
  }

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAttestationDate(requestId: string, previousRequestId?: string) {
  const date = formatDate(requestId);
  const previousDate = previousRequestId ? formatDate(previousRequestId) : null;

  if (!previousDate) {
    return date;
  }

  if (date !== previousDate) {
    return date;
  }

  return '';
}

export function AttestationCard({
  requestId,
  previousRequestId,
  showDate,
}: {
  requestId: string;
  previousRequestId?: string;
  showDate: boolean;
}): ReactElement {
  const request = useRequestHistory(requestId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const requestUrl = urlify(request?.url || '');
  const date = formatAttestationDate(requestId, previousRequestId);
  const [bookmarks] = useBookmarks();
  const [devMode] = useDevMode();
  const bookmarkManager = new BookmarkManager();

  const { status } = request || {};

  const [showingError, showError] = useState(false);

  const onRetry = useCallback(async () => {
    const notaryUrl = await getNotaryApi();
    const websocketProxyUrl = await getProxyApi();
    chrome.runtime.sendMessage<any, string>({
      type: BackgroundActiontype.retry_prove_request,
      data: {
        id: requestId,
        notaryUrl,
        websocketProxyUrl,
      },
    });
  }, [requestId]);

  const onDelete = useCallback(async () => {
    dispatch(deleteRequestHistory(requestId));

    const bookmark = await bookmarkManager.findBookmark(
      request?.url || '',
      '',
      '',
    );

    console.log('bookmark', bookmark);
    if (bookmark) {
      const updatedBookmark = {
        ...bookmark,
        notarizedAt: undefined,
      };
      await bookmarkManager.updateBookmark(updatedBookmark);
    }

    // const latestRequest = await getNotaryRequest(requestId);
    // console.log('latestRequest', latestRequest);
  }, [requestId]);

  const onShowError = useCallback(async () => {
    showError(true);
  }, [request?.error, showError]);

  const closeAllModal = useCallback(() => {
    showError(false);
  }, [showingError, showError]);

  const copyRequest = useCallback(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTabUrl = tabs[0]?.url || '';
    const request_ = {
      id: bookmarks.length + 1,
      host: extractHostFromUrl(request?.url || ''),
      urlRegex: urlToRegex(request?.url || ''),
      targetUrl: currentTabUrl,
      method: request?.method,
      title: '',
      description: '',
      icon: '',
      responseType: '',
      actionSelectors: [],
    };

    navigator.clipboard.writeText(JSON.stringify(request_, null, 2));
  }, [request, bookmarks]);

  function ErrorModal(): ReactElement {
    const msg = typeof request?.error === 'string' && request?.error;
    return !showingError ? (
      <></>
    ) : (
      <Modal
        className="p-4 border border-[#E4E6EA] bg-white rounded-xl flex flex-col mx-6"
        onClose={closeAllModal}
      >
        <ModalContent className="flex flex-col">
          <div className="flex-1 font-bold text-[#4B5563] text-lg truncate">
            Error
          </div>
          <div className="text-[#9BA2AE] text-sm leading-5 font-bold mb-4">
            {msg || 'Something went wrong...'}
          </div>
        </ModalContent>
        <div
          onClick={closeAllModal}
          className="cursor-pointer self-center flex items-center ml-2 bg-[#F6E2E2] hover:bg-[#e4d2d2] text-[#B50E0E] text-sm font-medium py-[6px] px-2 rounded-lg"
        >
          Close
        </div>
      </Modal>
    );
  }

  const attributes = request?.proof?.attributes || [];

  return (
    <div className="flex flex-col" key={requestId}>
      <ErrorModal />
      {showDate && date && (
        <div className="text-sm font-bold mb-2 leading-5">{date}</div>
      )}
      <div className="p-4 border border-[#E4E6EA] bg-white rounded-xl flex flex-col">
        <div className="flex flex-row items-center ">
          <div className="flex-1 font-bold text-[#4B5563] text-lg truncate">
            {requestUrl?.host}
          </div>
          {status === 'error' && !!request?.error && (
            <>
              <div
                onClick={onShowError}
                className="cursor-pointer flex items-center ml-2 bg-[#F6E2E2] hover:bg-[#e4d2d2] text-[#B50E0E] text-sm font-medium py-[6px] px-2 rounded-lg"
              >
                <Error />
                &nbsp;Error
              </div>
            </>
          )}
          {status !== 'success' && (
            <div
              onClick={() => {
                if (status === 'pending') return;
                onRetry();
              }}
              className="cursor-pointer ml-2 border border-[#E4E6EA] bg-white hover:bg-slate-100 text-[#092EEA] text-sm font-medium py-[6px] px-2 rounded-lg"
            >
              {status === 'pending' ? 'Pending' : 'Retry'}
            </div>
          )}
          {status === 'success' && (
            <div>
              <div className="inline-flex items-center px-2 py-1.5 rounded-full bg-[#e4f5e5]">
                <BadgeCheck className="w-5 h-5 mr-1 text-[#e4f5e5] fill-[#00b037]" />
                <span className="text-sm font-bold text-green-600">
                  Verified
                </span>
              </div>
            </div>
          )}
        </div>

        {attributes?.slice(0, 2).map((attribute: Attribute) => (
          <div className="flex items-center mb-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-700 text-green-100 text-sm font-medium truncate">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{attribute.attribute_name}</span>
            </div>
          </div>
        ))}

        {attributes?.length > 2 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-700 text-green-100 text-sm font-medium truncate w-40">
            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate"> + {attributes?.length - 2} more</span>
          </div>
        )}
        <div className="grid grid-cols-[80px,1fr] gap-2 mt-4">
          {[
            {
              label: 'Time',
              value: new Date(charwise.decode(requestId, 'hex')).toISOString(),
            },
          ].map(({ label, value }) => (
            <>
              <div className="text-[#9BA2AE] text-sm leading-5">{label}</div>
              <div className="text-[#4B5563] text-sm leading-5 truncate">
                {value}
              </div>
            </>
          ))}

          {status === 'success' && (
            <div
              className="text-[#9BA2AE] text-sm leading-5 whitespace-nowrap hover:text-black cursor-pointer"
              onClick={() => {
                if (!showDate) {
                  navigate(`${location.pathname}/attestation/${requestId}`);
                  return;
                }
                navigate(
                  `/history/${requestUrl?.host}/attestation/${requestId}`,
                );
              }}
            >
              See details...
            </div>
          )}
        </div>

        <div className="flex mt-4">
          {status === 'success' && (
            <>
              <div
                onClick={() => {
                  navigate(
                    `/history/${requestUrl?.host}/attestation/${requestId}`,
                  );
                }}
                className="cursor-pointer border border-[#E9EBF3] bg-[#F6F7FC] hover:bg-[#dfe0e5] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
              >
                View
              </div>

              <div
                onClick={() => {
                  download(
                    `${request?.id}.json`,
                    JSON.stringify(request?.proof),
                  );
                }}
                className="ml-3 cursor-pointer border border-[#E9EBF3] bg-[#F6F7FC] hover:bg-[#e2e3e8] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
              >
                Save
              </div>

              {devMode && (
                <div
                  onClick={copyRequest}
                  className="ml-3 cursor-pointer border border-[#E9EBF3] bg-[#F6F7FC] hover:bg-[#e2e3e8] text-[#092EEA] text-sm font-medium py-[10px] px-4 rounded-lg"
                >
                  Copy request
                </div>
              )}
            </>
          )}

          <div
            onClick={onDelete}
            className="ml-auto cursor-pointer border border-[#E4E6EA] bg-white hover:bg-slate-100 text-[#B50E0E] text-sm font-medium py-[10px] px-4 rounded-lg"
          >
            Delete
          </div>
        </div>
      </div>
    </div>
  );
}
