# Changelog

## [0.0.5](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.4...resource-angular/v0.0.5) (2026-10-03)


### Features

* the maintenance notice: the browser app tells the person the server is down for maintenance and checks back until it answers again (@cccteam/resource, @cccteam/resource-angular) ([#132](https://github.com/cccteam/ccc-lib/issues/132)) ([2060c64](https://github.com/cccteam/ccc-lib/commit/2060c6407307833b7218ddc38a5f1e1c017740bf))
* the update notice and the release header: the browser apps install as progressive web apps and carry their release on every request ([#130](https://github.com/cccteam/ccc-lib/issues/130)) ([51f24b7](https://github.com/cccteam/ccc-lib/commit/51f24b75927e01abf7482925065ce3d49e9d54be))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.4 to ^0.0.5

## [0.0.4](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.3...resource-angular/v0.0.4) (2026-10-02)


### Features

* feature flags in the browser: the client holds the enabled set loaded at sign-in and flips a flag through the generated SetFeature method, and an API that serves no feature flags answers every flag off and announces it once (@cccteam/resource); the cccFeature directive, the featureMatch route guard, the flag on menu items and the feature-flags dialog (@cccteam/resource-angular) ([#127](https://github.com/cccteam/ccc-lib/issues/127)) ([6a779c4](https://github.com/cccteam/ccc-lib/commit/6a779c42578dba5e87b4a34eb5fd97f65143b4d2))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.3 to ^0.0.4

## [0.0.3](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.2...resource-angular/v0.0.3) (2026-10-02)


### Features

* live pages and a short browser cache: a list page or a record page that opts in with live stays current without polling and is served from the browser's own cache inside a five-minute window (the change feed contract and the live session in @cccteam/resource, the Firestore change feed as the new package @cccteam/resource-firestore over the Firebase SDK, and the live option, the CHANGE_FEED token and the auth service's feed lifecycle in @cccteam/resource-angular) ([f2bc6f3](https://github.com/cccteam/ccc-lib/commit/f2bc6f3cd468fd64290349b1181d243a04bdd1c2))


### Bug Fixes

* **resource-angular:** the edit form checks the limits of the fields the person changed, and warns about the others: an untouched field whose value fails this build's rules (longer than the limit this build knows, or empty where the page config requires a value) no longer blocks the save, and the view says which field and which rule; a config validators function keeps the field's limit ([5ecae48](https://github.com/cccteam/ccc-lib/commit/5ecae48ced0e24f4e5cbe3edc49ea005b2c35df1))
* **resource-angular:** the edit form's refusal message follows the refusal rule: it shows while a save was refused and a changed field still fails, and clears once the changed fields pass, whatever an untouched field holds ([5ecae48](https://github.com/cccteam/ccc-lib/commit/5ecae48ced0e24f4e5cbe3edc49ea005b2c35df1))
* **resource:** a field the row did not carry and the form left empty is not a change: the server leaves a cell that is masked for the reader out of the row, with no marker, so the edit form held null for it and every save of that row sent that null as a clear ([3fbb765](https://github.com/cccteam/ccc-lib/commit/3fbb765147238d0237228458056a830994a183f0))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.2 to ^0.0.3

## [0.0.2](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.1...resource-angular/v0.0.2) (2026-09-23)


### Bug Fixes

* **resource-angular:** the package's repository link uses https and names its folder, and its client peer range follows @cccteam/resource 0.0.2 ([#114](https://github.com/cccteam/ccc-lib/issues/114)) ([eb29fe8](https://github.com/cccteam/ccc-lib/commit/eb29fe80bc5697cb31699cdd39ac2adb16f4ec55))

## [0.0.1](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.1...resource-angular/v0.0.1) (2026-09-23)


### Features

* the first release of @cccteam/resource, a framework-neutral TypeScript client for the APIs the ccc resource package generates (typed reads, writes, and RPC methods, keyset paging, the permission digest and per-row capability envelope, a scripted transport for tests under @cccteam/resource/testing), and of @cccteam/resource-angular, its Angular binding (config-driven list, view, create, and edit pages, the server-paged grid, enumerated pickers, guards and menus gated on the permission digest, login refusal messages, provideResourceTesting under @cccteam/resource-angular/testing) ([1cf3a02](https://github.com/cccteam/ccc-lib/commit/1cf3a0280b3085b18eaf709bd8bafa27ea1057af))
