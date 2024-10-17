import React, { ReactElement, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorModal } from '../../components/ErrorModal';
import Globe from '../../components/SvgIcons/Globe';
import Clipboard from '../../components/SvgIcons/Clipboard';
import Settings from '../../components/SvgIcons/Settings';
import Bookmarks from '../Bookmarks';
import NavButton from '../../components/NavButton';

export default function Home(): ReactElement {
  const navigate = useNavigate();
  const [error, showError] = useState('');

  return (
    <div className="flex flex-col gap-4 py-4 overflow-y-auto">
      {error && <ErrorModal onClose={() => showError('')} message={error} />}
      <div className="flex flex-col flex-nowrap justify-center gap-2 mx-4">
        <NavButton
          ImageIcon={<Globe />}
          title="Websites"
          subtitle="List of websites to get attestations from"
          onClick={() => navigate('/websites')}
        />

        <NavButton
          ImageIcon={<Clipboard />}
          title="Attestations"
          subtitle="See your attestations in progress"
          onClick={() => navigate('/history')}
        />

        <NavButton
          ImageIcon={<Settings />}
          title="Settings"
          subtitle="Extension settings"
          onClick={() => navigate('/options')}
        />

        {/* <NavButton fa="fa-solid fa-hammer" onClick={() => navigate('/custom')}>
          Custom
        </NavButton> */}
        {/* <NavButton
          fa="fa-solid fa-certificate"
          onClick={() => navigate('/verify')}
        >
          Verify
        </NavButton> */}

        {/* <NavButton className="relative" fa="fa-solid fa-plus">
          <PluginUploadInfo />
          Add a plugin
        </NavButton> */}
        {/* <NavButton fa="fa-solid fa-gear" >
          Options
        </NavButton> */}
      </div>

      <Bookmarks />
      {/* <PluginList className="mx-4" /> */}
    </div>
  );
}
