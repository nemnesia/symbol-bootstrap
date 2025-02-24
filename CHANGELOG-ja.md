# 変更履歴

このプロジェクトのすべての重要な変更はこのファイルに記録されます。

変更履歴の形式は[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)に基づいています。

## [2.0.0] - 2025-02-24

**マイルストーン**: メインネット(1.0.3.7)

| パッケージ       | バージョン | リンク                                                            |
| ---------------- | ---------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v2.0.0     | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

- crypto-js を v4.2 に変更(**旧バージョンとキー暗号化互換性なし**)
- docker compose v2 を使用する
- oclif を v1 から v4 に変更
- 上記に伴うコード全体の ESM 化

## [1.1.13] - 2025-02-15

**マイルストーン**: メインネット(1.0.3.7)

| パッケージ       | バージョン | リンク                                                            |
| ---------------- | ---------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v1.1.13    | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

以下のパッケージを更新：

- カスタムプリセットでピアのリスニングポートを変更可能に

### エクスプローラー設定の例

```yaml
explorers:
  - excludeDockerService: false
```

### ピアのリスニングポートを変更する例

```yaml
nodePort: 7950
apiNodePort: 7950
nodes:
  - openPort: 7950
```

## [1.1.12] - 2025-02-15

**マイルストーン**: メインネット(1.0.3.7)

| パッケージ       | バージョン | リンク                                                            |
| ---------------- | ---------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v1.1.12    | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

以下のパッケージを更新：

- Rest での Metal デコードのサポート
- config-node.properties のいくつかの項目のデフォルト値を変更
  - maxChainBytesPerSyncAttempt: 50MB
  - blockDisruptorMaxMemorySize: 1000MB
- config-finalization.properties のいくつかの項目のデフォルト値を変更
  - messageSynchronizationMaxResponseSize: 5MB
