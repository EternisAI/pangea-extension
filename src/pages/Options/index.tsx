import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  ReactNode,
} from 'react';
import {
  set,
  NOTARY_API_LS_KEY,
  PROXY_API_LS_KEY,
  MAX_SENT_LS_KEY,
  MAX_RECEIVED_LS_KEY,
  getMaxSent,
  getMaxRecv,
  getNotaryApi,
  getProxyApi,
  getLoggingFilter,
  LOGGING_FILTER_KEY,
  DEV_MODE_KEY,
  get,
  getBoolean,
} from '../../utils/storage';
import {
  NOTARY_API,
  NOTARY_PROXY,
  NOTARY_API_LOCAL,
  NOTARY_PROXY_LOCAL,
  MAX_RECV,
  MAX_SENT,
  MODE,
  Mode,
} from '../../utils/constants';
import Modal, { ModalContent } from '../../components/Modal/Modal';
import browser from 'webextension-polyfill';
import { LoggingLevel } from '@eternis/tlsn-js';

import RemoteAttestationBadge from '../../components/RemoteAttestationBadge';

import { Identity } from '@semaphore-protocol/identity';
import { bigintToHex } from '../../utils/misc';
import InfoCircle from '../../components/SvgIcons/InfoCircle';
import DropdownChevron from '../../components/SvgIcons/DropdownChevron';
import NavButton from '../../components/NavButton';
import Search from '../../components/SvgIcons/Search';
import { useNavigate } from 'react-router';
import { useUniqueRequests, useDevMode } from '../../reducers/requests';
// import { version } from '../../../package.json';
import { useIdentity } from '../../reducers/identity';

export default function Options(): ReactElement {
  const [notary, setNotary] = useState(NOTARY_API);
  const [proxy, setProxy] = useState(NOTARY_PROXY);
  const [maxSent, setMaxSent] = useState(MAX_SENT);
  const [maxReceived, setMaxReceived] = useState(MAX_RECV);
  const [loggingLevel, setLoggingLevel] = useState<LoggingLevel>('Info');

  const [dirty, setDirty] = useState(false);
  const [shouldReload, setShouldReload] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const navigate = useNavigate();
  const requests = useUniqueRequests();
  const [devMode, setDevMode] = useDevMode();

  const [identity, setIdentity] = useIdentity();

  useEffect(() => {
    (async () => {
      setNotary((await getNotaryApi()) || NOTARY_API);
      setProxy((await getProxyApi()) || NOTARY_PROXY);
      setMaxReceived((await getMaxRecv()) || MAX_RECV);
      setMaxSent((await getMaxSent()) || MAX_SENT);
      setLoggingLevel((await getLoggingFilter()) || 'Info');
      setDevMode(await getBoolean(DEV_MODE_KEY));
    })();
  }, [advanced]);

  const onSave = useCallback(
    async (e: MouseEvent<HTMLButtonElement>, skipCheck = false) => {
      if (!skipCheck && shouldReload) {
        setShowReloadModal(true);
        return;
      }
      await set(NOTARY_API_LS_KEY, notary);
      await set(PROXY_API_LS_KEY, proxy);
      await set(MAX_SENT_LS_KEY, maxSent.toString());
      await set(MAX_RECEIVED_LS_KEY, maxReceived.toString());
      await set(LOGGING_FILTER_KEY, loggingLevel);
      setDirty(false);
    },
    [notary, proxy, maxSent, maxReceived, loggingLevel, shouldReload],
  );

  const onSaveAndReload = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      await onSave(e, true);
      browser.runtime.reload();
    },
    [onSave],
  );

  const onAdvanced = useCallback(() => {
    setAdvanced(!advanced);
  }, [advanced]);

  const toggleDevMode = useCallback(() => {
    setDevMode(!devMode);
    set(DEV_MODE_KEY, !devMode);
  }, [devMode]);

  return (
    <div className="flex flex-col flex-nowrap flex-grow px-4 py-5 overflow-y-auto">
      {showReloadModal && (
        <Modal
          className="flex flex-col items-center text-base cursor-default justify-center !w-auto mx-4 my-[50%] p-4 gap-4"
          onClose={() => setShowReloadModal(false)}
        >
          <ModalContent className="flex flex-col w-full gap-4 items-center text-base justify-center">
            Modifying your logging your will require your extension to reload.
            Do you want to proceed?
          </ModalContent>
          <div className="flex flex-row justify-end items-center gap-2 w-full">
            <button
              className="button"
              onClick={() => setShowReloadModal(false)}
            >
              No
            </button>
            <button
              className="button button--primary"
              onClick={onSaveAndReload}
            >
              Yes
            </button>
          </div>
        </Modal>
      )}
      <div className="flex flex-col   p-4">
        <NavButton
          ImageIcon={<Search />}
          title="Search requests"
          subtitle={`${requests.length} recent requests`}
          onClick={() => navigate('/requests')}
        />
      </div>

      <NormalOptions
        notary={notary}
        setNotary={setNotary}
        proxy={proxy}
        setProxy={setProxy}
        setDirty={setDirty}
        identity={identity || undefined}
        toggleDevMode={toggleDevMode}
        devMode={devMode}
      />

      <div className="flex flex-row mb-8 mx-auto">
        <div
          className="cursor-pointer text-[#092EEA] text-sm font-medium text-center hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"
          onClick={onAdvanced}
        >
          Advanced
          <DropdownChevron reverse={advanced} />
        </div>
      </div>
      {!advanced ? (
        <></>
      ) : (
        <div className="flex flex-col w-full p-2">
          <AdvancedOptions
            maxSent={maxSent}
            setMaxSent={setMaxSent}
            maxReceived={maxReceived}
            setMaxReceived={setMaxReceived}
            setDirty={setDirty}
            loggingLevel={loggingLevel}
            setLoggingLevel={setLoggingLevel}
            setShouldReload={setShouldReload}
            setNotary={setNotary}
            setProxy={setProxy}
          />
        </div>
      )}
      <div className="flex flex-row flex-nowrap justify-center gap-2 p-2">
        <button
          className="cursor-pointer border border-[#E4E6EA] bg-white hover:bg-slate-100 text-[#092EEA] text-sm font-medium py-[10px] px-2 rounded-lg text-center w-full"
          disabled={!dirty}
          onClick={onSave}
        >
          Save Changes
        </button>
      </div>
      <div className="flex justify-center mt-auto py-4">
        <RemoteAttestationBadge />
      </div>
    </div>
  );
}

function InputField(props: {
  label?: string;
  LabelIcon?: ReactNode;
  placeholder?: string;
  value?: string;
  type?: string;
  min?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const {
    label,
    LabelIcon,
    placeholder,
    value,
    type,
    min,
    onChange,
    multiline,
    readOnly,
  } = props;

  return (
    <div className="flex flex-col flex-nowrap gap-1">
      <div className="text-sm font-medium cursor-default flex items-center">
        {label}
        {LabelIcon && <span>&nbsp;</span>}
        {LabelIcon}
      </div>

      {/* <Input
        id="search"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      /> */}
      <textarea
        onChange={onChange}
        className={
          'flex w-full rounded-md border border-[#E4E6EA] resize-none text-base bg-white px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 mb-6'
        }
        value={value}
        placeholder={placeholder}
        id="search"
        rows={multiline ? 2 : 1}
        readOnly={readOnly}
      />
    </div>
  );
}

function NormalOptions(props: {
  notary: string;
  setNotary: (value: string) => void;
  proxy: string;
  setProxy: (value: string) => void;
  setDirty: (value: boolean) => void;
  toggleDevMode: () => void;
  identity?: Identity;
  devMode: boolean;
}) {
  const {
    notary,
    setNotary,
    proxy,
    setProxy,
    setDirty,
    toggleDevMode,
    devMode,
    identity,
  } = props;

  return (
    <div className="flex flex-col flex-nowrap">
      {/* <div className="flex flex-col flex-nowrap py-1 px-2 gap-2 cursor-default">
        <div className="font-semibold">Version</div>
        <div className="input border bg-slate-100">{version}</div>
      </div> */}

      {identity && (
        <InputField
          label="Your public key"
          placeholder="Public key"
          value={bigintToHex(identity?.commitment)}
          type="text"
          readOnly
          multiline
          LabelIcon={
            <div
              onClick={() => {
                chrome.tabs.create({
                  url: 'https://eternis.ai/',
                });
              }}
              className="cursor-pointer"
            >
              <InfoCircle />
            </div>
          }
        />
      )}

      <InputField
        label="Notary API"
        placeholder="https://api.tlsnotary.org"
        value={notary}
        type="text"
        onChange={(e) => {
          setNotary(e.target.value);
          setDirty(true);
        }}
      />
      <InputField
        label="Proxy API"
        placeholder="https://proxy.tlsnotary.org"
        value={proxy}
        type="text"
        onChange={(e) => {
          setProxy(e.target.value);
          setDirty(true);
        }}
      />

      <div className="flex items-center py-1 px-2 gap-2">
        <input
          type="checkbox"
          id="devmode"
          className=" "
          onChange={toggleDevMode}
          checked={devMode}
        />

        <label htmlFor="devmode" className="font-semibold cursor-pointer">
          Enable dev mode
        </label>
      </div>

      {/* <div className="flex flex-col flex-nowrap py-1 px-2 gap-2 cursor-default">
        <div className="font-semibold">Explorer URL</div>
        <div className="input border bg-slate-100">{EXPLORER_API}</div>
      </div> */}
    </div>
  );
}

function AdvancedOptions(props: {
  maxSent: number;
  maxReceived: number;
  loggingLevel: LoggingLevel;
  setShouldReload: (reload: boolean) => void;
  setMaxSent: (value: number) => void;
  setMaxReceived: (value: number) => void;
  setDirty: (value: boolean) => void;
  setLoggingLevel: (level: LoggingLevel) => void;
  setNotary: (value: string) => void;
  setProxy: (value: string) => void;
}) {
  const {
    maxSent,
    setMaxSent,
    maxReceived,
    setMaxReceived,
    setDirty,
    setLoggingLevel,
    loggingLevel,
    setShouldReload,
    setNotary,
    setProxy,
  } = props;

  return (
    <div>
      {/* <InputField
        label="Set Max Received Data"
        value={maxReceived.toString()}
        type="number"
        min={0}
        onChange={(e) => {
          setMaxReceived(parseInt(e.target.value));
          setDirty(true);
        }}
      />
      <InputField
        label="Set Max Sent Data"
        value={maxSent.toString()}
        type="number"
        min={0}
        onChange={(e) => {
          setMaxSent(parseInt(e.target.value));
          setDirty(true);
        }}
      /> */}
      <div className="flex items-center py-1 px-2 gap-2">
        <input
          type="checkbox"
          id="localhost"
          className="input border"
          onChange={(e) => {
            if (e.target.checked) {
              setNotary(NOTARY_API_LOCAL);
              setProxy(NOTARY_PROXY_LOCAL);
            } else {
              setNotary(NOTARY_API);
              setProxy(NOTARY_PROXY);
            }
            setDirty(true);
          }}
        />

        <label htmlFor="localhost" className="font-semibold cursor-pointer">
          Use localhost notary
        </label>
      </div>

      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Logging Level</div>
        <select
          className="select !bg-white text-base !font-medium !border !border-r-[1px] !border-b-[1px] !border-[#E4E6EA] rounded-md !px-3 !py-2"
          onChange={(e) => {
            setLoggingLevel(e.target.value as LoggingLevel);
            setDirty(true);
            setShouldReload(true);
          }}
          value={loggingLevel}
        >
          <option value="Error">Error</option>
          <option value="Warn">Warn</option>
          <option value="Info">Info</option>
          <option value="Debug">Debug</option>
          <option value="Trace">Trace</option>
        </select>
      </div>
      <div className="flex flex-row flex-nowrap justify-end gap-2 p-2"></div>
    </div>
  );
}
