[root](../../../CLAUDE.md) > [api](../../) > [system](../) > **config**

# Config API

## Responsibility

System configuration parameter CRUD and cache management.

## Entry Point

`src/api/system/config/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getConfigKey` | GET | `/system/config/configKey/{configKey}` | Get config value by key |
| `listConfig` | GET | `/system/config/list` | Query config list |
| `getConfig` | GET | `/system/config/{configId}` | Get config detail |
| `addConfig` | POST | `/system/config` | Create config |
| `updateConfig` | PUT | `/system/config` | Update config |
| `delConfig` | DELETE | `/system/config/{ids}` | Delete configs |
| `refreshCache` | DELETE | `/system/config/refreshCache` | Refresh config cache |
| `exportConfig` | POST | `/system/config/export` | Export configs |

## Changelog

- 2026-06-04: Initial module documentation generated
