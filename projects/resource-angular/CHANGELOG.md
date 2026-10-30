# Changelog

## [0.0.28](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.27...resource-angular/v0.0.28) (2026-10-30)


### Features

* `StandingInvitation` and `OpenedInvitation` carry `accountExists` and `hasPassword`, `signInUrl` takes `loginHint`, and `invitationAddressCode` is exported (@cccteam/resource) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))
* a sign-out page ends the session and forwards to the login page, which ends none on arrival ([#151](https://github.com/cccteam/ccc-lib/issues/151)) ([1b438c0](https://github.com/cccteam/ccc-lib/commit/1b438c007a50b82eb3933d3c94102156ec7fe31e))
* feature flags in the browser: the client holds the enabled set loaded at sign-in and flips a flag through the generated SetFeature method, and an API that serves no feature flags answers every flag off and announces it once (@cccteam/resource); the cccFeature directive, the featureMatch route guard, the flag on menu items and the feature-flags dialog (@cccteam/resource-angular) ([#127](https://github.com/cccteam/ccc-lib/issues/127)) ([6a779c4](https://github.com/cccteam/ccc-lib/commit/6a779c42578dba5e87b4a34eb5fd97f65143b4d2))
* live pages and a short browser cache: a list page or a record page that opts in with live stays current without polling and is served from the browser's own cache inside a five-minute window (the change feed contract and the live session in @cccteam/resource, the Firestore change feed as the new package @cccteam/resource-firestore over the Firebase SDK, and the live option, the CHANGE_FEED token and the auth service's feed lifecycle in @cccteam/resource-angular) ([f2bc6f3](https://github.com/cccteam/ccc-lib/commit/f2bc6f3cd468fd64290349b1181d243a04bdd1c2))
* **resource-angular:** an icon column on the config-driven list renders a field's value as an icon with a tooltip from a declared map ([#141](https://github.com/cccteam/ccc-lib/issues/141)) ([d09f6e1](https://github.com/cccteam/ccc-lib/commit/d09f6e161ec1dadf161e75f2856f5829cd33e51c))
* **resource-angular:** the library serves the fonts the components render in, with a typography fallback chain ([#134](https://github.com/cccteam/ccc-lib/issues/134)) ([777dad2](https://github.com/cccteam/ccc-lib/commit/777dad276c10ecb15074774afcd8abf5441444c6))
* **resource-angular:** the login card offers one small "Use a different account" link under its provider buttons; pressed, every provider button reads "Choose a … account" and asks the provider for its account chooser, and after a refusal the buttons say so by themselves ([#179](https://github.com/cccteam/ccc-lib/issues/179)) ([75e4a30](https://github.com/cccteam/ccc-lib/commit/75e4a308d0a7d1e0a2a8d70f14d01868209c292f))
* **resource-angular:** the login card says the server did not answer, the tokens page and the Users page act one step at a time in named dialogs, and an action dialog any page may ask in ([#170](https://github.com/cccteam/ccc-lib/issues/170)) ([73b75ec](https://github.com/cccteam/ccc-lib/commit/73b75ec0717cc9a2ccec8102c5cbeb2bb140a828))
* **resource-angular:** the Users page's row menu opens beside its button when neither below nor above has room, never over it, and the button says its menu is open ([#173](https://github.com/cccteam/ccc-lib/issues/173)) ([96a0ba9](https://github.com/cccteam/ccc-lib/commit/96a0ba978f65756e010167c2041c0668fdab55ea))
* **resource,resource-angular:** the client keeps the release the server names, and ccc-release shows it ([#149](https://github.com/cccteam/ccc-lib/issues/149)) ([703bcd6](https://github.com/cccteam/ccc-lib/commit/703bcd69f713ad41a9a429e37edeac7ebe738ca6))
* **resource,resource-angular:** the login page follows the mailed links; the console invites and shows the address ([#147](https://github.com/cccteam/ccc-lib/issues/147)) ([ac840a9](https://github.com/cccteam/ccc-lib/commit/ac840a9be6434932fe3f3b11cfdbe2fedcb01035))
* **resource,resource-angular:** the login page forwards a deep link straight to the only redirect sign-in method and stops on a direct visit, a refusal, a step or a second method; after a refusal the same redirect button asks the provider for its account chooser (prompt=select_account, through signInUrl's new selectAccount option) and a direct visit offers "Use a different account" under each redirect button ([#175](https://github.com/cccteam/ccc-lib/issues/175)) ([b293031](https://github.com/cccteam/ccc-lib/commit/b29303151f87cc46c78c043f5268f9898e285a7b))
* **resource,resource-angular:** the sign-in client and the login methods component, rendered from the server's list ([#136](https://github.com/cccteam/ccc-lib/issues/136)) ([9d3f16f](https://github.com/cccteam/ccc-lib/commit/9d3f16f9aa8f0e78090e6e0a931878ac439b95fe))
* **resource,resource-angular:** the user-management page configures itself from the descriptor's surfaces, and the login component serves the forced password change ([#138](https://github.com/cccteam/ccc-lib/issues/138)) ([d3c468e](https://github.com/cccteam/ccc-lib/commit/d3c468e2c248da37d9cbfa34adf90eb962769045))
* **resource,resource-angular:** the Users page follows the IAM pattern: roles by title with where they apply, an access panel whose Save applies the difference, an account panel for the rest, and a role's description on its row ([#167](https://github.com/cccteam/ccc-lib/issues/167)) ([9817c78](https://github.com/cccteam/ccc-lib/commit/9817c78fa18b1dc093f1ddc326bf4b0e0fefd0a9))
* the console's token page and device approval: a person issues, lists and revokes their application tokens and approves a command-line client's request ([#161](https://github.com/cccteam/ccc-lib/issues/161)) ([7cd5ce1](https://github.com/cccteam/ccc-lib/commit/7cd5ce13d810f577b388be423e9452f4f8e14bb9))
* the first release of @cccteam/resource, a framework-neutral TypeScript client for the APIs the ccc resource package generates (typed reads, writes, and RPC methods, keyset paging, the permission digest and per-row capability envelope, a scripted transport for tests under @cccteam/resource/testing), and of @cccteam/resource-angular, its Angular binding (config-driven list, view, create, and edit pages, the server-paged grid, enumerated pickers, guards and menus gated on the permission digest, login refusal messages, provideResourceTesting under @cccteam/resource-angular/testing) ([1cf3a02](https://github.com/cccteam/ccc-lib/commit/1cf3a0280b3085b18eaf709bd8bafa27ea1057af))
* the login card offers "Accept as &lt;signed-in user&gt;" only when that account holds the invited address or none; signed in as another account it says whose the invitation is and how to accept it, and a 403 refusal of the acceptance keeps the invitation standing (@cccteam/resource-angular) ([#184](https://github.com/cccteam/ccc-lib/issues/184)) ([629546a](https://github.com/cccteam/ccc-lib/commit/629546a300918f6e4b6fb1ee59ccc1a7510aa5c7))
* the login card's invitation screen offers every way that can accept the invitation for the invited address and none that cannot: "Continue with &lt;label&gt; as &lt;address&gt;" with the provider's login hint, the password form when an account with a password holds the address, the account form by itself when none does and no directory admits it; no "Use a different account" while an invitation stands; the `invitation_address` refusal names the address (@cccteam/resource-angular) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))
* the login page declares the sign-in steps it renders (cccteam.signInSteps in @cccteam/resource-angular's package.json, SIGN_IN_STEPS in the component), for the framework's release check, and a step it does not render says the page is older than the server and asks for a reload instead of "needs another step" ([#171](https://github.com/cccteam/ccc-lib/issues/171)) ([f248c7a](https://github.com/cccteam/ccc-lib/commit/f248c7afc3f423904d482b5eadfa9604758c9d55))
* the login page runs the sign-in code step: the code is mailed at once to the address the account holds, the step says where it went, a wrong or dead code keeps the form with its sentence, a box has the browser remembered, and a person whose account holds no address gives one first ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))
* the login page shows a sentence for no_tenant, connection_not_in_tenant and directory_only ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))
* the login page shows a sentence for too_many_attempts with the wait, reading the code from a 429 refusal ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))
* the login page tells a stranger the organization admits people by invitation only ([#164](https://github.com/cccteam/ccc-lib/issues/164)) ([214404f](https://github.com/cccteam/ccc-lib/commit/214404f8897c97b837f960f1c0a45e002ec571fc))
* the maintenance notice: the browser app tells the person the server is down for maintenance and checks back until it answers again (@cccteam/resource, @cccteam/resource-angular) ([#132](https://github.com/cccteam/ccc-lib/issues/132)) ([2060c64](https://github.com/cccteam/ccc-lib/commit/2060c6407307833b7218ddc38a5f1e1c017740bf))
* the sign-in client drives the code step: the methods list keeps the send, verify and enrollment routes, the pending status carries where the code stands, and sendCode, enrollEmail and verifyCode resolve the server's refusals in place ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))
* the update notice and the release header: the browser apps install as progressive web apps and carry their release on every request ([#130](https://github.com/cccteam/ccc-lib/issues/130)) ([51f24b7](https://github.com/cccteam/ccc-lib/commit/51f24b75927e01abf7482925065ce3d49e9d54be))
* the users page forgets a person's remembered browsers, so their next sign-in asks for the code again, through the partition's reset method and the client's resetFactors ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))


### Bug Fixes

* `resourceRoutes` lists a page whose config names no navigation group at the top level of the menu; before, only grouped pages were listed (@cccteam/resource-angular) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))
* config-driven pages build their row links and after-create navigation under the page's tenant ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))
* **resource-angular:** on the invited screen "Create an account with a password" comes last, where the open sign-up link stands, as the note's sentence says ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource-angular:** the edit form checks the limits of the fields the person changed, and warns about the others: an untouched field whose value fails this build's rules (longer than the limit this build knows, or empty where the page config requires a value) no longer blocks the save, and the view says which field and which rule; a config validators function keeps the field's limit ([5ecae48](https://github.com/cccteam/ccc-lib/commit/5ecae48ced0e24f4e5cbe3edc49ea005b2c35df1))
* **resource-angular:** the edit form's refusal message follows the refusal rule: it shows while a save was refused and a changed field still fails, and clears once the changed fields pass, whatever an untouched field holds ([5ecae48](https://github.com/cccteam/ccc-lib/commit/5ecae48ced0e24f4e5cbe3edc49ea005b2c35df1))
* **resource-angular:** the login page's refusal sentences read as plain English, and a Google account the application does not accept is told to sign in with the account its organization gave it ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource-angular:** the package's repository link uses https and names its folder, and its client peer range follows @cccteam/resource 0.0.2 ([#114](https://github.com/cccteam/ccc-lib/issues/114)) ([eb29fe8](https://github.com/cccteam/ccc-lib/commit/eb29fe80bc5697cb31699cdd39ac2adb16f4ec55))
* **resource-angular:** the Users page names a linked identity by its provider and the organization the link carries, "Google (example)", instead of its connection ([#177](https://github.com/cccteam/ccc-lib/issues/177)) ([aa86f1d](https://github.com/cccteam/ccc-lib/commit/aa86f1de983e6824e222c27889024d3f01f461cc))
* **resource,ccc-lib:** a create's new keys are read under ids, with iDs as the fallback the current server still sends ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource,resource-angular:** the login page keeps showing an invitation after a refused directory sign-in, from the invitation the methods listing says the browser still carries ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource,resource-angular:** while an invitation stands, the login page offers only the directory buttons that could admit the invited address ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource:** a field the row did not carry and the form left empty is not a change: the server leaves a cell that is masked for the reader out of the row, with no marker, so the edit form held null for it and every save of that row sent that null as a clear ([3fbb765](https://github.com/cccteam/ccc-lib/commit/3fbb765147238d0237228458056a830994a183f0))
* the email address component says in plain words that a confirmation link was sent and that an address is not confirmed yet ([#153](https://github.com/cccteam/ccc-lib/issues/153)) ([3bb1504](https://github.com/cccteam/ccc-lib/commit/3bb1504a3feba67c6e6e58f5674df11941b289a6))
* the Invitations table shows who sent an invitation, the username the row carries ([#155](https://github.com/cccteam/ccc-lib/issues/155)) ([9761cf6](https://github.com/cccteam/ccc-lib/commit/9761cf64560c1af1e8d6b80d6ea72fddf79d15f4))
* the login component renders nothing until its arrival reads answer, instead of a progress bar on every load, and a page holds its card back on the same signal ([#162](https://github.com/cccteam/ccc-lib/issues/162)) ([e6c3120](https://github.com/cccteam/ccc-lib/commit/e6c312077cac93d85275a76bc8471cee07cd2cb1))
* the login page shows a progress bar while it reads the session on arrival with a link, instead of the sign-in form ([#157](https://github.com/cccteam/ccc-lib/issues/157)) ([6c8c160](https://github.com/cccteam/ccc-lib/commit/6c8c160121ce1a5e3cf78672a6c64ec2fbca7ff2))

## [0.0.27](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.26...resource-angular/v0.0.27) (2026-10-30)


### Features

* the login card offers "Accept as &lt;signed-in user&gt;" only when that account holds the invited address or none; signed in as another account it says whose the invitation is and how to accept it, and a 403 refusal of the acceptance keeps the invitation standing (@cccteam/resource-angular) ([#184](https://github.com/cccteam/ccc-lib/issues/184)) ([629546a](https://github.com/cccteam/ccc-lib/commit/629546a300918f6e4b6fb1ee59ccc1a7510aa5c7))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.18 to ^0.0.19

## [0.0.26](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.25...resource-angular/v0.0.26) (2026-10-29)


### Features

* `StandingInvitation` and `OpenedInvitation` carry `accountExists` and `hasPassword`, `signInUrl` takes `loginHint`, and `invitationAddressCode` is exported (@cccteam/resource) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))
* the login card's invitation screen offers every way that can accept the invitation for the invited address and none that cannot: "Continue with &lt;label&gt; as &lt;address&gt;" with the provider's login hint, the password form when an account with a password holds the address, the account form by itself when none does and no directory admits it; no "Use a different account" while an invitation stands; the `invitation_address` refusal names the address (@cccteam/resource-angular) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))


### Bug Fixes

* `resourceRoutes` lists a page whose config names no navigation group at the top level of the menu; before, only grouped pages were listed (@cccteam/resource-angular) ([#181](https://github.com/cccteam/ccc-lib/issues/181)) ([ff038e2](https://github.com/cccteam/ccc-lib/commit/ff038e25d860430228cc415066a2e48702bdfe77))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.17 to ^0.0.18

## [0.0.25](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.24...resource-angular/v0.0.25) (2026-10-29)


### Features

* **resource-angular:** the login card offers one small "Use a different account" link under its provider buttons; pressed, every provider button reads "Choose a … account" and asks the provider for its account chooser, and after a refusal the buttons say so by themselves ([#179](https://github.com/cccteam/ccc-lib/issues/179)) ([75e4a30](https://github.com/cccteam/ccc-lib/commit/75e4a308d0a7d1e0a2a8d70f14d01868209c292f))

## [0.0.24](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.23...resource-angular/v0.0.24) (2026-10-29)


### Bug Fixes

* **resource-angular:** the Users page names a linked identity by its provider and the organization the link carries, "Google (example)", instead of its connection ([#177](https://github.com/cccteam/ccc-lib/issues/177)) ([aa86f1d](https://github.com/cccteam/ccc-lib/commit/aa86f1de983e6824e222c27889024d3f01f461cc))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.16 to ^0.0.17

## [0.0.23](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.22...resource-angular/v0.0.23) (2026-10-29)


### Features

* **resource,resource-angular:** the login page forwards a deep link straight to the only redirect sign-in method and stops on a direct visit, a refusal, a step or a second method; after a refusal the same redirect button asks the provider for its account chooser (prompt=select_account, through signInUrl's new selectAccount option) and a direct visit offers "Use a different account" under each redirect button ([#175](https://github.com/cccteam/ccc-lib/issues/175)) ([b293031](https://github.com/cccteam/ccc-lib/commit/b29303151f87cc46c78c043f5268f9898e285a7b))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.15 to ^0.0.16

## [0.0.22](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.21...resource-angular/v0.0.22) (2026-10-29)


### Features

* **resource-angular:** the Users page's row menu opens beside its button when neither below nor above has room, never over it, and the button says its menu is open ([#173](https://github.com/cccteam/ccc-lib/issues/173)) ([96a0ba9](https://github.com/cccteam/ccc-lib/commit/96a0ba978f65756e010167c2041c0668fdab55ea))

## [0.0.21](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.20...resource-angular/v0.0.21) (2026-10-29)


### Features

* **resource-angular:** the login card says the server did not answer, the tokens page and the Users page act one step at a time in named dialogs, and an action dialog any page may ask in ([#170](https://github.com/cccteam/ccc-lib/issues/170)) ([73b75ec](https://github.com/cccteam/ccc-lib/commit/73b75ec0717cc9a2ccec8102c5cbeb2bb140a828))
* the login page declares the sign-in steps it renders (cccteam.signInSteps in @cccteam/resource-angular's package.json, SIGN_IN_STEPS in the component), for the framework's release check, and a step it does not render says the page is older than the server and asks for a reload instead of "needs another step" ([#171](https://github.com/cccteam/ccc-lib/issues/171)) ([f248c7a](https://github.com/cccteam/ccc-lib/commit/f248c7afc3f423904d482b5eadfa9604758c9d55))

## [0.0.20](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.19...resource-angular/v0.0.20) (2026-10-28)


### Features

* **resource,resource-angular:** the Users page follows the IAM pattern: roles by title with where they apply, an access panel whose Save applies the difference, an account panel for the rest, and a role's description on its row ([#167](https://github.com/cccteam/ccc-lib/issues/167)) ([9817c78](https://github.com/cccteam/ccc-lib/commit/9817c78fa18b1dc093f1ddc326bf4b0e0fefd0a9))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.14 to ^0.0.15

## [0.0.19](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.18...resource-angular/v0.0.19) (2026-10-28)


### Features

* the login page runs the sign-in code step: the code is mailed at once to the address the account holds, the step says where it went, a wrong or dead code keeps the form with its sentence, a box has the browser remembered, and a person whose account holds no address gives one first ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))
* the sign-in client drives the code step: the methods list keeps the send, verify and enrollment routes, the pending status carries where the code stands, and sendCode, enrollEmail and verifyCode resolve the server's refusals in place ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))
* the users page forgets a person's remembered browsers, so their next sign-in asks for the code again, through the partition's reset method and the client's resetFactors ([#166](https://github.com/cccteam/ccc-lib/issues/166)) ([ccc825d](https://github.com/cccteam/ccc-lib/commit/ccc825d986794712c48f1157a75e4d8438340c53))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.13 to ^0.0.14

## [0.0.18](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.17...resource-angular/v0.0.18) (2026-10-27)


### Features

* the login page tells a stranger the organization admits people by invitation only ([#164](https://github.com/cccteam/ccc-lib/issues/164)) ([214404f](https://github.com/cccteam/ccc-lib/commit/214404f8897c97b837f960f1c0a45e002ec571fc))

## [0.0.17](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.16...resource-angular/v0.0.17) (2026-10-26)


### Features

* the console's token page and device approval: a person issues, lists and revokes their application tokens and approves a command-line client's request ([#161](https://github.com/cccteam/ccc-lib/issues/161)) ([7cd5ce1](https://github.com/cccteam/ccc-lib/commit/7cd5ce13d810f577b388be423e9452f4f8e14bb9))


### Bug Fixes

* the login component renders nothing until its arrival reads answer, instead of a progress bar on every load, and a page holds its card back on the same signal ([#162](https://github.com/cccteam/ccc-lib/issues/162)) ([e6c3120](https://github.com/cccteam/ccc-lib/commit/e6c312077cac93d85275a76bc8471cee07cd2cb1))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.12 to ^0.0.13

## [0.0.16](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.15...resource-angular/v0.0.16) (2026-10-24)


### Bug Fixes

* **resource-angular:** on the invited screen "Create an account with a password" comes last, where the open sign-up link stands, as the note's sentence says ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource-angular:** the login page's refusal sentences read as plain English, and a Google account the application does not accept is told to sign in with the account its organization gave it ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource,ccc-lib:** a create's new keys are read under ids, with iDs as the fallback the current server still sends ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource,resource-angular:** the login page keeps showing an invitation after a refused directory sign-in, from the invitation the methods listing says the browser still carries ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))
* **resource,resource-angular:** while an invitation stands, the login page offers only the directory buttons that could admit the invited address ([#159](https://github.com/cccteam/ccc-lib/issues/159)) ([e6f24d9](https://github.com/cccteam/ccc-lib/commit/e6f24d945190e63f05644c86a818c70a6f24c887))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.11 to ^0.0.12

## [0.0.15](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.14...resource-angular/v0.0.15) (2026-10-24)


### Bug Fixes

* the login page shows a progress bar while it reads the session on arrival with a link, instead of the sign-in form ([#157](https://github.com/cccteam/ccc-lib/issues/157)) ([6c8c160](https://github.com/cccteam/ccc-lib/commit/6c8c160121ce1a5e3cf78672a6c64ec2fbca7ff2))

## [0.0.14](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.13...resource-angular/v0.0.14) (2026-10-24)


### Bug Fixes

* the Invitations table shows who sent an invitation, the username the row carries ([#155](https://github.com/cccteam/ccc-lib/issues/155)) ([9761cf6](https://github.com/cccteam/ccc-lib/commit/9761cf64560c1af1e8d6b80d6ea72fddf79d15f4))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.10 to ^0.0.11

## [0.0.13](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.12...resource-angular/v0.0.13) (2026-10-23)


### Bug Fixes

* the email address component says in plain words that a confirmation link was sent and that an address is not confirmed yet ([#153](https://github.com/cccteam/ccc-lib/issues/153)) ([3bb1504](https://github.com/cccteam/ccc-lib/commit/3bb1504a3feba67c6e6e58f5674df11941b289a6))

## [0.0.12](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.11...resource-angular/v0.0.12) (2026-10-23)


### Features

* a sign-out page ends the session and forwards to the login page, which ends none on arrival ([#151](https://github.com/cccteam/ccc-lib/issues/151)) ([1b438c0](https://github.com/cccteam/ccc-lib/commit/1b438c007a50b82eb3933d3c94102156ec7fe31e))

## [0.0.11](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.10...resource-angular/v0.0.11) (2026-10-23)


### Features

* **resource,resource-angular:** the client keeps the release the server names, and ccc-release shows it ([#149](https://github.com/cccteam/ccc-lib/issues/149)) ([703bcd6](https://github.com/cccteam/ccc-lib/commit/703bcd69f713ad41a9a429e37edeac7ebe738ca6))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.9 to ^0.0.10

## [0.0.10](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.9...resource-angular/v0.0.10) (2026-10-23)


### Features

* **resource,resource-angular:** the login page follows the mailed links; the console invites and shows the address ([#147](https://github.com/cccteam/ccc-lib/issues/147)) ([ac840a9](https://github.com/cccteam/ccc-lib/commit/ac840a9be6434932fe3f3b11cfdbe2fedcb01035))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.8 to ^0.0.9

## [0.0.9](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.8...resource-angular/v0.0.9) (2026-10-21)


### Features

* the login page shows a sentence for no_tenant, connection_not_in_tenant and directory_only ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))
* the login page shows a sentence for too_many_attempts with the wait, reading the code from a 429 refusal ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))


### Bug Fixes

* config-driven pages build their row links and after-create navigation under the page's tenant ([#145](https://github.com/cccteam/ccc-lib/issues/145)) ([b001c05](https://github.com/cccteam/ccc-lib/commit/b001c050843a2701841565743c743b5436bfa1f6))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.7 to ^0.0.8

## [0.0.8](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.7...resource-angular/v0.0.8) (2026-10-19)


### Features

* **resource-angular:** an icon column on the config-driven list renders a field's value as an icon with a tooltip from a declared map ([#141](https://github.com/cccteam/ccc-lib/issues/141)) ([d09f6e1](https://github.com/cccteam/ccc-lib/commit/d09f6e161ec1dadf161e75f2856f5829cd33e51c))
* **resource,resource-angular:** the user-management page configures itself from the descriptor's surfaces, and the login component serves the forced password change ([#138](https://github.com/cccteam/ccc-lib/issues/138)) ([d3c468e](https://github.com/cccteam/ccc-lib/commit/d3c468e2c248da37d9cbfa34adf90eb962769045))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.6 to ^0.0.7

## [0.0.7](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.6...resource-angular/v0.0.7) (2026-10-18)


### Features

* **resource,resource-angular:** the sign-in client and the login methods component, rendered from the server's list ([#136](https://github.com/cccteam/ccc-lib/issues/136)) ([9d3f16f](https://github.com/cccteam/ccc-lib/commit/9d3f16f9aa8f0e78090e6e0a931878ac439b95fe))


### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @cccteam/resource bumped from ^0.0.5 to ^0.0.6

## [0.0.6](https://github.com/cccteam/ccc-lib/compare/resource-angular/v0.0.5...resource-angular/v0.0.6) (2026-10-17)


### Features

* **resource-angular:** the library serves the fonts the components render in, with a typography fallback chain ([#134](https://github.com/cccteam/ccc-lib/issues/134)) ([777dad2](https://github.com/cccteam/ccc-lib/commit/777dad276c10ecb15074774afcd8abf5441444c6))

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
