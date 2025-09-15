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
import { BootstrapService, CommandUtils, RunService } from '../../service/index.js';
import HealthCheck from '../healthCheck/index.js';

export default class Run extends Command {
  static description = 'commands.run.description';

  static examples = [`$ symbol-bootstrap run`];

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    detached: Flags.boolean({
      char: 'd',
      description: 'flags.run.detached.description',
    }),
    healthCheck: Flags.boolean({
      description: HealthCheck.description,
    }),
    resetData: Flags.boolean({
      description: 'flags.run.resetData.description',
    }),
    pullImages: Flags.boolean({
      description: 'flags.run.pullImages.description',
      default: RunService.defaultParams.pullImages,
    }),
    args: Flags.string({
      multiple: true,
      description: 'flags.run.args.description',
    }),
    build: Flags.boolean({
      char: 'b',
      description: 'flags.run.build.description',
    }),
    timeout: Flags.integer({
      description: 'flags.run.timeout.description',
      default: RunService.defaultParams.timeout,
    }),
    logger: CommandUtils.getLoggerFlag(...System),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Run);
    const logger = LoggerFactory.getLogger(flags.logger);
    return new BootstrapService(logger).run(flags);
  }
}
