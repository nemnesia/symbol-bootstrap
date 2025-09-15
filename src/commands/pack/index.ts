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

import { confirm } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import { existsSync } from 'fs';
import { t } from 'i18next';
import { dirname, join } from 'path';
import { LoggerFactory, LogType } from '../../logger/index.js';
import {
  BootstrapAccountResolver,
  BootstrapService,
  CommandUtils,
  Constants,
  CryptoUtils,
  FileSystemService,
  YamlUtils,
  ZipItem,
  ZipUtils,
} from '../../service/index.js';
import Clean from '../clean/index.js';
import Compose from '../compose/index.js';
import Config from '../config/index.js';

export default class Pack extends Command {
  static description = 'commands.pack.description';

  static examples = [
    `$ symbol-bootstrap pack`,
    `$ symbol-bootstrap pack -c custom-preset.yml`,
    `$ symbol-bootstrap pack -p testnet -a dual -c custom-preset.yml`,
    `$ symbol-bootstrap pack -p mainnet -a dual --password 1234 -c custom-preset.yml`,
    `$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap pack -c custom-preset.yml`,
  ];

  static flags = {
    ...Compose.flags,
    ...Clean.flags,
    ...Config.flags,
    ready: Flags.boolean({
      description: 'flags.pack.ready.description',
    }),
    logger: CommandUtils.getLoggerFlag(LogType.Console),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Pack);
    const logger = LoggerFactory.getLogger(flags.logger);
    const targetZip = join(dirname(flags.target), `symbol-node.zip`);

    if (existsSync(targetZip)) {
      throw new Error(t('messages.pack.error.targetZipExists', { file: targetZip }));
    }
    logger.info('');
    logger.info('');
    if (
      (!flags.ready || flags.offline) &&
      !(await confirm({
        message: t('messages.pack.warning.offlineRecommended'),
        default: true,
      }))
    ) {
      logger.info(t('messages.pack.info.comeBackOffline'));
      return;
    }

    flags.password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      flags.noPassword,
      CommandUtils.passwordPromptDefaultMessage,
      true,
    );
    const workingDir = Constants.defaultWorkingDir;
    const service = new BootstrapService(logger);
    const configOnlyCustomPresetFileName = 'config-only-custom-preset.yml';
    const accountResolver = new BootstrapAccountResolver(logger);
    const configResult = await service.config({ ...flags, workingDir, accountResolver });
    await service.compose({ ...flags, workingDir }, configResult.presetData);

    const noPrivateKeyTempFile = 'custom-preset-temp.temp';

    if (flags.customPreset) {
      await YamlUtils.writeYaml(
        noPrivateKeyTempFile,
        CryptoUtils.removePrivateKeys(YamlUtils.loadYaml(flags.customPreset, flags.password)),
        flags.password,
      );
    } else {
      await YamlUtils.writeYaml(noPrivateKeyTempFile, {}, flags.password);
    }
    const zipItems: ZipItem[] = [
      {
        from: flags.target,
        to: 'target',
        directory: true,
      },
      {
        from: noPrivateKeyTempFile,
        to: configOnlyCustomPresetFileName,
        directory: false,
      },
    ];

    await new ZipUtils(logger).zip(targetZip, zipItems);
    new FileSystemService(logger).deleteFile(noPrivateKeyTempFile);
    logger.info('');
    logger.info(t('messages.pack.info.zipCreated', { file: targetZip }));
    logger.info(`$ symbol-bootstrap start`);
  }
}
