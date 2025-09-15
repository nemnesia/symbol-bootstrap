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

import { Command, Flags } from '@oclif/core';
import { t } from 'i18next';
import { LoggerFactory, System } from '../../logger/index.js';
import { ConfigPreset } from '../../model/index.js';
import {
  CommandUtils,
  ConfigLoader,
  Constants,
  CryptoUtils,
  keyWithOptions,
  RemoteNodeService,
  Utils,
  VotingService,
  YamlUtils,
} from '../../service/index.js';

export default class UpdateVotingKeys extends Command {
  static description = 'commands.updateVotingKeys.description';

  static examples = [`$ symbol-bootstrap updateVotingKeys`];

  static userFlag() {
    const param = { currentUser: Constants.CURRENT_USER };
    return Flags.string({
      char: 'u',
      description: keyWithOptions('flags.updateVotingKeys.user.description', param),
      default: Constants.CURRENT_USER,
    });
  }

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    user: this.userFlag(),
    finalizationEpoch: Flags.integer({
      description: 'flags.updateVotingKeys.finalizationEpoch.description',
    }),
    logger: CommandUtils.getLoggerFlag(...System),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(UpdateVotingKeys);
    const password = false;
    const target = flags.target;
    const logger = LoggerFactory.getLogger(flags.logger);
    const configLoader = new ConfigLoader(logger);
    const addressesLocation = configLoader.getGeneratedAddressLocation(target);
    let presetData: ConfigPreset;
    try {
      const oldPresetData = configLoader.loadExistingPresetData(target, password);
      presetData = configLoader.createPresetData({
        workingDir: Constants.defaultWorkingDir,
        password: password,
        oldPresetData,
      });
    } catch (e) {
      throw new Error(
        t('messages.updateVotingKeys.error.presetCannotBeLoaded', Utils.getMessage(e)),
      );
    }
    const addresses = configLoader.loadExistingAddresses(target, password);
    const privateKeySecurityMode = CryptoUtils.getPrivateKeySecurityMode(
      presetData.privateKeySecurityMode,
    );

    const finalizationEpoch =
      flags.finalizationEpoch ||
      (await new RemoteNodeService(logger, presetData, false).resolveCurrentFinalizationEpoch());

    const votingKeyUpgrade = (
      await Promise.all(
        (presetData.nodes || []).map((nodePreset, index) => {
          const nodeAccount = addresses.nodes?.[index];
          if (!nodeAccount) {
            throw new Error(t('messages.updateVotingKeys.error.nodeNotFound', { index }));
          }
          return new VotingService(logger, {
            target,
            user: flags.user,
          }).run(presetData, nodeAccount, nodePreset, finalizationEpoch, true, false);
        }),
      )
    ).find((f) => f);
    if (votingKeyUpgrade) {
      await YamlUtils.writeYaml(
        addressesLocation,
        CryptoUtils.removePrivateKeysAccordingToSecurityMode(addresses, privateKeySecurityMode),
        undefined,
      );
      logger.warn(t('messages.updateVotingKeys.info.created'));
      logger.warn('');
    } else {
      logger.info('');
      logger.info(t('messages.updateVotingKeys.info.upToDate'));
      logger.info('');
    }
  }
}
