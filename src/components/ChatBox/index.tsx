import React, { useCallback, useEffect, useState } from 'react';
import { sendChat, useChatMessages, useClientId } from '../../reducers/p2p';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

export default function ChatBox() {
  const messages = useChatMessages();
  const dispatch = useDispatch();
  const clientId = useClientId();
  const [text, setText] = useState('');

  const onSend = useCallback(() => {
    if (text) {
      dispatch(
        sendChat({
          text,
          from: clientId,
          to: 'meh',
        }),
      );

      setText('');
    }
  }, [text]);

  return (
    <div className="flex flex-col h-full gap-1">
      <div className="flex flex-col border border-slate-200 flex-grow overflow-y-auto">
        {messages.map((msg) => {
          return <div>{msg.text}</div>;
        })}
      </div>
      <div className="flex flex-row w-full gap-1">
        <input
          className="input border border-slate-200 focus:border-slate-400 flex-grow p-2"
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className={classNames('button', {
            'button--primary': !!text,
          })}
          disabled={!text}
          onClick={onSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}