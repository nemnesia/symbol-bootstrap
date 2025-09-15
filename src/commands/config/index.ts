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
  Assembly,
  BootstrapAccountResolver,
  BootstrapService,
  CommandUtils,
  ConfigService,
  Constants,
  keyWithOptions,
  Preset,
} from '../../service/index.js';

export default class Config extends Command {
  static description = 'commands.config.description';

  static examples = [
    `$ symbol-bootstrap config -p bootstrap`,
    `$ symbol-bootstrap config -p testnet -a dual --password 1234`,
    `$ symbol-bootstrap config -p mainnet -a peer -c custom-preset.yml`,
    `$ symbol-bootstrap config -p mainnet -a my-custom-assembly.yml -c custom-preset.yml`,
    `$ symbol-bootstrap config -p my-custom-network.yml -a dual -c custom-preset.yml`,
    `$ echo "$MY_ENV_VAR_PASSWORD" | symbol-bootstrap config -p testnet -a dual`,
  ];

  static getPresetFlag() {
    const param = { preset: Object.keys(Preset).join(', ') };
    return Flags.string({
      char: 'p',
      description: keyWithOptions('flags.config.preset.description', param),
    });
  }
  static getAssemblyFlag() {
    const param = { assembly: Object.keys(Assembly).join(', ') };
    return Flags.string({
      char: 'a',
      description: keyWithOptions('flags.config.assembly.description', param),
    });
  }
  static getUserFlag() {
    const param = { currentUser: Constants.CURRENT_USER };
    return Flags.string({
      char: 'u',
      description: keyWithOptions('flags.config.user.description', param),
      default: Constants.CURRENT_USER,
    });
  }

  static flags = {
    help: CommandUtils.helpFlag,
    target: CommandUtils.targetFlag,
    password: CommandUtils.passwordFlag,
    noPassword: CommandUtils.noPasswordFlag,
    preset: this.getPresetFlag(),
    assembly: this.getAssemblyFlag(),
    customPreset: Flags.string({
      char: 'c',
      description: 'flags.config.customPreset.description',
    }),
    reset: Flags.boolean({
      char: 'r',
      description: 'flags.config.reset.description',
      default: ConfigService.defaultParams.reset,
    }),
    upgrade: Flags.boolean({
      char: 'u',
      description: 'flags.config.upgrade.description',
      default: ConfigService.defaultParams.upgrade,
    }),
    offline: CommandUtils.offlineFlag,
    report: Flags.boolean({
      description: 'flags.config.report.description',
      default: ConfigService.defaultParams.report,
    }),
    user: this.getUserFlag(),
    logger: CommandUtils.getLoggerFlag(...System),
  };

  public async run(): Promise<void> {
    CommandUtils.showBanner();
    const { flags } = await this.parse(Config);
    const logger = LoggerFactory.getLogger(flags.logger);
    flags.password = await CommandUtils.resolvePassword(
      logger,
      flags.password,
      flags.noPassword,
      CommandUtils.passwordPromptDefaultMessage,
      true,
    );
    const workingDir = Constants.defaultWorkingDir;
    const accountResolver = new BootstrapAccountResolver(logger);
    await new BootstrapService(logger).config({ ...flags, workingDir, accountResolver });
  }
}
