import { withHandlers } from 'recompose';
import { func, Sidetree } from '@transmute/element-lib';
import DIDWallet from '@transmute/did-wallet';

const sidetree = new Sidetree({
  parameters: {
    didMethodName: 'did:elem:ropsten',
  },
});

export default withHandlers({
  getDidDocumentKey: () => walletKey => {
    const { publicKey, tags, encoding } = walletKey;
    const [type, kid] = tags;
    let publicKeyType;
    switch (encoding) {
      case 'base58':
        publicKeyType = 'publicKeyBase58';
        break;
      case 'jwk':
        publicKeyType = 'publicKeyJwk';
        break;
      case 'hex':
      default:
        publicKeyType = 'publicKeyHex';
    }
    return {
      id: kid,
      usage: 'signing',
      type,
      [publicKeyType]: publicKey,
    };
  },
  getMyDidUniqueSuffix: ({ keystore }) => () => {
    const keys = Object.values(keystore.keystore.data.keys);
    const wall = DIDWallet.create({
      keys,
    });
    const primaryKey = keys.find(k => {
      return k.tags.indexOf('#primary') !== -1;
    });
    const didDocumentModel = sidetree.op.walletToInitialDIDDoc(wall);
    const createPayload = sidetree.op.getCreatePayload(
      didDocumentModel,
      primaryKey
    );
    const didUniqueSuffix = func.getDidUniqueSuffix(createPayload);
    return didUniqueSuffix;
  },
  createDIDRequest: ({ keystore }) => () => {
    const keys = Object.values(keystore.keystore.data.keys);
    const wall = DIDWallet.create({
      keys,
    });
    const primaryKey = keys.find(k => {
      return k.tags.indexOf('#primary') !== -1;
    });
    const didDocumentModel = sidetree.op.walletToInitialDIDDoc(wall);
    const createPayload = sidetree.op.getCreatePayload(
      didDocumentModel,
      primaryKey
    );
    return createPayload;
  },
  createAddKeyRequest: ({ keystore }) => (
    newKey,
    didUniqueSuffix,
    operationHash
  ) => {
    const lastOperation = {
      didUniqueSuffix,
      operation: { operationHash },
    };
    const keys = Object.values(keystore.keystore.data.keys);
    const primaryKey = keys.find(k => {
      return k.tags.indexOf('#primary') !== -1;
    });
    const payload = sidetree.op.getUpdatePayloadForAddingAKey(
      lastOperation,
      newKey,
      primaryKey.privateKey
    );
    return payload;
  },
  createRemoveKeyRequest: ({ keystore }) => (
    kid,
    didUniqueSuffix,
    operationHash
  ) => {
    const lastOperation = {
      didUniqueSuffix,
      operation: { operationHash },
    };
    const keys = Object.values(keystore.keystore.data.keys);
    const primaryKey = keys.find(k => {
      return k.tags.indexOf('#primary') !== -1;
    });
    const payload = sidetree.op.getUpdatePayloadForRemovingAKey(
      lastOperation,
      kid,
      primaryKey.privateKey
    );
    return payload;
  },
  createEditDocumentRequest: ({ keystore }) => (
    didUniqueSuffix,
    operationHash,
    oldDidDocument,
    newDidDocument
  ) => {
    const lastOperation = {
      didUniqueSuffix,
      operation: { operationHash },
    };
    const keys = Object.values(keystore.keystore.data.keys);
    const primaryKey = keys.find(k => {
      return k.tags.indexOf('#primary') !== -1;
    });
    const payload = sidetree.op.getUpdatePayload(
      lastOperation,
      oldDidDocument,
      newDidDocument,
      primaryKey.privateKey
    );
    return payload;
  },
});
