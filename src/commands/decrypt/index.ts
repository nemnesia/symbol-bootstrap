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
import { CommandUtils, FileSystemService, KnownError, YamlUtils } from '../../service/index.js';

export default class Decrypt extends Command {
  static description = 'commands.decrypt.description';

  static examples = [
    `
$ symbol-bootstrap start --password 1234 --preset testnet --assembly dual --customPreset decrypted-custom-preset.yml --detached
$ symbol-bootstrap decrypt --password 1234 --source target/addresses.yml --destination plain-addresses.yml
$ symbol-bootstrap decrypt --password 1234 --source encrypted-custom-preset.yml --destination plain-custom-preset.yml
$ cat plain-addresses.yml
$ cat plain-custom-preset.yml
$ rm plain-addresses.yml
$ rm plain-custom-preset.yml
        `,
    `
$ symbol-bootstrap start --preset testnet --assembly dual --customPreset decrypted-custom-preset.yml --detached
> password prompt
$ symbol-bootstrap decrypt --source target/addresses.yml --destination plain-addresses.yml
> password prompt (enter the same password)
$ symbol-bootstrap decrypt --source encrypted-custom-preset.yml --destination plain-custom-preset.yml
> password prompt (enter the same password)
$ cat plain-addresses.yml
$ cat plain-custom-preset.yml
$ rm plain-addresses.yml
$ rm plain-custom-preset.yml`,
    `
$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap decrypt --source target/addresses.yml --destination plain-addresses.yml
`,
  ];

  static flags = {
    help: CommandUtils.helpFlag,
    source: Flags.string({
      char: 's',
      description: 'flags.decrypt.source.description',
      required: true,
    }),
    destination: Flags.string({
      char: 'd',
      description: 'flags.decrypt.destination.description',
      required: true,
    }),
    password: CommandUtils.getPasswordFlag('flags.decrypt.password.description'),
    logger: CommandUtils.getLoggerFlag(LogType.Console),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Decrypt);

    if (!existsSync(flags.source)) {
      throw new KnownError(t('messages.decrypt.error.sourceNotExist', { file: flags.source }));
    }
    if (existsSync(flags.destination)) {
      throw new KnownError(
        t('messages.decrypt.error.destinationExists', { file: flags.destination }),
      );
    }
    const logger = LoggerFactory.getLogger(flags.logger);
    const password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      false,
      t('messages.decrypt.prompt.password'),
      false,
    );
    const data = await YamlUtils.loadYaml(flags.source, password);
    await new FileSystemService(logger).mkdir(dirname(flags.destination));
    await YamlUtils.writeYaml(flags.destination, data, '');
    logger.info(t('messages.decrypt.info.decrypted', { file: flags.destination }));
  }
}
