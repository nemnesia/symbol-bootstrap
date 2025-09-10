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
import { Assembly, Constants, LoggerFactory, LogType, Utils, YamlUtils } from '../../src/index.js';
import { ConfigLoader, Preset } from '../../src/service/index.js';

const logger = LoggerFactory.getLogger(LogType.Silent);

describe('ConfigLoader', () => {
  it('ConfigLoader loadPresetData no preset', async () => {
    const configLoader = new ConfigLoader(logger);
    try {
      configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        preset: undefined,
        assembly: undefined,
        customPreset: undefined,
        customPresetObject: undefined,
        password: 'abc',
      });
      expect(false).toEqual(true); // should have raised an error!
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        'Preset value could not be resolved from target folder contents. Please provide the --preset parameter when running the config/start command.',
      );
    }
  });

  it('ConfigLoader loadPresetData testnet no assembly', async () => {
    const configLoader = new ConfigLoader(logger);
    try {
      configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        preset: Preset.testnet,
        assembly: undefined,
        customPreset: undefined,
        customPresetObject: undefined,
        password: 'abc',
      });
      expect(false).toEqual(true); // should have raised an error!
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        'Preset testnet requires assembly (-a, --assembly option). Possible values are: dual, peer, api, demo, multinode, services',
      );
    }
  });

  it('ConfigLoader loadPresetData invalid assembly file', async () => {
    const configLoader = new ConfigLoader(logger);
    try {
      configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        preset: Preset.testnet,
        assembly: 'invalid-assembly.yml',
        customPreset: undefined,
        customPresetObject: undefined,
        password: 'abc',
      });
      expect(false).toEqual(true); // should have raised an error!
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        "Assembly 'invalid-assembly.yml' is not valid for preset 'testnet'. Have you provided the right --preset <preset> --assembly <assembly> ?",
      );
    }
  });

  it('ConfigLoader loadPresetData invalid preset file', async () => {
    const configLoader = new ConfigLoader(logger);
    try {
      configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        preset: 'invalid-preset.yml',
        assembly: Assembly.dual,
        customPreset: undefined,
        customPresetObject: undefined,
        password: 'abc',
      });
      expect(false).toEqual(true); // should have raised an error!
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        "Preset 'invalid-preset.yml' does not exist. Have you provided the right --preset <preset> ?",
      );
    }
  });

  it('ConfigLoader loadPresetData bootstrap no assembly', async () => {
    const configLoader = new ConfigLoader(logger);
    const presetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.bootstrap,
      customPreset: undefined,
      customPresetObject: undefined,
      password: 'abc',
    });
    expect(presetData).toBeDefined();
    expect(presetData.preset).to.toEqual(Preset.bootstrap);
    expect(presetData.assembly).to.toEqual(Assembly.multinode);
  });

  it('ConfigLoader loadPresetData testnet assembly', async () => {
    const configLoader = new ConfigLoader(logger);
    const presetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.testnet,
      assembly: Assembly.api,
      customPreset: undefined,
      customPresetObject: undefined,
      password: 'abc',
    });
    expect(presetData).toBeDefined();
    expect(presetData.preset).to.toEqual(Preset.testnet);
    expect(presetData.assembly).to.toEqual(Assembly.api);
  });

  it('ConfigLoader loadPresetData testnet assembly using external files', async () => {
    const configLoader = new ConfigLoader(logger);
    const presetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: 'presets/testnet/network.yml',
      assembly: 'presets/assemblies/assembly-api.yml',
      customPreset: undefined,
      customPresetObject: undefined,
      password: 'abc',
    });
    expect(presetData).toBeDefined();
    expect(presetData.preset).to.toEqual('presets/testnet/network.yml');
    expect(presetData.assembly).to.toEqual('presets/assemblies/assembly-api.yml');
  });

  it('ConfigLoader custom maxUnlockedAccounts', async () => {
    const configLoader = new ConfigLoader(logger);
    const originalPresetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.testnet,
      assembly: Assembly.dual,
      customPreset: 'test-fixtures/unit-test-profiles/custom_preset.yml',
      customPresetObject: {
        maxUnlockedAccounts: 30,
      },
      password: 'abcd',
    });
    expect(originalPresetData).toBeDefined();
    expect(originalPresetData.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(originalPresetData.maxUnlockedAccounts).toEqual(30);
    expect(originalPresetData.customPresetCache).deep.equal({
      maxUnlockedAccounts: 30,
      nodes: [
        {
          host: 'my-host.io',
          mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
          remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
          transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
          voting: true,
          vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
        },
      ],
      privateKeySecurityMode: 'PROMPT_MAIN',
    });

    const upgradedPresetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      oldPresetData: originalPresetData,
      preset: Preset.testnet,
      assembly: Assembly.dual,
      password: 'abcd',
    });
    expect(upgradedPresetData).toBeDefined();
    expect(upgradedPresetData.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(upgradedPresetData.maxUnlockedAccounts).toEqual(30);
    expect(upgradedPresetData.customPresetCache).deep.equal({
      maxUnlockedAccounts: 30,
      nodes: [
        {
          host: 'my-host.io',
          mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
          remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
          transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
          voting: true,
          vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
        },
      ],
      privateKeySecurityMode: 'PROMPT_MAIN',
    });

    const upgradedPresetResetToDefaults = await configLoader.createPresetData({
      workingDir: '.',
      oldPresetData: originalPresetData,
      preset: Preset.testnet,
      customPresetObject: {
        maxUnlockedAccounts: 15,
      },
      assembly: Assembly.dual,
      password: 'abcd',
    });
    expect(upgradedPresetResetToDefaults).toBeDefined();
    expect(upgradedPresetResetToDefaults.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(upgradedPresetResetToDefaults.maxUnlockedAccounts).toEqual(15);
    expect(upgradedPresetResetToDefaults.customPresetCache).deep.equal({
      maxUnlockedAccounts: 15,
    });
  });

  it('mergePreset', async () => {
    const configLoader = new ConfigLoader(logger);
    expect(
      configLoader.mergePresets(
        { maxUnlockedAccounts: 1, inflation: { a: 1, c: 1, d: 1 } },
        { maxUnlockedAccounts: 2 },
        { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 } },
        { maxUnlockedAccounts: 4 },
      ),
    ).deep.equal({ maxUnlockedAccounts: 4, inflation: { c: 2, d: 2, e: 2 } });
  });

  it('mergePreset with node', async () => {
    const configLoader = new ConfigLoader(logger);
    const merged = configLoader.mergePresets(
      {
        maxUnlockedAccounts: 1,
        inflation: { a: 1, c: 1, d: 1 },
      },
      { nodes: [{ maxUnlockedAccounts: 5, name: 'name1' }], knownRestGateways: ['r1', 'r2'] },
      { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 }, knownRestGateways: ['r2', 'r3'] },
      {
        maxUnlockedAccounts: 4,
        nodes: [{ maxUnlockedAccounts: 3 }, { maxUnlockedAccounts: 4, name: 'nameB' }],
      },
    );
    expect(merged).deep.equal({
      maxUnlockedAccounts: 4,
      inflation: { c: 2, d: 2, e: 2 },
      nodes: [
        { maxUnlockedAccounts: 3, name: 'name1' },
        { maxUnlockedAccounts: 4, name: 'nameB' },
      ],
      knownRestGateways: ['r2', 'r3'],
    });
  });

  it('ConfigLoader custom maxUnlockedAccounts', async () => {
    const configLoader = new ConfigLoader(logger);
    const originalPresetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.testnet,
      assembly: Assembly.dual,
      customPreset: 'test-fixtures/unit-test-profiles/custom_preset.yml',
      customPresetObject: {
        maxUnlockedAccounts: 30,
      },
      password: 'abcd',
    });
    expect(originalPresetData).toBeDefined();
    expect(originalPresetData.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(originalPresetData.maxUnlockedAccounts).toEqual(30);
    expect(originalPresetData.customPresetCache).deep.equal({
      maxUnlockedAccounts: 30,
      nodes: [
        {
          host: 'my-host.io',
          mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
          remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
          transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
          voting: true,
          vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
        },
      ],
      privateKeySecurityMode: 'PROMPT_MAIN',
    });

    const upgradedPresetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      oldPresetData: originalPresetData,
      preset: Preset.testnet,
      assembly: Assembly.dual,
      password: 'abcd',
    });
    expect(upgradedPresetData).toBeDefined();
    expect(upgradedPresetData.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(upgradedPresetData.maxUnlockedAccounts).toEqual(30);
    expect(upgradedPresetData.customPresetCache).deep.equal({
      maxUnlockedAccounts: 30,
      nodes: [
        {
          host: 'my-host.io',
          mainPrivateKey: 'CA82E7ADAF7AB729A5462A1BD5AA78632390634904A64EB1BB22295E2E1A1BDD',
          remotePrivateKey: 'EFE3F0EF0AB368B8D7AC194D52A8CCFA2D5050B80B9C76E4D2F4D4BF2CD461C1',
          transportPrivateKey: '6154154096354BC3DB522174ACD8BFE553893A0991BD5D105599846F17A3383B',
          voting: true,
          vrfPrivateKey: 'F3C24C153783B683E40FB2671493B54480370BF4E3AB8027D4BF1293E14EB9B8',
        },
      ],
      privateKeySecurityMode: 'PROMPT_MAIN',
    });

    const upgradedPresetResetToDefaults = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      oldPresetData: originalPresetData,
      preset: Preset.testnet,
      customPresetObject: {
        maxUnlockedAccounts: 15,
      },
      assembly: Assembly.dual,
      password: 'abcd',
    });
    expect(upgradedPresetResetToDefaults).toBeDefined();
    expect(upgradedPresetResetToDefaults.nodes![0].maxUnlockedAccounts).toEqual(undefined);
    expect(upgradedPresetResetToDefaults.maxUnlockedAccounts).toEqual(15);
    expect(upgradedPresetResetToDefaults.customPresetCache).deep.equal({
      maxUnlockedAccounts: 15,
    });
  });

  it('mergePreset', async () => {
    const configLoader = new ConfigLoader(logger);
    expect(
      configLoader.mergePresets(
        { maxUnlockedAccounts: 1, inflation: { a: 1, c: 1, d: 1 } },
        { maxUnlockedAccounts: 2 },
        { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 } },
        { maxUnlockedAccounts: 4 },
      ),
    ).deep.equal({ maxUnlockedAccounts: 4, inflation: { c: 2, d: 2, e: 2 } });
  });

  it('mergePreset with node', async () => {
    const configLoader = new ConfigLoader(logger);
    const merged = configLoader.mergePresets(
      {
        maxUnlockedAccounts: 1,
        inflation: { a: 1, c: 1, d: 1 },
      },
      { nodes: [{ maxUnlockedAccounts: 5, name: 'name1' }], knownRestGateways: ['r1', 'r2'] },
      { maxUnlockedAccounts: 3, inflation: { c: 2, d: 2, e: 2 }, knownRestGateways: ['r2', 'r3'] },
      {
        maxUnlockedAccounts: 4,
        nodes: [{ maxUnlockedAccounts: 3 }, { maxUnlockedAccounts: 4, name: 'nameB' }],
      },
    );
    expect(merged).deep.equal({
      maxUnlockedAccounts: 4,
      inflation: { c: 2, d: 2, e: 2 },
      nodes: [
        { maxUnlockedAccounts: 3, name: 'name1' },
        { maxUnlockedAccounts: 4, name: 'nameB' },
      ],
      knownRestGateways: ['r2', 'r3'],
    });
  });

  it('ConfigLoader loadPresetData bootstrap custom', async () => {
    const configLoader = new ConfigLoader(logger);
    const presetData = await configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      preset: Preset.bootstrap,
      assembly: undefined,
      customPreset: 'test-fixtures/override-currency-preset.yml',
      customPresetObject: undefined,
      password: 'abcd',
    });
    expect(presetData).toBeDefined();
    expect(presetData?.nemesis?.mosaics?.[0].accounts).toEqual(20);
    const yaml = YamlUtils.toYaml(presetData);
    expect(YamlUtils.fromYaml(yaml)).to.be.deep.equal(presetData);
  });

  it('ConfigLoader loadPresetData bootstrap custom too short!', async () => {
    const configLoader = new ConfigLoader(logger);
    try {
      await configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        preset: Preset.bootstrap,
        assembly: undefined,
        customPreset: 'test-fixtures/override-currency-preset.yml',
        customPresetObject: undefined,
        password: 'abc',
      });
    } catch (e) {
      expect(Utils.getMessage(e)).toEqual(
        'Password is too short. It should have at least 4 characters!',
      );
    }
  });

  it('applyIndex', async () => {
    const configLoader = new ConfigLoader(logger);
    const context = { $index: 10 };
    expect(configLoader.applyValueTemplate(context, 'hello')).toEqual('hello');
    expect(configLoader.applyValueTemplate(context, 'index')).toEqual('index');
    expect(configLoader.applyValueTemplate(context, '$index')).toEqual('$index');
    expect(configLoader.applyValueTemplate(context, '{{index}}')).toEqual('');
    expect(configLoader.applyValueTemplate(context, '{{$index}}')).toEqual('10');
    expect(configLoader.applyValueTemplate(context, '{{add $index 2}}')).toEqual('12');
    expect(configLoader.applyValueTemplate(context, '100.100.{{add $index 2}}')).toEqual(
      '100.100.12',
    );
    expect(configLoader.applyValueTemplate(context, '100.100.{{add $index 5}}')).toEqual(
      '100.100.15',
    );
  });

  it('expandServicesRepeat when repeat 3', async () => {
    const configLoader = new ConfigLoader(logger);
    const services = [
      {
        repeat: 3,
        apiNodeName: 'api-node-{{$index}}',
        apiNodeHost: 'api-node-{{$index}}',
        apiNodeBrokerHost: 'api-node-broker-{{$index}}',
        name: 'rest-gateway-{{$index}}',
        description: 'catapult development network',
        databaseHost: 'db-{{$index}}',
        openPort: true,
        ipv4_address: '172.20.0.{{add $index 5}}',
      },
    ];

    const expandedServices = configLoader.expandServicesRepeat({}, services);

    const expectedExpandedServices = [
      {
        apiNodeName: 'api-node-0',
        apiNodeHost: 'api-node-0',
        apiNodeBrokerHost: 'api-node-broker-0',
        name: 'rest-gateway-0',
        description: 'catapult development network',
        databaseHost: 'db-0',
        openPort: true,
        ipv4_address: '172.20.0.5',
      },
      {
        apiNodeName: 'api-node-1',
        apiNodeHost: 'api-node-1',
        apiNodeBrokerHost: 'api-node-broker-1',
        name: 'rest-gateway-1',
        description: 'catapult development network',
        databaseHost: 'db-1',
        openPort: true,
        ipv4_address: '172.20.0.6',
      },
      {
        apiNodeName: 'api-node-2',
        apiNodeHost: 'api-node-2',
        apiNodeBrokerHost: 'api-node-broker-2',
        name: 'rest-gateway-2',
        description: 'catapult development network',
        databaseHost: 'db-2',
        openPort: true,
        ipv4_address: '172.20.0.7',
      },
    ];
    expect(expandedServices).to.be.deep.equal(expectedExpandedServices);
  });

  it('expandServicesRepeat when repeat 0', async () => {
    const configLoader = new ConfigLoader(logger);
    const services = [
      {
        repeat: 0,
        apiNodeName: 'api-node-{{$index}}',
        apiNodeHost: 'api-node-{{$index}}',
        apiNodeBrokerHost: 'api-node-broker-{{$index}}',
        name: 'rest-gateway-{{$index}}',
        description: 'catapult development network',
        databaseHost: 'db-{{$index}}',
        openPort: true,
        ipv4_address: '172.20.0.{{add $index 5}}',
      },
    ];

    const expandedServices = configLoader.expandServicesRepeat({}, services);

    expect(expandedServices).to.be.deep.equal([]);
  });

  it('expandServicesRepeat when no repeat', async () => {
    const configLoader = new ConfigLoader(logger);
    const services = [
      {
        apiNodeName: 'api-node-{{$index}}',
        apiNodeHost: 'api-node-{{$index}}',
        apiNodeBrokerHost: 'api-node-broker-{{$index}}',
        name: 'rest-gateway-{{$index}}',
        description: 'catapult development network',
        databaseHost: 'db-{{$index}}',
        openPort: true,
        ipv4_address: '172.20.0.{{add $index 5}}',
      },
    ];

    const expandedServices = configLoader.expandServicesRepeat({}, services);

    const expectedExpandedServices = [
      {
        apiNodeBrokerHost: 'api-node-broker-0',
        apiNodeHost: 'api-node-0',
        apiNodeName: 'api-node-0',
        databaseHost: 'db-0',
        description: 'catapult development network',
        ipv4_address: '172.20.0.5',
        name: 'rest-gateway-0',
        openPort: true,
      },
    ];
    expect(expandedServices).to.be.deep.equal(expectedExpandedServices);
  });

  it('applyValueTemplate when object', async () => {
    const configLoader = new ConfigLoader(logger);
    const value = {
      _info: 'this file contains a list of api-node peers',
      knownPeers: [
        {
          publicKey: '46902d4a6136d43f8d78e3ab4494aee9b1da17886f6f0a698959714f96900bd6',
          endpoint: {
            host: 'api-node-0',
            port: 7900,
          },
          metadata: {
            name: 'api-node-0',
            roles: 'Api',
          },
        },
      ],
    };

    expect(configLoader.applyValueTemplate({}, value)).to.be.deep.equal(value);
    expect(
      configLoader.applyValueTemplate({}, YamlUtils.fromYaml(YamlUtils.toYaml(value))),
    ).to.be.deep.equal(value);
  });

  it('applyValueTemplate when array', async () => {
    const configLoader = new ConfigLoader(logger);
    const value = [
      {
        _info: 'this file contains a list of api-node peers',
        knownPeers: [
          {
            publicKey: '46902d4a6136d43f8d78e3ab4494aee9b1da17886f6f0a698959714f96900bd6',
            endpoint: {
              host: 'api-node-0',
              port: 7900,
            },
            metadata: {
              name: 'api-node-0',
              roles: 'Api',
            },
          },
        ],
      },
    ];

    expect(configLoader.applyValueTemplate({}, value)).to.be.deep.equal(value);
    expect(
      configLoader.applyValueTemplate({}, YamlUtils.fromYaml(YamlUtils.toYaml(value))),
    ).to.be.deep.equal(value);
  });
});
