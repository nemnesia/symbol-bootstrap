# CHANGELOG

All notable changes to this project will be documented in this file.

The changelog format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.2] - 2025-03-06

**Milestone**: Mainnet(1.0.3.8)

| Package          | Version | Link                                                              |
| ---------------- | ------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v2.0.2  | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

- Fixed missing support for Docker Compose projects when the assembly is Peer

## [2.0.1] - 2025-02-27

**Milestone**: Mainnet(1.0.3.8)

| Package          | Version | Link                                                              |
| ---------------- | ------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v2.0.1  | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

- [Catapult Client v1.0.3.8](https://github.com/symbol/symbol/releases/tag/client%2Fcatapult%2Fv1.0.3.8)
- [Rest 2.5.0](https://github.com/symbol/symbol/releases/tag/rest%2Fv2.5.0)
- MongoDB 7.0.17
- Support for Docker Compose projects

## [2.0.0] - 2025-02-24

**Milestone**: Mainnet(1.0.3.7)

| Package          | Version | Link                                                              |
| ---------------- | ------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v2.0.0  | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

- Changed crypto-js to v4.2 (**incompatible with key encryption of the old version**)
- Use docker compose v2
- Changed oclif from v1 to v4
- Converted the entire codebase to ESM accordingly

## [1.1.13] - 2025-02-15

**Milestone**: Mainnet(1.0.3.7)

| Package          | Version | Link                                                              |
| ---------------- | ------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v1.1.13 | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

Update the following packages:

- Fork
- Custom preset allows changing the listening port for Peer

### Explorer Configuration Example

```yaml
explorers:
  - excludeDockerService: false
```

### Example of Changing the Listening Port for Peer

```yaml
nodePort: 7950
apiNodePort: 7950
nodes:
  - openPort: 7950
```

## [1.1.12] - 2025-02-15

**Milestone**: Mainnet(1.0.3.7)

| Package          | Version | Link                                                              |
| ---------------- | ------- | ----------------------------------------------------------------- |
| Symbol Bootstrap | v1.1.12 | [symbol-bootstrap](https://github.com/nemneshia/symbol-bootstrap) |

Update the following packages:

- Support for Metal decoding in Rest
- Changed default values for some items in config-node.properties
  - maxChainBytesPerSyncAttempt: 50MB
  - blockDisruptorMaxMemorySize: 1000MB
- Changed default values for some items in config-finalization.properties
  - messageSynchronizationMaxResponseSize: 5MB
