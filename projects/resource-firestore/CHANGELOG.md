# Changelog

## [0.0.2](https://github.com/cccteam/ccc-lib/compare/resource-firestore/v0.0.1...resource-firestore/v0.0.2) (2026-10-02)


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.3 to ^0.0.4

## 0.0.1 (2026-10-02)


### Features

* live pages and a short browser cache: a list page or a record page that opts in with live stays current without polling and is served from the browser's own cache inside a five-minute window (the change feed contract and the live session in @cccteam/resource, the Firestore change feed as the new package @cccteam/resource-firestore over the Firebase SDK, and the live option, the CHANGE_FEED token and the auth service's feed lifecycle in @cccteam/resource-angular) ([f2bc6f3](https://github.com/cccteam/ccc-lib/commit/f2bc6f3cd468fd64290349b1181d243a04bdd1c2))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.2 to ^0.0.3
