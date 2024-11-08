import { useIdentity } from '../../reducers/identity';
import React, { useEffect, useState } from 'react';
import Setup from './Setup';
import Lock from './Lock';
import NewIdentity from './NewIdentity';

export default function Locked() {
  const { isSetupCompleted } = useIdentity();
  const [createNewIdentity, setCreateNewIdentity] = useState(false);

  useEffect(() => {
    console.log('isSetupCompleted', isSetupCompleted);
  }, [isSetupCompleted]);

  if (!isSetupCompleted) {
    if (createNewIdentity) {
      return <NewIdentity setCreateNewIdentity={setCreateNewIdentity} />;
    }
    return <Setup setCreateNewIdentity={setCreateNewIdentity} />;
  }

  return <Lock />;
}
