const fs = require('fs');
import * as crypto from 'crypto';
import { chainCerts, ChainCert } from './chain-certs';

const certPath = './cert.pem';

function verifyCertificate(certPath: string, chainCerts: ChainCert[]) {
  // Read the certificate and CA certificate

  //enclave certificate
  let cert = new crypto.X509Certificate(fs.readFileSync(certPath));

  //1st certificate is ec2 instance certificate
  // final certificate is the root certificate
  let result = true;
  for (let i = 0; i < chainCerts.length; i++) {
    const ca = new crypto.X509Certificate(chainCerts[i].Cert);
    const result_ = cert.verify(ca.publicKey);

    result = result && result_;
    cert = ca;
  }

  // console.log('Subject:', cert.subject);
  // console.log('Issuer:', cert.issuer);
  // console.log('Valid from:', cert.validFrom);
  // console.log('Valid to:', cert.validTo);
  // console.log('publicKey:', cert.publicKey);
  return result;
}

if (verifyCertificate(certPath, chainCerts)) {
  console.log('====\n End Certificate is valid 🟢');
} else {
  console.log('====\n End Certificate verification failed 🚫');
}
