# Changelog

## [0.0.3](https://github.com/cccteam/ccc-lib/compare/resource/v0.0.2...resource/v0.0.3) (2026-10-02)


### Features

* live pages and a short browser cache: a list page or a record page that opts in with live stays current without polling and is served from the browser's own cache inside a five-minute window (the change feed contract and the live session in @cccteam/resource, the Firestore change feed as the new package @cccteam/resource-firestore over the Firebase SDK, and the live option, the CHANGE_FEED token and the auth service's feed lifecycle in @cccteam/resource-angular) ([f2bc6f3](https://github.com/cccteam/ccc-lib/commit/f2bc6f3cd468fd64290349b1181d243a04bdd1c2))


### Bug Fixes

* **resource:** a field the row did not carry and the form left empty is not a change: the server leaves a cell that is masked for the reader out of the row, with no marker, so the edit form held null for it and every save of that row sent that null as a clear ([3fbb765](https://github.com/cccteam/ccc-lib/commit/3fbb765147238d0237228458056a830994a183f0))

## [0.0.2](https://github.com/cccteam/ccc-lib/compare/resource/v0.0.1...resource/v0.0.2) (2026-09-23)


### Bug Fixes

* **resource:** the package's repository link uses https and names its folder in the repository ([#111](https://github.com/cccteam/ccc-lib/issues/111)) ([04e8811](https://github.com/cccteam/ccc-lib/commit/04e88111b5a9f60d023dea8073d57cd8eb28ed15))

## [0.0.1](https://github.com/cccteam/ccc-lib/compare/resource/v0.0.1...resource/v0.0.1) (2026-09-23)


### Features

* the first release of @cccteam/resource, a framework-neutral TypeScript client for the APIs the ccc resource package generates (typed reads, writes, and RPC methods, keyset paging, the permission digest and per-row capability envelope, a scripted transport for tests under @cccteam/resource/testing), and of @cccteam/resource-angular, its Angular binding (config-driven list, view, create, and edit pages, the server-paged grid, enumerated pickers, guards and menus gated on the permission digest, login refusal messages, provideResourceTesting under @cccteam/resource-angular/testing) ([1cf3a02](https://github.com/cccteam/ccc-lib/commit/1cf3a0280b3085b18eaf709bd8bafa27ea1057af))
