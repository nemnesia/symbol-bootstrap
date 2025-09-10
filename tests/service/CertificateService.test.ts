/*
 * Copyright 2022 Fernando Boucquez
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { deepStrictEqual } from 'assert';
import { promises as fsPromises, readFileSync } from 'fs';
import { join } from 'path';
import { Account, NetworkType } from 'symbol-sdk';
import { describe, expect, it } from 'vitest';
import { LoggerFactory, LogType } from '../../src/logger/index.js';
import {
  CertificateMetadata,
  CertificateService,
  ConfigLoader,
  Constants,
  DefaultAccountResolver,
  FileSystemService,
  NodeCertificates,
  Preset,
  RenewMode,
  RuntimeService,
  YamlUtils,
} from '../../src/service/index.js';

const logger = LoggerFactory.getLogger(LogType.Silent);
const runtimeService = new RuntimeService(logger);
const accountResolver = new DefaultAccountResolver();
const fileSystemService = new FileSystemService(logger);

describe('CertificateService', () => {
  const target = 'target/test-output/CertificateService.test';
  const presetData = new ConfigLoader(logger).createPresetData({
    workingDir: Constants.defaultWorkingDir,
    preset: Preset.testnet,
    assembly: 'dual',
    password: 'abc',
  });
  const networkType = NetworkType.TEST_NET;
  const keys: NodeCertificates = {
    main: ConfigLoader.toConfig(
      Account.createFromPrivateKey(
        'E095162875BB1D98CA5E0941670E01C1B0DBDF86DF7B3BEDA4A93635F8E51A03',
        networkType,
      ),
    ),
    transport: ConfigLoader.toConfig(
      Account.createFromPrivateKey(
        '415F253ABF0FB2DFD39D7F409EFA2E88769873CAEB45617313B98657A1476A15',
        networkType,
      ),
    ),
  };
  const randomSerial = '4C87E5C49034B711E2DA38D116366829DA144B\n'.toLowerCase();
  const name = 'test-node';

  it('getCertificates from output', async () => {
    const outputFile = `./test-fixtures/certificates/output.txt`;
    const output = YamlUtils.loadFileAsText(outputFile);
    const certificates = CertificateService.getCertificates(output);
    deepStrictEqual(certificates, [
      {
        privateKey: '7B63F86AF5E33617C349832012F42FAC0102001A705E4842D0F615B1BA1C98A2',
        publicKey: 'D22DBD053E6913005DE2E59A3907C88CD6AB081B8BC1AC26EE24BDEB09B8BDA2',
      },
      {
        privateKey: '6ED4C590110285572FB60F1F2ADF50F2DF96991B0A72E86241B2D44B4CE7E696',
        publicKey: '5F4F8760D675F6836D4C07576F88B179BFE4471EDFBA4ECD2399C8F1EF02EE71',
      },
    ]);
  });

  async function verifyCertFolder() {
    const files = await fsPromises.readdir(target);
    expect(files).deep.equal([
      'ca.cert.pem',
      'ca.pubkey.pem',
      'metadata.yml',
      'node.crt.pem',
      'node.full.crt.pem',
      'node.key.pem',
    ]);

    const diffFiles = ['ca.cert.pem', 'node.crt.pem', 'node.full.crt.pem'];

    // Filtering out files that aren't the same
    files
      .filter((f) => diffFiles.indexOf(f) === -1)
      .forEach((f) => {
        expect(readFileSync(join(target, f)), `Different fields: ${f}`).deep.equal(
          readFileSync(join('test-fixtures', 'nodeCertificates', f)),
        );
      });
  }

  it('createCertificates', async () => {
    fileSystemService.deleteFolder(target);

    const service = new CertificateService(logger, accountResolver, {
      target: target,
      user: await runtimeService.getDockerUserGroup(),
    });
    await service.run(presetData, name, keys, RenewMode.ONLY_WARNING, target, randomSerial);

    const expectedMetadata: CertificateMetadata = {
      version: 1,
      transportPublicKey: keys.transport.publicKey,
      mainPublicKey: keys.main.publicKey,
    };
    expect(expectedMetadata).deep.equal(YamlUtils.loadYaml(join(target, 'metadata.yml'), false));
    await verifyCertFolder();
  });

  it('createCertificates expiration warnings', async () => {
    fileSystemService.deleteFolder(target);
    const nodeCertificateExpirationInDays = presetData.nodeCertificateExpirationInDays;
    const caCertificateExpirationInDays = presetData.caCertificateExpirationInDays;

    const service = new CertificateService(logger, accountResolver, {
      target: target,
      user: await runtimeService.getDockerUserGroup(),
    });
    await service.run(presetData, name, keys, RenewMode.ONLY_WARNING, target, randomSerial);

    async function willExpire(
      certificateFileName: string,
      certificateExpirationWarningInDays: number,
    ): Promise<boolean> {
      const report = await service.willCertificateExpire(
        presetData.symbolServerImage,
        target,
        certificateFileName,
        certificateExpirationWarningInDays,
      );
      expect(report.expirationDate.endsWith(' GMT')).toEqual(true);
      return report.willExpire;
    }

    expect(
      await willExpire(
        CertificateService.NODE_CERTIFICATE_FILE_NAME,
        nodeCertificateExpirationInDays - 1,
      ),
    ).toEqual(false);
    expect(
      await willExpire(
        CertificateService.NODE_CERTIFICATE_FILE_NAME,
        nodeCertificateExpirationInDays + 1,
      ),
    ).toEqual(true);
    expect(
      await willExpire(
        CertificateService.CA_CERTIFICATE_FILE_NAME,
        caCertificateExpirationInDays - 1,
      ),
    ).toEqual(false);
    expect(
      await willExpire(
        CertificateService.CA_CERTIFICATE_FILE_NAME,
        caCertificateExpirationInDays + 1,
      ),
    ).toEqual(true);
  });

  it('create and renew certificates', async () => {
    const target = 'target/test-output/CertificateService.test';
    fileSystemService.deleteFolder(target);
    const service = new CertificateService(logger, accountResolver, {
      target: target,
      user: await runtimeService.getDockerUserGroup(),
    });
    async function getCertFile(certificateFileName: string): Promise<string> {
      return readFileSync(join(target, certificateFileName), 'utf-8');
    }

    // First time generation
    expect(
      await service.run(
        { ...presetData, nodeCertificateExpirationInDays: 10 },
        name,
        keys,
        RenewMode.WHEN_REQUIRED,
        target,
      ),
    ).toEqual(true);
    await verifyCertFolder();
    const originalCaFile = await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME);
    const originalNodeFile = await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME);

    //Renew is not required
    expect(
      await service.run(
        { ...presetData, certificateExpirationWarningInDays: 9 },
        name,
        keys,
        RenewMode.WHEN_REQUIRED,
        target,
      ),
    ).toEqual(false);
    await verifyCertFolder();
    expect(await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME)).toEqual(originalCaFile);
    expect(await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME)).toEqual(
      originalNodeFile,
    );

    //Renew is required but not auto-upgrade
    expect(
      await service.run(
        { ...presetData, certificateExpirationWarningInDays: 11 },
        name,
        keys,
        RenewMode.ONLY_WARNING,
        target,
      ),
    ).toEqual(false);
    await verifyCertFolder();
    expect(await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME)).toEqual(originalCaFile);
    expect(await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME)).toEqual(
      originalNodeFile,
    );

    //Renew is required and auto-upgrade
    expect(
      await service.run(
        { ...presetData, certificateExpirationWarningInDays: 11 },
        name,
        keys,
        RenewMode.WHEN_REQUIRED,
        target,
      ),
    ).toEqual(true);
    await verifyCertFolder();
    expect(await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME)).toEqual(originalCaFile);
    expect(await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME)).not.toEqual(
      originalNodeFile,
    ); // Renewed
  });

  it('create and renew certificates always', async () => {
    const target = 'target/test-output/CertificateService.test';
    fileSystemService.deleteFolder(target);
    const service = new CertificateService(logger, accountResolver, {
      target: target,
      user: await runtimeService.getDockerUserGroup(),
    });

    async function getCertFile(certificateFileName: string): Promise<string> {
      return readFileSync(join(target, certificateFileName), 'utf-8');
    }

    // First time generation
    expect(
      await service.run({ ...presetData }, name, keys, RenewMode.ONLY_WARNING, target),
    ).toEqual(true);
    await verifyCertFolder();
    const originalCaFile = await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME);
    const originalNodeFile = await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME);

    //Renew is not required
    expect(
      await service.run(
        { ...presetData, certificateExpirationWarningInDays: 50 },
        name,
        keys,
        RenewMode.WHEN_REQUIRED,
        target,
      ),
    ).toEqual(false);
    await verifyCertFolder();
    expect(await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME)).toEqual(originalCaFile);
    expect(await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME)).toEqual(
      originalNodeFile,
    );

    //Renew is not required but always
    expect(
      await service.run(
        { ...presetData, certificateExpirationWarningInDays: 50 },
        name,
        keys,
        RenewMode.ALWAYS,
        target,
      ),
    ).toEqual(true);
    await verifyCertFolder();
    expect(await getCertFile(CertificateService.CA_CERTIFICATE_FILE_NAME)).toEqual(originalCaFile);
    expect(await getCertFile(CertificateService.NODE_CERTIFICATE_FILE_NAME)).not.toEqual(
      originalNodeFile,
    ); // Renewed
  });
});
