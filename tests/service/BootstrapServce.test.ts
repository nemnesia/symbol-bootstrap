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

import { describe, expect, it } from 'vitest';
import {
  Assembly,
  BootstrapService,
  Constants,
  DefaultAccountResolver,
  LoggerFactory,
  LogType,
  Preset,
  StartParams,
} from '../../src/index.js';

const logger = LoggerFactory.getLogger(LogType.Silent);

describe('BootstrapService', () => {
  it(' bootstrap config compose bootstrap/default', async () => {
    const service = new BootstrapService(logger);
    const config: StartParams = {
      offline: true,
      report: false,
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.bootstrap,
      reset: true,
      upgrade: false,
      timeout: 60000 * 5,
      accountResolver: new DefaultAccountResolver(),
      target: 'target/test-output/BootstrapService.standard',
      detached: true,
      user: 'current',
    };

    const configResult = await service.config(config);
    expect(configResult.presetData).not.toBeNull();
    expect(configResult.addresses).not.toBeNull();
    const dockerCompose = await service.compose(config);
    expect(dockerCompose).toBeDefined();
  });

  it(' bootstrap config compose testnet/dual', async () => {
    const service = new BootstrapService(logger);
    const config: StartParams = {
      offline: true,
      report: false,
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.testnet,
      assembly: Assembly.dual,
      reset: true,
      upgrade: false,
      timeout: 60000 * 5,
      accountResolver: new DefaultAccountResolver(),
      target: 'target/test-output/BootstrapService.testnet',
      detached: true,
      user: 'current',
    };

    const configResult = await service.config(config);
    expect(configResult.presetData).not.toBeNull();
    expect(configResult.addresses).not.toBeNull();
    const dockerCompose = await service.compose(config);
    expect(dockerCompose).toBeDefined();
  });
});
