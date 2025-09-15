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
import { existsSync } from 'fs';
import { t } from 'i18next';
import { dirname } from 'path';
import { LoggerFactory, LogType } from '../../logger/index.js';
import {
  CommandUtils,
  CryptoUtils,
  FileSystemService,
  KnownError,
  YamlUtils,
} from '../../service/index.js';

export default class Encrypt extends Command {
  static description = 'commands.encrypt.description';

  static examples = [
    `
$ symbol-bootstrap encrypt --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
> password prompt
$ symbol-bootstrap start --preset testnet --assembly dual --customPreset encrypted-custom-preset.yml
> password prompt (enter the same password)
        `,
    `
$ symbol-bootstrap encrypt --password 1234 --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
$ symbol-bootstrap start --password 1234 --preset testnet --assembly dual --customPreset encrypted-custom-preset.yml
`,
    `
 $ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap encrypt --source plain-custom-preset.yml --destination encrypted-custom-preset.yml
 `,
  ];

  static flags = {
    help: CommandUtils.helpFlag,
    source: Flags.string({
      char: 's',
      description: 'flags.encrypt.source.description',
      required: true,
    }),
    destination: Flags.string({
      char: 'd',
      description: 'flags.encrypt.destination.description',
      required: true,
    }),
    password: CommandUtils.getPasswordFlag('flags.encrypt.password.description'),
    logger: CommandUtils.getLoggerFlag(LogType.Console),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Encrypt);

    if (!existsSync(flags.source)) {
      throw new KnownError(t('messages.encrypt.error.sourceNotExist', { file: flags.source }));
    }
    if (existsSync(flags.destination)) {
      throw new KnownError(
        t('messages.encrypt.error.destinationExists', { file: flags.destination }),
      );
    }
    const logger = LoggerFactory.getLogger(flags.logger);
    const password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      false,
      t('messages.encrypt.prompt.password'),
      false,
    );
    const data = await YamlUtils.loadYaml(flags.source, false);
    if (CryptoUtils.encryptedCount(data) > 0) {
      throw new KnownError(t('messages.encrypt.info.encryptExists', { file: flags.source }));
    }
    await new FileSystemService(logger).mkdir(dirname(flags.destination));
    await YamlUtils.writeYaml(flags.destination, data, password);
    logger.info(t('messages.encrypt.info.encrypted', { file: flags.destination }));
  }
}
