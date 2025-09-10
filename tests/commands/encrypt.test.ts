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

import { runCommand } from '@oclif/test';
import { existsSync } from 'fs';
import { describe, expect, it } from 'vitest';
import {
  CryptoUtils,
  FileSystemService,
  LoggerFactory,
  LogType,
  YamlUtils,
} from '../../src/index.js';

const logger = LoggerFactory.getLogger(LogType.Silent);
const fileSystemService = new FileSystemService(logger);

describe('encrypt', () => {
  it('runs encrypt and creates file', async () => {
    fileSystemService.deleteFolder('test/tests.encrypt');
    await runCommand([
      'encrypt',
      '--source',
      'test-fixtures/encrypt/plain.yml',
      '--destination',
      'target/tests.encrypt/encrypted.yml',
      '--password',
      '1111',
    ]);
    // File should be created successfully
    expect(existsSync('target/tests.encrypt/encrypted.yml')).toEqual(true);
    expect(await YamlUtils.loadYaml('target/tests.encrypt/encrypted.yml', '1111')).deep.equal(
      await YamlUtils.loadYaml('test-fixtures/encrypt/encrypted.yml', '1111'),
    );
    expect(
      CryptoUtils.encryptedCount(
        await YamlUtils.loadYaml('target/tests.encrypt/encrypted.yml', false),
      ),
    ).toEqual(
      CryptoUtils.encryptedCount(
        await YamlUtils.loadYaml('test-fixtures/encrypt/encrypted.yml', false),
      ),
    );
  });

  it('password too short', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'encrypt',
      '--source',
      'test-fixtures/encrypt/plain.yml',
      '--destination',
      'target/tests.encrypt/encrypted.yml',
      '--password',
      '1',
    ]);
    expect(error.message).toContain(
      '--password is invalid, Password must have at least 4 characters but got 1',
    );
  });

  it('already encrypted', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'encrypt',
      '--source',
      'test-fixtures/encrypt/encrypted.yml',
      '--destination',
      'target/tests.encrypt/encrypted.yml',
      '--password',
      '1111',
    ]);
    expect(error.message).toContain(
      'Source file test-fixtures/encrypt/encrypted.yml is already encrypted. If you want to decrypt it use the decrypt command.',
    );
  });

  it('same destination', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'encrypt',
      '--source',
      'test-fixtures/encrypt/plain.yml',
      '--destination',
      'test-fixtures/encrypt/plain.yml',
      '--password',
      '1111',
    ]);
    expect(error.message).toContain(
      'Destination file test-fixtures/encrypt/plain.yml already exists!',
    );
  });
});
