import { Account, NetworkType } from 'symbol-sdk';
import { describe, expect, it } from 'vitest';
import {
  DefaultAccountResolver,
  KeyName,
  LoggerFactory,
  LogType,
  PrivateKeySecurityMode,
  Utils,
} from '../../src/index.js';
import { AddressesService } from '../../src/service/AddressesService.js';

const accountResolver = new DefaultAccountResolver();
const nodeName = 'node';
const logger = LoggerFactory.getLogger(LogType.Silent);
const service = new AddressesService(logger, accountResolver);

describe('', () => {
  it('should resolveAccount when old and new are different', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = Account.generateNewAccount(networkType);
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      'node',
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      {
        privateKey: newAccount.privateKey,
        address: newAccount.address.plain(),
        publicKey: newAccount.publicKey,
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
      privateKey: newAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are different', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = Account.generateNewAccount(networkType);
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      {
        privateKey: newAccount.privateKey,
        address: newAccount.address.plain(),
        publicKey: newAccount.publicKey,
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
      privateKey: newAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are same', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = oldAccount;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      {
        privateKey: newAccount.privateKey,
        address: newAccount.address.plain(),
        publicKey: newAccount.publicKey,
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
      privateKey: newAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are same, new no private key', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = oldAccount;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      {
        address: newAccount.address.plain(),
        publicKey: newAccount.publicKey,
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
      privateKey: newAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are same, old no private key', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = oldAccount;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
      },
      {
        privateKey: newAccount.privateKey,
        address: newAccount.address.plain(),
        publicKey: newAccount.publicKey,
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
      privateKey: newAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are same, old private key', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = oldAccount;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
      },
      {
        publicKey: newAccount.publicKey,
        address: newAccount.address.plain(),
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
    });
  });

  it('should resolveAccount when old and new are different, no private key new', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const newAccount = Account.generateNewAccount(networkType);
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      {
        publicKey: newAccount.publicKey,
        address: newAccount.address.plain(),
      },
    );
    expect(account).deep.equal({
      publicKey: newAccount.publicKey,
      address: newAccount.address.plain(),
    });
  });

  it('should resolveAccount when old and new are different. No new account', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
        privateKey: oldAccount.privateKey,
      },
      undefined,
    );
    expect(account).deep.equal({
      publicKey: oldAccount.publicKey,
      address: oldAccount.address.plain(),
      privateKey: oldAccount.privateKey,
    });
  });

  it('should resolveAccount when old and new are different. No new account. Old without private', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const oldAccount = Account.generateNewAccount(networkType);
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      {
        publicKey: oldAccount.publicKey,
        address: oldAccount.address.plain(),
      },
      undefined,
    );
    expect(account).deep.equal({
      publicKey: oldAccount.publicKey,
      address: oldAccount.address.plain(),
    });
  });

  it('should resolveAccount brand new', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.ENCRYPT;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Main,
      nodeName,
      undefined,
      undefined,
    );
    expect(account.address).toBeDefined();
    expect(account.privateKey).toBeDefined();
    expect(account.publicKey).toBeDefined();
  });

  it('should resolveAccount brand new on remote', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Remote,
      nodeName,
      undefined,
      undefined,
    );
    expect(account.address).toBeDefined();
    expect(account.privateKey).toBeDefined();
    expect(account.publicKey).toBeDefined();
  });

  it('should resolveAccount brand new on voting', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.PROMPT_MAIN;
    const account = await service.resolveAccount(
      networkType,
      securityMode,
      KeyName.Voting,
      nodeName,
      undefined,
      undefined,
    );
    expect(account.address).toBeDefined();
    expect(account.privateKey).toBeDefined();
    expect(account.publicKey).toBeDefined();
  });

  it('should resolveAccount raise error new', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.PROMPT_MAIN;

    try {
      await service.resolveAccount(
        networkType,
        securityMode,
        KeyName.Main,
        nodeName,
        undefined,
        undefined,
      );
      expect(false).toEqual(true);
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        "Account Main cannot be generated when Private Key Security Mode is PROMPT_MAIN. Account won't be stored anywhere!. Please use ENCRYPT, or provider your Main account with custom presets!",
      );
    }
  });

  it('should resolveAccount raise error new', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT;
    await expect(
      service.resolveAccount(
        networkType,
        securityMode,
        KeyName.Transport,
        nodeName,
        undefined,
        undefined,
      ),
    ).rejects.toThrow();
  });

  it('should resolveAccount raise error new', async () => {
    const networkType = NetworkType.TEST_NET;
    const securityMode = PrivateKeySecurityMode.PROMPT_ALL;
    await expect(
      service.resolveAccount(
        networkType,
        securityMode,
        KeyName.Remote,
        nodeName,
        undefined,
        undefined,
      ),
    ).rejects.toThrow();
  });
});
