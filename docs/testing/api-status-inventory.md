# What every API operation actually answers

Observed, not declared. Produced by
`packages/api-conformance/tests/inventory.itest.ts` against a running local
stack at `http://[::1]:8080`, covering all 55 operations in
`packages/client/schema.json`.

This exists because the backend cannot write accurate error declarations from
its handler source alone: many of the statuses a caller meets come from the web
framework's extractors, which fire before any handler runs. The obvious example
is that **34 of 40 POST operations answer `415`, not `400`, to a request with no
body** — a status no reading of the handlers would predict.

## How the probes stay harmless

Every request is shaped to die before a handler could reach the chain. GETs are
read-only and use well-formed path parameters that name nothing. POSTs are
probed twice — with no body, and with `{}` — and both are rejected by the
content-type extractor, the JSON extractor, or field validation. Nothing is
prepared, nothing is signed, no REV is spent. Probes are serial and spaced, so
the sweep is gentler than one page load.

## What it showed

| Status | Probes | What it means                                                                                         |
| ------ | ------ | ----------------------------------------------------------------------------------------------------- |
| 415    | 34     | A POST with no body: the content-type extractor fires first.                                          |
| 400    | 35     | A `{}` body: field validation, `content-type: text/plain`, message per operation.                     |
| 404    | 9      | Absent record. **No body and no `content-type` header at all.**                                       |
| 200    | 14     | Lists answer empty; three prepare-delete operations and `testnet_create_wallet` take no request body. |
| 500    | 3      | Two operations mapping a 404 semantic onto a 500. Reported upstream.                                  |

Two facts worth carrying into any declaration written from this: **extractor
errors are `text/plain`** while handler errors are JSON `{description}`, so the
4xx body shape is not the API's error model; and `wallets_subscribe_deploys`
answers `400 text/plain` to a plain HTTP GET because it is a WebSocket upgrade.

The three `500`s are `agents_teams_published_state` for an absent team — whose
body is a **78 KB Rust backtrace carrying absolute host paths** — and
`agents_teams_unpublish` for both probes, which answers 21 plain bytes with no
`content-type`. In each the error text is literally `agents team not found`, so
the semantic is 404 and only the mapping is wrong. Both are reported upstream
and pinned in the sweep's assertion, so a 5xx from any _other_ operation still
fails it.

## The full inventory

| operation                                 | method | probe         | status | body shape                                            |
| ----------------------------------------- | ------ | ------------- | ------ | ----------------------------------------------------- |
| `agents_get_version`                      | GET    | absent-record | 404    | `empty`                                               |
| `agents_list`                             | GET    | absent-record | 200    | `object{agents}`                                      |
| `agents_list_versions`                    | GET    | absent-record | 404    | `empty`                                               |
| `agents_prepare_create`                   | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_prepare_create`                   | POST   | empty-object  | 400    | `text(112)`                                           |
| `agents_prepare_delete`                   | POST   | no-body       | 200    | `object{contract}`                                    |
| `agents_prepare_delete`                   | POST   | empty-object  | 200    | `object{contract}`                                    |
| `agents_prepare_deploy`                   | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_prepare_deploy`                   | POST   | empty-object  | 400    | `text(76)`                                            |
| `agents_prepare_save`                     | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_prepare_save`                     | POST   | empty-object  | 400    | `text(112)`                                           |
| `agents_send_create`                      | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_send_create`                      | POST   | empty-object  | 400    | `text(167)`                                           |
| `agents_send_delete`                      | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_send_delete`                      | POST   | empty-object  | 400    | `text(118)`                                           |
| `agents_send_deploy`                      | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_send_deploy`                      | POST   | empty-object  | 400    | `text(173)`                                           |
| `agents_send_save`                        | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_send_save`                        | POST   | empty-object  | 400    | `text(165)`                                           |
| `agents_teams_get_run`                    | GET    | absent-record | 404    | `empty`                                               |
| `agents_teams_get_version`                | GET    | absent-record | 404    | `empty`                                               |
| `agents_teams_list`                       | GET    | absent-record | 200    | `object{agents_teams}`                                |
| `agents_teams_list_versions`              | GET    | absent-record | 404    | `empty`                                               |
| `agents_teams_prepare_create`             | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_create`             | POST   | empty-object  | 400    | `text(117)`                                           |
| `agents_teams_prepare_delete`             | POST   | no-body       | 200    | `object{contract}`                                    |
| `agents_teams_prepare_delete`             | POST   | empty-object  | 200    | `object{contract}`                                    |
| `agents_teams_prepare_deploy`             | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_deploy`             | POST   | empty-object  | 400    | `text(81)`                                            |
| `agents_teams_prepare_publish_to_firesky` | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_publish_to_firesky` | POST   | empty-object  | 400    | `text(117)`                                           |
| `agents_teams_prepare_reveal_output`      | POST   | no-body       | 404    | `empty`                                               |
| `agents_teams_prepare_reveal_output`      | POST   | empty-object  | 404    | `empty`                                               |
| `agents_teams_prepare_run`                | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_run`                | POST   | empty-object  | 400    | `text(104)`                                           |
| `agents_teams_prepare_run_command`        | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_run_command`        | POST   | empty-object  | 400    | `text(166)`                                           |
| `agents_teams_prepare_run_on_firesky`     | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_run_on_firesky`     | POST   | empty-object  | 400    | `text(104)`                                           |
| `agents_teams_prepare_save`               | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_prepare_save`               | POST   | empty-object  | 400    | `text(117)`                                           |
| `agents_teams_published_state`            | GET    | absent-record | 500    | `object{description}`                                 |
| `agents_teams_referencing_teams`          | GET    | absent-record | 200    | `array[0]`                                            |
| `agents_teams_send_create`                | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_create`                | POST   | empty-object  | 400    | `text(182)`                                           |
| `agents_teams_send_delete`                | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_delete`                | POST   | empty-object  | 400    | `text(118)`                                           |
| `agents_teams_send_deploy`                | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_deploy`                | POST   | empty-object  | 400    | `text(193)`                                           |
| `agents_teams_send_publish_to_firesky`    | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_publish_to_firesky`    | POST   | empty-object  | 400    | `text(182)`                                           |
| `agents_teams_send_reveal_output`         | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_reveal_output`         | POST   | empty-object  | 400    | `text(152)`                                           |
| `agents_teams_send_run`                   | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_run`                   | POST   | empty-object  | 400    | `text(143)`                                           |
| `agents_teams_send_run_command`           | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_run_command`           | POST   | empty-object  | 400    | `text(164)`                                           |
| `agents_teams_send_run_on_firesky`        | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_run_on_firesky`        | POST   | empty-object  | 400    | `text(156)`                                           |
| `agents_teams_send_save`                  | POST   | no-body       | 415    | `text(61)`                                            |
| `agents_teams_send_save`                  | POST   | empty-object  | 400    | `text(180)`                                           |
| `agents_teams_unpublish`                  | POST   | no-body       | 500    | `text(21)`                                            |
| `agents_teams_unpublish`                  | POST   | empty-object  | 500    | `text(21)`                                            |
| `oslfs_get_version`                       | GET    | absent-record | 404    | `empty`                                               |
| `oslfs_list`                              | GET    | absent-record | 200    | `object{oslfs}`                                       |
| `oslfs_list_versions`                     | GET    | absent-record | 404    | `empty`                                               |
| `oslfs_prepare_create`                    | POST   | no-body       | 415    | `text(61)`                                            |
| `oslfs_prepare_create`                    | POST   | empty-object  | 400    | `text(111)`                                           |
| `oslfs_prepare_delete`                    | POST   | no-body       | 200    | `object{contract}`                                    |
| `oslfs_prepare_delete`                    | POST   | empty-object  | 200    | `object{contract}`                                    |
| `oslfs_prepare_save`                      | POST   | no-body       | 415    | `text(61)`                                            |
| `oslfs_prepare_save`                      | POST   | empty-object  | 400    | `text(111)`                                           |
| `oslfs_send_create`                       | POST   | no-body       | 415    | `text(61)`                                            |
| `oslfs_send_create`                       | POST   | empty-object  | 400    | `text(164)`                                           |
| `oslfs_send_delete`                       | POST   | no-body       | 415    | `text(61)`                                            |
| `oslfs_send_delete`                       | POST   | empty-object  | 400    | `text(118)`                                           |
| `oslfs_send_save`                         | POST   | no-body       | 415    | `text(61)`                                            |
| `oslfs_send_save`                         | POST   | empty-object  | 400    | `text(162)`                                           |
| `service_ready`                           | GET    | absent-record | 200    | `empty`                                               |
| `testnet_create_wallet`                   | POST   | no-body       | 200    | `object{key}`                                         |
| `testnet_create_wallet`                   | POST   | empty-object  | 200    | `object{key}`                                         |
| `testnet_prepare_deploy`                  | POST   | no-body       | 415    | `text(61)`                                            |
| `testnet_prepare_deploy`                  | POST   | empty-object  | 400    | `text(111)`                                           |
| `testnet_send_deploy`                     | POST   | no-body       | 415    | `text(61)`                                            |
| `testnet_send_deploy`                     | POST   | empty-object  | 400    | `text(169)`                                           |
| `wallets_prepare_boost`                   | POST   | no-body       | 415    | `text(61)`                                            |
| `wallets_prepare_boost`                   | POST   | empty-object  | 400    | `text(152)`                                           |
| `wallets_prepare_transfer`                | POST   | no-body       | 415    | `text(61)`                                            |
| `wallets_prepare_transfer`                | POST   | empty-object  | 400    | `text(155)`                                           |
| `wallets_send_boost`                      | POST   | no-body       | 415    | `text(61)`                                            |
| `wallets_send_boost`                      | POST   | empty-object  | 400    | `text(149)`                                           |
| `wallets_send_transfer`                   | POST   | no-body       | 415    | `text(61)`                                            |
| `wallets_send_transfer`                   | POST   | empty-object  | 400    | `text(158)`                                           |
| `wallets_state_and_history`               | GET    | absent-record | 200    | `object{balance,boosts,exchanges,requests,transfers}` |
| `wallets_subscribe_deploys`               | GET    | absent-record | 400    | `text(16)`                                            |
