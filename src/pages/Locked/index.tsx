import { useIdentity } from '../../reducers/identity2';
import React, { useEffect } from 'react';
import Setup from './Setup';
import Lock from './Lock';

export default function Locked() {
  const { isSetupCompleted } = useIdentity();

  useEffect(() => {
    console.log('isSetupCompleted', isSetupCompleted);
  }, [isSetupCompleted]);

  if (!isSetupCompleted) {
    return <Setup />;
  }

  return <Lock />;
}
