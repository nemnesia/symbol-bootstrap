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
import { Account } from 'symbol-sdk';
import { LoggerFactory, System } from '../../logger/index.js';
import { CertificatePair, ConfigAccount } from '../../model/index.js';
import {
  BootstrapAccountResolver,
  CertificateService,
  CommandUtils,
  ConfigLoader,
  Constants,
  keyWithOptions,
  RenewMode,
} from '../../service/index.js';

export default class RenewCertificates extends Command {
  static description = 'commands.renewCertificates.description';

  static examples = [`$ symbol-bootstrap renewCertificates`];

  static userFlag() {
    const param = { currentUser: Constants.CURRENT_USER };
    return Flags.string({
      char: 'u',
      description: keyWithOptions('flags.renewCertificates.user.description', param),
      default: Constants.CURRENT_USER,
    });
  }

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    password: CommandUtils.passwordFlag,
    noPassword: CommandUtils.noPasswordFlag,
    customPreset: Flags.string({
      char: 'c',
      description: 'flags.renewCertificates.customPreset.description',
    }),
    user: this.userFlag(),
    force: Flags.boolean({
      description: 'flags.renewCertificates.force.description',
    }),
    logger: CommandUtils.getLoggerFlag(...System),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(RenewCertificates);
    const logger = LoggerFactory.getLogger(flags.logger);
    const password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      flags.noPassword,
      CommandUtils.passwordPromptDefaultMessage,
      true,
    );
    const target = flags.target;
    const configLoader = new ConfigLoader(logger);

    const oldPresetData = configLoader.loadExistingPresetData(target, password);
    const presetData = configLoader.createPresetData({
      workingDir: Constants.defaultWorkingDir,
      customPreset: flags.customPreset,
      password: password,
      oldPresetData,
    });
    const addresses = configLoader.loadExistingAddresses(target, password);
    const networkType = presetData.networkType;
    const accountResolver = new BootstrapAccountResolver(logger);
    const certificateService = new CertificateService(logger, accountResolver, {
      target,
      user: flags.user,
    });
    const certificateUpgraded = (
      await Promise.all(
        (presetData.nodes || []).map((nodePreset, index) => {
          const nodeAccount = addresses.nodes?.[index];
          if (!nodeAccount) {
            throw new Error(t('messages.renewCertificates.error.nodeNotFound', { index }));
          }
          function resolveAccount(
            configAccount: ConfigAccount,
            providedPrivateKey: string | undefined,
          ): CertificatePair {
            if (providedPrivateKey) {
              const account = Account.createFromPrivateKey(providedPrivateKey, networkType);
              if (account.address.plain() == configAccount.address) {
                return account;
              }
            }
            return configAccount;
          }
          const providedCertificates = {
            main: resolveAccount(nodeAccount.main, nodePreset.mainPrivateKey),
            transport: resolveAccount(nodeAccount.transport, nodePreset.transportPrivateKey),
          };
          // Docker Compose プロジェクト名のプレフィックスを追加
          const containerNamePrefix = presetData.dockerComposeProjectName
            ? `${presetData.dockerComposeProjectName}-`
            : '';
          return certificateService.run(
            presetData,
            containerNamePrefix + nodePreset.name,
            providedCertificates,
            flags.force ? RenewMode.ALWAYS : RenewMode.WHEN_REQUIRED,
          );
        }),
      )
    ).find((f) => f);
    if (certificateUpgraded) {
      logger.warn('');
      logger.warn(t('messages.renewCertificates.info.created'));
      logger.warn('');
    } else {
      logger.info('');
      logger.info(t('messages.renewCertificates.info.upToDate'));
      logger.info('');
    }
  }
}
