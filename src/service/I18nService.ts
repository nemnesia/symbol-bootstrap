/*
 * Copyright 2025 ccHarvestasya
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

import { readFileSync } from 'fs';
import i18next from 'i18next';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class I18nService {
  private static instance: I18nService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public async init(language?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 環境変数から言語を取得
    const envLang =
      language || process.env.SYMBOL_LANG || process.env.LANG?.split('.')[0]?.split('_')[0] || 'en';

    const localesDir = join(__dirname, '../../locales');

    try {
      const enTranslation = JSON.parse(
        readFileSync(join(localesDir, 'en/translation.json'), 'utf8'),
      );
      const jaTranslation = JSON.parse(
        readFileSync(join(localesDir, 'ja/translation.json'), 'utf8'),
      );

      await i18next.init({
        lng: envLang,
        fallbackLng: 'en',
        resources: {
          en: { translation: enTranslation },
          ja: { translation: jaTranslation },
        },
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize i18n, falling back to English:', error);
      // Fallback initialization with minimal English content
      await i18next.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: { translation: {} },
        },
      });
      this.initialized = true;
    }
  }

  public t(key: string, options?: any): string {
    if (!this.initialized) {
      console.warn('i18n not initialized, returning key:', key);
      return key;
    }
    return i18next.t(key, options) as string;
  }

  public changeLanguage(language: string): Promise<any> {
    return i18next.changeLanguage(language);
  }
}

export const i18n = I18nService.getInstance();

// Helper function for shorter usage
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

export const keyWithOptions = (key: string, options: any): string =>
  `${key}|||${JSON.stringify(options)}`;
