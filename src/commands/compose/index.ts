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
import { LoggerFactory, System } from '../../logger/index.js';
import {
  BootstrapService,
  CommandUtils,
  ComposeService,
  Constants,
  keyWithOptions,
} from '../../service/index.js';

export default class Compose extends Command {
  static description = 'commands.compose.description';

  static examples = [`$ symbol-bootstrap compose`];

  static userFlag() {
    const param = { currentUser: Constants.CURRENT_USER };
    return Flags.string({
      char: 'u',
      description: keyWithOptions('flags.compose.user.description', param),
      default: Constants.CURRENT_USER,
    });
  }

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    password: CommandUtils.passwordFlag,
    noPassword: CommandUtils.noPasswordFlag,
    upgrade: Flags.boolean({
      description: 'flags.compose.upgrade.description',
      default: ComposeService.defaultParams.upgrade,
    }),
    offline: CommandUtils.offlineFlag,
    user: this.userFlag(),
    logger: CommandUtils.getLoggerFlag(...System),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Compose);

    const logger = LoggerFactory.getLogger(flags.logger);
    flags.password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      flags.noPassword,
      CommandUtils.passwordPromptDefaultMessage,
      true,
    );
    const workingDir = Constants.defaultWorkingDir;
    await new BootstrapService(logger).compose({ ...flags, workingDir });
  }
}
