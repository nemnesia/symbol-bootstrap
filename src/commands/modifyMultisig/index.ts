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
import { LoggerFactory, LogType } from '../../logger/index.js';
import { AnnounceService, BootstrapService, CommandUtils } from '../../service/index.js';

export default class ModifyMultisig extends Command {
  static description = 'commands.modifyMultisig.description';

  static examples = [
    `$ symbol-bootstrap modifyMultisig`,
    `$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap modifyMultisig --useKnownRestGateways`,
  ];

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    minRemovalDelta: Flags.integer({
      description: 'flags.modifyMultisig.minRemovalDelta.description',
      char: 'r',
    }),
    minApprovalDelta: Flags.integer({
      description: 'flags.modifyMultisig.minApprovalDelta.description',
      char: 'a',
    }),
    addressAdditions: Flags.string({
      description: 'flags.modifyMultisig.addressAdditions.description',
      char: 'A',
    }),
    addressDeletions: Flags.string({
      description: 'flags.modifyMultisig.addressDeletions.description',
      char: 'D',
    }),
    ...AnnounceService.flags,
    logger: CommandUtils.getLoggerFlag(LogType.Console),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(ModifyMultisig);
    const logger = LoggerFactory.getLogger(flags.logger);
    flags.password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      flags.noPassword,
      CommandUtils.passwordPromptDefaultMessage,
      true,
    );
    return new BootstrapService(logger).modifyMultisig(flags);
  }
}
