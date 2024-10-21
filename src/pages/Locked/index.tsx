import { useIdentity } from '../../reducers/identity2';
import React from 'react';
import Setup from './Setup';
import Lock from './Lock';

export default function Locked() {
  const { loading, isSetupCompleted } = useIdentity();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">loading</div>
    );
  }

  if (!isSetupCompleted) {
    return <Setup />;
  }

  return <Lock />;
}
