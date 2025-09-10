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

import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  Assembly,
  Constants,
  FileSystemService,
  LoggerFactory,
  LogType,
  RuntimeService,
  YamlUtils,
} from '../../src/index.js';
import { DockerCompose } from '../../src/model/index.js';
import {
  ComposeService,
  ConfigLoader,
  ConfigService,
  LinkService,
  Preset,
  StartParams,
} from '../../src/service/index.js';

const logger = LoggerFactory.getLogger(LogType.Silent);
const fileSystemService = new FileSystemService(logger);

describe('ComposeService', () => {
  const password = '1234';

  const assertDockerCompose = async (params: StartParams, expectedComposeFile: string) => {
    const presetData = new ConfigLoader(logger).createPresetData({
      password,
      ...params,
      workingDir: Constants.defaultWorkingDir,
    });
    const dockerCompose = await new ComposeService(logger, params).run(presetData);
    Object.values(dockerCompose.services).forEach((service) => {
      if (service.mem_limit) {
        service.mem_limit = 123;
      }
    });
    const targetDocker = join(params.target, `docker`, 'compose.yml');
    expect(existsSync(targetDocker)).toBe(true);
    const expectedFileLocation = `./test-fixtures/composes/${expectedComposeFile}`;
    if (!existsSync(expectedFileLocation)) {
      await YamlUtils.writeYaml(expectedFileLocation, dockerCompose, params.password);
    }

    const expectedDockerCompose: DockerCompose = YamlUtils.loadYaml(
      expectedFileLocation,
      params.password,
    );

    const promises = Object.values(expectedDockerCompose.services).map(async (service) => {
      if (!service.user) {
        return service;
      }
      const user = await new RuntimeService(logger).getDockerUserGroup();
      if (user) {
        service.user = user;
      } else {
        delete service.user;
      }
      return service;
    });
    await Promise.all(promises);
    expect(
      dockerCompose,
      `Generated Docker Compose:

${YamlUtils.toYaml(dockerCompose)}

`,
    ).to.be.deep.equal(expectedDockerCompose);
    fileSystemService.deleteFolder(params.target);
  };

  it('Compose testnet dual', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/testnet-dual',
      password,
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-testnet-dual-compose.yml');
  });

  it('Compose testnet api', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/testnet-api',
      password,
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.api,
    };
    await assertDockerCompose(params, 'expected-testnet-api-compose.yml');
  });

  it('Compose testnet peer', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/testnet-peer',
      password,
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.peer,
    };
    await assertDockerCompose(params, 'expected-testnet-peer-compose.yml');
  });

  it('Compose mainnet dual', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/mainnet-dual',
      password,
      reset: false,
      preset: Preset.mainnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-mainnet-dual-compose.yml');
  });

  it('Compose mainnet api', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/mainnet-api',
      password,
      reset: false,
      preset: Preset.mainnet,
      assembly: Assembly.api,
    };
    await assertDockerCompose(params, 'expected-mainnet-api-compose.yml');
  });

  it('Compose mainnet peer', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/mainnet-peer',
      password,
      reset: false,
      preset: Preset.mainnet,
      assembly: Assembly.peer,
    };
    await assertDockerCompose(params, 'expected-mainnet-peer-compose.yml');
  });

  it('Compose testnet httpsProxy', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/testnet-https-proxy',
      password,
      customPreset: './test-fixtures/unit-test-profiles/https-proxy.yml',
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-testnet-httpsproxy-compose.yml');
  });

  it('Compose testnet native ssl', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/testnet-native-ssl',
      password,
      customPreset: './test-fixtures/unit-test-profiles/native-ssl.yml',
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-testnet-native-ssl-compose.yml');
  });

  it('Compose testnet dual voting', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/ComposeService-testnet-voting',
      password,
      reset: false,
      customPreset: './test-fixtures/unit-test-profiles/voting_preset.yml',
      preset: Preset.testnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-testnet-voting-compose.yml');
  });

  it('Compose bootstrap default', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {
        faucets: [
          {
            compose: {
              environment: { FAUCET_PRIVATE_KEY: 'MockMe', NATIVE_CURRENCY_ID: 'Mockme2' },
            },
          },
        ],
      },
      target: 'target/test-output/ComposeService-bootstrap.default',
      reset: false,
      preset: Preset.bootstrap,
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap.yml');
  });

  it('Compose bootstrap custom compose', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {
        faucets: [
          {
            compose: {
              environment: { FAUCET_PRIVATE_KEY: 'MockMe', NATIVE_CURRENCY_ID: 'Mockme2' },
            },
          },
        ],
      },
      target: 'target/test-output/ComposeService-bootstrap.compose',
      password,
      customPreset: './test-fixtures/custom_compose_preset.yml',
      reset: false,
      preset: Preset.bootstrap,
      assembly: Assembly.multinode,
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap-custom-compose.yml');
  });

  it('Compose bootstrap custom preset', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {
        faucets: [
          {
            compose: {
              environment: { FAUCET_PRIVATE_KEY: 'MockMe', NATIVE_CURRENCY_ID: 'Mockme2' },
            },
          },
        ],
      },
      target: 'target/test-output/ComposeService-bootstrap.custom',
      customPreset: './test-fixtures/custom_preset.yml',
      reset: false,
      preset: Preset.bootstrap,
      assembly: Assembly.multinode,
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap-custom.yml');
  });

  it('Compose mainnet custom services, logging and grace period', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      target: 'target/test-output/ComposeService-mainnet-custom-services',
      customPreset: './test-fixtures/unit-test-profiles/custom_compose_service.yml',
      reset: false,
      preset: Preset.testnet,
      assembly: Assembly.dual,
    };
    await assertDockerCompose(params, 'expected-mainnet-custom-services.yml');
  });

  it('Compose bootstrap demo with debug on', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {
        dockerComposeDebugMode: true,
        faucets: [
          {
            compose: {
              environment: { FAUCET_PRIVATE_KEY: 'MockMe', NATIVE_CURRENCY_ID: 'Mockme2' },
            },
          },
        ],
      },
      target: 'target/test-output/ComposeService-bootstrap.demo',
      password,
      reset: false,
      assembly: Assembly.demo,
      preset: Preset.bootstrap,
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap-demo.yml');
  });
  it('Compose bootstrap dual', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {},
      target: 'target/test-output/ComposeService-bootstrap.dual',
      password,
      reset: false,
      assembly: Assembly.dual,
      preset: Preset.bootstrap,
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap-dual.yml');
  });

  it('Compose mainnet services', async () => {
    const params: StartParams = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPreset: './test-fixtures/unit-test-profiles/services_custom_preset.yml',
      customPresetObject: {
        knownRestGateways: ['http://some.node.com:3000'],
      },
      offline: true,
      target: 'target/test-output/ComposeService-mainnet-services.dual',
      password,
      reset: false,
      assembly: Assembly.services,
      preset: Preset.mainnet,
    };
    await assertDockerCompose(params, 'expected-compose-mainnet-services.yml');
  });

  it('Compose bootstrap repeat', async () => {
    const params = {
      ...ConfigService.defaultParams,
      ...LinkService.defaultParams,
      customPresetObject: {
        faucets: [
          {
            compose: {
              environment: { FAUCET_PRIVATE_KEY: 'MockMe', NATIVE_CURRENCY_ID: 'Mockme2' },
            },
          },
        ],
      },
      reset: false,
      target: 'target/test-output/ComposeService-bootstrap.repeat',
      password,
      preset: Preset.bootstrap,
      assembly: Assembly.multinode,
      customPreset: './test-fixtures/repeat_preset.yml',
    };
    await assertDockerCompose(params, 'expected-compose-bootstrap-repeat.yml');
  });

  it('resolveDebugOptions', async () => {
    const service = new ComposeService(logger, ComposeService.defaultParams);
    expect(service.resolveDebugOptions(true, true)).deep.equals(
      ComposeService.DEBUG_SERVICE_PARAMS,
    );
    expect(service.resolveDebugOptions(true, undefined)).deep.equals(
      ComposeService.DEBUG_SERVICE_PARAMS,
    );
    expect(service.resolveDebugOptions(true, false)).deep.equals({});
    expect(service.resolveDebugOptions(false, true)).deep.equals(
      ComposeService.DEBUG_SERVICE_PARAMS,
    );
    expect(service.resolveDebugOptions(false, undefined)).deep.equals({});
    expect(service.resolveDebugOptions(false, false)).deep.equals({});
  });
});
