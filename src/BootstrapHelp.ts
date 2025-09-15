import { Command, Help } from '@oclif/core';
import { t } from 'i18next';
import { CommandUtils } from './service/index.js';

export default class BootstrapHelp extends Help {
  /**
   * ルートヘルプ（全体の説明）をフォーマット
   * @returns 全体のヘルプのルート説明文
   */
  protected formatRoot(): string {
    let originalRoot = super.formatRoot();
    const appDesc = t('app.description');
    if (appDesc !== 'app.description') {
      const lines = originalRoot.split('\n');
      if (1 < lines.length) {
        lines.shift();
        originalRoot = lines.join('\n');
      }
      CommandUtils.showBanner();
      return '\n' + appDesc + '\n' + originalRoot;
    }
    return originalRoot;
  }

  /**
   * コマンドヘルプフォーマット
   * @param cmd コマンド情報
   * @returns コマンドヘルプ
   */
  protected formatCommand(cmd: Command.Loadable): string {
    // descriptionに翻訳を適用
    if (cmd.description) {
      const translatedDesc = t(cmd.description);
      if (translatedDesc !== cmd.description) {
        cmd.description = translatedDesc.replace(/\\n/g, '\n');
      }
    }

    // flagの説明文を翻訳
    for (const [_key, flag] of Object.entries(cmd.flags)) {
      if (flag.description) {
        const descriptions = flag.description?.split('|||');
        if (descriptions?.length === 2) {
          const param = JSON.parse(descriptions[1]);
          const translatedFlagDesc = t(descriptions[0], param);
          if (translatedFlagDesc !== descriptions[0]) {
            flag.description = translatedFlagDesc.toString();
          }
        } else {
          const translatedFlagDesc = t(flag.description);
          if (translatedFlagDesc !== flag.description) {
            flag.description = translatedFlagDesc;
          }
        }
      }
    }

    return super.formatCommand(cmd);
  }

  /**
   * コマンドの要約取得
   *
   * 各コマンドの最初の行
   *
   * @param c コマンド情報
   * @returns コマンドの要約
   */
  protected summary(c: Command.Loadable): string {
    if (c.description) {
      const translatedDesc = t(c.description);
      if (translatedDesc !== c.description) {
        return '\n' + translatedDesc.replace(/\\n.*$/s, '').trim();
      }
    }
    return super.summary(c) || c.description || '';
  }
}
