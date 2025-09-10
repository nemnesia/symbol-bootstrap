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

describe('decrypt', () => {
  it('runs decrypt and creates file', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    await runCommand([
      'decrypt',
      '--source',
      'test-fixtures/encrypt/encrypted.yml',
      '--destination',
      'target/tests.encrypt/plain.yml',
      '--password',
      '1111',
    ]);
    // File should be created successfully
    expect(existsSync('target/tests.encrypt/plain.yml')).toEqual(true);
    expect(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)).deep.equal(
      await YamlUtils.loadYaml('test-fixtures/encrypt/plain.yml', false),
    );
    expect(
      CryptoUtils.encryptedCount(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)),
    ).toEqual(0);
  });

  it('runs decrypt on plain and creates file', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    await runCommand([
      'decrypt',
      '--source',
      'test-fixtures/encrypt/plain.yml',
      '--destination',
      'target/tests.encrypt/plain.yml',
      '--password',
      '1111',
    ]);
    // File should be created successfully
    expect(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)).toEqual(
      await YamlUtils.loadYaml('test-fixtures/encrypt/plain.yml', false),
    );
    expect(
      CryptoUtils.encryptedCount(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)),
    ).toEqual(0);
  });

  it('runs decrypt on an plain file and creates file', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    await runCommand([
      'decrypt',
      '--source',
      'test-fixtures/encrypt/plain.yml',
      '--destination',
      'target/tests.encrypt/plain.yml',
      '--password',
      '1111',
    ]);
    // File should be created successfully
    expect(existsSync('target/tests.encrypt/plain.yml')).toEqual(true);
    expect(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)).toEqual(
      await YamlUtils.loadYaml('test-fixtures/encrypt/plain.yml', false),
    );
    expect(
      CryptoUtils.encryptedCount(await YamlUtils.loadYaml('target/tests.encrypt/plain.yml', false)),
    ).toEqual(0);
  });

  it('password too short', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'decrypt',
      '--source',
      'test-fixtures/encrypt/encrypted.yml',
      '--destination',
      'target/tests.encrypt/plain.yml',
      '--password',
      '1',
    ]);
    expect(error.message).toContain(
      '--password is invalid, Password must have at least 4 characters but got 1',
    );
  });

  it('invalid password', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'decrypt',
      '--source',
      'test-fixtures/encrypt/encrypted.yml',
      '--destination',
      'target/tests.encrypt/plain.yml',
      '--password',
      '222222',
    ]);
    expect(error.message).toContain(
      'Cannot decrypt file test-fixtures/encrypt/encrypted.yml. Have you used the right password?',
    );
  });

  it('same destination', async () => {
    fileSystemService.deleteFolder('target/tests.encrypt');
    const { error } = await runCommand([
      'decrypt',
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
