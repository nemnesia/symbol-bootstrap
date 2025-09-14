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
import { createDecipheriv, pbkdf2Sync } from 'crypto';
import _ from 'lodash';
import { Crypto } from 'symbol-sdk';
import { PrivateKeySecurityMode } from '../model/index.js';
import { KnownError } from './KnownError.js';

export class CryptoUtils {
  private static readonly ENCRYPT_PREFIX = 'ENCRYPTED:';
  private static readonly ENCRYPTABLE_KEYS = ['privateKey', 'restSSLKeyBase64', 'privateFileContent'];

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static encrypt(value: any, password: string, fieldName?: string): any {
    if (!value) {
      return value;
    }
    if (_.isArray(value)) {
      return value.map((v) => this.encrypt(v, password));
    }

    if (_.isObject(value)) {
      return _.mapValues(value, (value: any, name: string) => CryptoUtils.encrypt(value, password, name));
    }

    if (this.isEncryptableKeyField(value, fieldName)) {
      return CryptoUtils.ENCRYPT_PREFIX + Crypto.encrypt(value, password);
    }
    return value;
  }

  public static getPrivateKeySecurityMode(value: string | undefined): PrivateKeySecurityMode {
    if (!value) {
      return PrivateKeySecurityMode.ENCRYPT;
    }
    const securityModes = Object.values(PrivateKeySecurityMode) as PrivateKeySecurityMode[];
    const securityMode = securityModes.find((p) => p.toLowerCase() == value.toLowerCase());
    if (securityMode) {
      return securityMode;
    }
    throw new KnownError(`${value} is not a valid Security Mode. Please use one of ${securityModes.join(', ')}`);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static removePrivateKeysAccordingToSecurityMode(value: any, securityMode: PrivateKeySecurityMode): any {
    if (securityMode === PrivateKeySecurityMode.PROMPT_MAIN) {
      return this.removePrivateKeys(value, ['main', 'voting']);
    }
    if (securityMode === PrivateKeySecurityMode.PROMPT_MAIN_TRANSPORT) {
      return this.removePrivateKeys(value, ['main', 'transport', 'voting']);
    }
    if (securityMode === PrivateKeySecurityMode.PROMPT_ALL) {
      return this.removePrivateKeys(value);
    }
    return this.removePrivateKeys(value, ['voting']);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static removePrivateKeys(value: any, blacklistNames: string[] = []): any {
    if (!value) {
      return value;
    }
    if (_.isArray(value)) {
      return value.map((v) => this.removePrivateKeys(v, blacklistNames));
    }

    if (_.isObject(value)) {
      return _.mapValues(
        _.pickBy(value, (value: any, name: string) => {
          const isBlacklisted =
            !blacklistNames.length || blacklistNames.find((blacklistName) => name.toLowerCase().indexOf(blacklistName.toLowerCase()) > -1);
          return !isBlacklisted || !this.isEncryptableKeyField(value, name);
        }),
        (value: any, name: string) => {
          const isBlacklisted =
            !blacklistNames.length || blacklistNames.find((blacklistName) => name.toLowerCase().indexOf(blacklistName.toLowerCase()) > -1);
          return CryptoUtils.removePrivateKeys(value, isBlacklisted ? [] : blacklistNames);
        },
      );
    }
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static decrypt(value: any, password: string, fieldName?: string): any {
    if (!value) {
      return value;
    }
    if (_.isArray(value)) {
      return value.map((v) => this.decrypt(v, password));
    }

    if (_.isObject(value)) {
      return _.mapValues(value, (value: any, name: string) => CryptoUtils.decrypt(value, password, name));
    }
    if (this.isEncryptableKeyField(value, fieldName) && value.startsWith(CryptoUtils.ENCRYPT_PREFIX)) {
      const encryptedValue = value.substring(CryptoUtils.ENCRYPT_PREFIX.length);
      // 1) Try current symbol-sdk decryption first (crypto-js >= 4.2.0 compatible)
      let decryptedValue: string | undefined;
      try {
        decryptedValue = Crypto.decrypt(encryptedValue, password);
      } catch (e) {
        decryptedValue = undefined;
      }
      // 2) Fallback to legacy decryption (crypto-js 4.1.1 equivalent: PBKDF2-SHA1 + AES-256-CBC)
      if (!decryptedValue) {
        try {
          decryptedValue = CryptoUtils.decryptLegacy(encryptedValue, password);
          CryptoUtils._legacyUpgradeDetected = true;
        } catch (e) {
          throw Error('Value could not be decrypted!');
        }
      }
      if (!decryptedValue) {
        throw Error('Value could not be decrypted!');
      }
      return decryptedValue;
    }
    return value;
  }

  /**
   * Decrypts data and returns both the decrypted result and information about whether legacy encryption was upgraded.
   * This method provides visibility into whether the data should be re-saved with stronger encryption.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static decryptWithUpgradeInfo(value: any, password: string, fieldName?: string): { data: any; hasLegacyUpgrade: boolean } {
    CryptoUtils._legacyUpgradeDetected = false;
    const data = this.decrypt(value, password, fieldName);
    return { data, hasLegacyUpgrade: CryptoUtils._legacyUpgradeDetected };
  }

  private static _legacyUpgradeDetected = false;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static encryptedCount(value: any, fieldName?: string): number {
    if (!value) {
      return 0;
    }
    if (_.isArray(value)) {
      return _.sum(value.map((v) => this.encryptedCount(v)));
    }

    if (_.isObject(value)) {
      return _.sum(Object.entries(value).map(([fieldName, value]) => this.encryptedCount(value, fieldName)));
    }
    if (this.isEncryptableKeyField(value, fieldName) && value.startsWith(CryptoUtils.ENCRYPT_PREFIX)) {
      return 1;
    }
    return 0;
  }

  private static isEncryptableKeyField(value: any, fieldName: string | undefined) {
    return (
      _.isString(value) && fieldName && CryptoUtils.ENCRYPTABLE_KEYS.some((key) => fieldName.toLowerCase().endsWith(key.toLowerCase()))
    );
  }

  /**
   * Legacy decryption logic equivalent to crypto-js 4.1.1 (PBKDF2-SHA1, iterations=1024, keySize=32, AES-256-CBC, PKCS7)
   * Input format: `salt(16 bytes hex)` + `iv(16 bytes hex)` + `ciphertext(base64)`
   */
  private static decryptLegacy(data: string, password: string): string {
    if (!data || data.length < 64) {
      throw new Error('Invalid encrypted payload');
    }
    const saltHex = data.substring(0, 32);
    const ivHex = data.substring(32, 64);
    const ciphertextBase64 = data.substring(64);

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const key = pbkdf2Sync(Buffer.from(password, 'utf8'), salt, 1024, 32, 'sha1');

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
