# @cccteam/resource-angular

**@cccteam/resource-angular** is the Angular binding of [`@cccteam/resource`](../resource/README.md), the framework-neutral client for generated APIs. It is a comprehensive Angular library developed by the [cccteam](https://cloudcomputingconsultants.com/). It is designed to provide a consistent and configurable foundation for building enterprise-level data-driven applications. By defining a configuration, you can dynamically generate entire application pages.

## Core Features

- **Dynamic Page Generation**: Define a `resourceConfig` to dynamically render components and build complex layouts. For example, the `resource-resolver` can switch between components based on your data.
- **Authentication & Authorization**: A set of services and guards for managing user authentication and permissions.
- **Utility Functions**: A set of helper functions for various tasks, such as data manipulation and request customization. Also included are tools for handling PATCH requests per the JSON Patch standard [RFC 6902](https://tools.ietf.org/html/rfc6902).

## Getting Started

To install it in your project, run the following command:

```bash
npm install @cccteam/resource @cccteam/resource-angular
```

`@cccteam/resource` is a peer dependency: the application installs it once and both the generated client and this library resolve the same copy.

Then import the library's stylesheet once, from the application's global styles (`src/styles.scss`):

```scss
@use '@cccteam/resource-angular/styles';
```

The form and list components request its classes by name — the twelve-column field grid, the read-only and edit-mode treatments, the sticky list header — and expose CSS variables (`--layout-label-background-color`, `--default-blue`, …) the application overrides to theme them. Without the import, fields lose their grid and section labels lose their styling.

## Core Concepts

The central concept of the library is the `resourceConfig`. This configuration object defines the structure and behavior of a page or a part of a page. It specifies which components to render, how they are connected, and how they interact with data.

The `compound-component` component is the engine that brings the `resourceConfig` to life. It dynamically creates and configures components based on the provided configuration, allowing for highly flexible and data-driven UIs.

A row page is a compound page over one row, and the page owns that row. Its store reads the row once, by the key the page resolved, and every related config the page draws (an array view, a child list, a resolver's component, the RPC buttons) exists only once the row is present: no child asks for anything from a row that has not arrived, so an array view's `listFilter` is never written against an empty row and a child list never asks for an unfiltered first page. The page's own view provides no store of its own and draws and writes through the page's store, so a save in the form is what every other child of the page reads. A reload of the row keeps the row, the form, and the children on screen while the read is in flight. A `ccc-resource-view` therefore sits inside a compound page, where it shares the page's store, or on an element carrying `cccRowStore`, which provides one for a view over a different row (the compound page places it on its related-row views); a view with no store in scope fails at construction naming `ResourceStore`.

A config describes the widest surface a page can have; the permission digest decides how much of it a given user gets. A create form renders only the inputs the digest grants for Create, and a list requests and renders only the configured columns the digest grants for List (key fields are structural and always pass), so one config serves a full-width role and a narrow one without a refusal in between. When the digest leaves a list no column at all, or the server refuses a request, the table says so in place of "No records found". The same digest decides whether a row can be opened: a list draws its view arrow, and the row route admits, only when Read is granted or conditional for the resource, and a row whose read is refused says so in place of its form.

An enumerated field — one that holds another resource's identifier — lists exactly the resource the generated metadata names: `enumeratedResource` for a resource-backed picker (a field-scope `@enumerate` on the Go struct, or the schema's foreign key), or `enumeration` for a fixed value set the picker renders with no request. The field's `enumeratedConfig` narrows those rows (`filter`, `sorts`) and chooses their display; it cannot name another resource. The picker asks for the id and the display columns explicitly, and matches a typed query against the display text or the id (so an identifier can be pasted).

How a picker reads that resource is the descriptor's statement alone: its declared maximum page size (`@page max`). No maximum, and the picker reads the source whole in one request (`limit=all`) and resolves the chosen value from that list — an id the list does not hold shows as itself — so a source with no read route (a computed catalog, a key-less view) serves it. A maximum, and the picker pages the source one server page at a time at the descriptor's default size, with Previous and Next inside the panel following the server's cursors and the first page's total, sorted by the configured `sorts`, else the source's `@order`, else the display column; the chosen value is read by key and shown ahead of the page's options whichever page is open, and a source with a maximum serves that read (the generator refuses one that does not). A bounded source the server refuses (no order and no sort) shows the refusal in the server's words under the field, never an empty list. The same switch decides how a list's referenced-resource columns resolve their display values (an unbounded source read whole once and mapped; a bounded one asked for one `filter=id:in:(…)` page per grid page over the page's keys, served by the key's index) and how an array view lists its children (whole, or one server page with Previous and Next). Nothing in the library reads every row of a bounded resource: the maximum was declared to keep the whole set out of memory, and declaring it is the author's deliberate switch.

A list page can list a view and write to the view's table. The view declares its backing table, a create goes into the table, and the new row shows up in the view on the next list because the view's SQL reads that table: the generated metadata carries the table as `rowsOf`, and the `listViewConfig` names the view alone as `primaryResource`. Rows, columns, `filter`, `sorts`, `parentRelation`, and the List-grant narrowing come from the view, since that is the resource the server enforces; create, edit, and delete go to `rowsOf`, the `elements` form is built for it, and the row page reads it. The list always requests the view's primary-key columns, read from the metadata, so an operation lifts the key the row carries — an association view keyed like its table is deleted from the list. `rowRoute` names a field of the view: a row opens that field's `enumeratedResource` on its page (the one `resourceRoutes` registered for it, else its metadata route) by the row's value in the field, and the View column is drawn when the caller may Read the target. Without `rowRoute` a row opens the write resource by its single key, and a compound-key resource with no `rowRoute` draws no View column. A `rowRoute` naming a field with no resource in the metadata throws when the page is built, naming the field. The list configuration cannot name another resource: `overrideResource` and `viewResource` are gone, and a config setting either fails to type-check.

A list pages on the server, and only there. The list component holds one page of rows — the resource's declared default page size (`@page`), or the config's `pageSize` — and the grid renders it and emits intents: a header click is the next sort, a filter menu is the next column filter, and the pager's First, Previous, and Next follow the cursors the server issued, with the total the first page answered kept while turning. Sorts and filters travel as request parameters, so the server orders and narrows every row it holds, not the ones the browser happens to have; a change to either asks for a first page again. The grid offers the server's ten filter operators and no others, and draws a filter control only on a column the generated metadata marks `filterable` — an indexed column always, an `allow_filter` column only once an indexed filter is in the request, since the server accepts it only beside one — so a filter the grid offers is one the server answers. A column's `filterable: false` in the config removes a control the metadata would draw. Selection is held as rows and spans pages. `ListViewConfig.limit` is gone: a list never gathers every row for the browser to slice, and the row-count title reads the server's total.

A list page over a key-less resource draws the whole list as one page. A `@computed` or `@virtual` struct with no `@primarykey` is served whole: its generated descriptor lists `keys: []` and the list operation alone, the client sends no `limit` and no `cursor` for it, and the metadata carries no key field. The page shows every row the server returned, the pager reads one page with Previous and Next disabled and the count, and each row is identified by its position, since a row has no key: no View column, no create, no delete, and no row route (`resourceRoutes` builds none and registers the page as nowhere a row opens). Keeping such a list a manageable size is the resource author's responsibility; `enableVirtualScroll` on the config renders the rows in view and scrolls the rest. A config asking the page for what it cannot have fails when the page is built, naming the resource and the reason, rather than being ignored: a `pageSize` (the list is served whole, no page size), `enableRowExpansion` (no key to open a row by), and a `rowRoute` naming a field with no target (refused on any resource). The grid itself identifies a row by its `rowKey` input, a function from a row to its identity that the list page fills with the row's key fields joined, so selection and expansion are right on a compound key and on a key not named `id`; a grid given no `rowKey` identifies rows by position.

Every field renders by its generated display type, in a grid cell, a view, and a form, and the three shapes with no editor yet are presented and never typed:

| Display type | Grid cell | View | Create and edit form |
| --- | --- | --- | --- |
| `string`, `uuid` | the text | a read-only text input | a text input |
| `number` | the number | a read-only number | a number input |
| `boolean`, `nullboolean` | `true` or `false` | the checkbox or the tri-state control, read-only | the checkbox or the tri-state control |
| `date`, `civildate` | M/d/yyyy | a read-only date | a date picker |
| `enumerated` | the key | the picked row's display, read-only | the picker |
| `bytes` | the size (`32 B`, `12.4 KB`), never the base64 | the size and a download of the decoded bytes, named after the field | the same, read-only; no editor: binary content is written through `@upload` and `@file` |
| any array (`number[]`, `string[]`, `date[]`, …) | the elements, each by its element type, joined with `, ` | the elements as chips | the same, read-only; no editor yet |
| `object` | the JSON on one line, cut with an ellipsis | the JSON pretty-printed | the same, read-only; no editor yet |
| any type flagged `writeOnly` | never a column: a `listColumns` entry naming one fails when the page is built, naming the resource and the field | absent, since the server never returns it | a blank input in create, and in edit over a row read without a capability envelope; the create or the patch carries the field only when a value is typed. A row's Update envelope is planned over the read projection and never names a write-only field, so under one the edit form keeps the field in view mode, absent |

A cell with no configured `formatType` is written by its field's display type, and a null is the column's `emptyDataValue`. A create or edit form never offers a free-text control over bytes, an array, or an object, so no page can send the server a value it refuses: their controls stay in view mode whatever the form's mode, start null in a create form, and a null control leaves the add operation, so a `NOT NULL` bytes, array, or object column cannot be created from the generated form until its editor lands. An empty array shows the empty placeholder, as a null does.

A config-driven page can work in a tenant. Provide `RESOURCE_DOMAIN` with a signal of the selected tenant (your tenant picker's selection): the store binds every request for a domain-scoped resource to it, and a permission question about a domain-scoped target whose scope names no domain is asked in that tenant's digest. A domain-scoped resource's metadata route carries the tenant parameter in braces, so such a page sets `routeData.route` to the path it lives at.

Every application provides its generated client: `provideResourceClient((options) => createApi({ baseUrl: environment.apiUrl, ...options }))` in the application's providers, with `API_URL` and `BASE_URL` beside it. The library's store, pickers, guards, and `AuthService` all speak through that client, and an application that provides none fails at startup naming this call as the way in. The client is the one place a response becomes an error, and the adapter renders its judgment three ways. A 401 is the session gone: the client's error hook keeps the attempted URL in `AuthService.redirectUrl` and returns the browser to `FRONTEND_LOGIN_PATH`, where the login page reads the URL once the session is back. An `ApiError` nobody caught raises one global error notice in the server's words (the body's `message`, else `HTTP <status>`), through the `ErrorHandler` the same call provides, and a request that got no response at all raises one saying so; a refusal a page reports in place raises nothing, since handling the error is what silences the notice: the store's `pageError`, the row page's `viewError`, a component's own refusal signal, and a method's declared answer (`@answers`) all render where they happen and reach no notice. Every request the client sends begins and ends `UiCoreService` activity, so `isLoading` and the progress bar move while any request is open. The library has no HTTP interceptor of its own and asks for none; `HttpClient` keeps the XSRF cookie echo (`withXsrfConfiguration`). A provider placed after `provideResourceClient` that re-provides `ErrorHandler` would silence the notice, so startup fails naming the way out when the handler in effect is not the library's: `importProvidersFrom(BrowserModule)`, which `BrowserAnimationsModule` carries, does this, and `provideAnimationsAsync()` is its replacement; an application's own handler extends `ResourceErrorHandler`. Hand-written `HttpClient` traffic outside the client is the application's to render.

A login page shows text it holds, never text from the URL. A refused OIDC login returns the browser to the login page as `<login page>?code=<code>`, and the code is all the session module sends; its "Login refusal codes" table is the finite list. `LOGIN_MESSAGES` holds one sentence for each of those codes (`DEFAULT_LOGIN_MESSAGES`), `UiCoreService.loginMessage(code)` answers the sentence or an empty string for a code the application does not know, and `publishLoginError(code)` raises it as a global error notification and says whether the code was known. The page reads the `code` query parameter and renders the lookup, so a crafted URL renders nothing. An application whose session data resolver refuses with a code of its own, or that wants a default reworded, adds `provideLoginMessages({ not_provisioned: 'Your account has not been set up yet.' })` to its providers: the library's sentences come first and the application's after.

## Modules Overview

- **`ccc-resource`**: The core module of the library. It contains the components and services related to dynamic page generation and data management.
- **`auth`**: This module provides authentication and authorization, including login forms, route guards, and permission directives.
- **`ui`**: This module contains UI components and services, such as alerts, notifications, and sidenav components.
- **`utils`**: A collection of utility pipes and functions for various purposes.

## Development

### Building the Library

To build the library locally, use the Angular CLI:

```bash
ng build resource-angular
```

### Running Tests

```bash
bun run test:angular             # once, as CI runs it
bun x ng test resource-angular   # watch mode
```

The specs run on Angular's unit-test builder (`@angular/build:unit-test`) with Vitest under jsdom
in Node; there is no browser to install. The builder initializes a library's TestBed zoneless, so a
spec drives the component itself: `TestBed.tick()` runs change detection and the effects behind it
(a resource's loader issues its request), the request is answered (`HttpTestingController`'s
`flush`, or the scripted transport below), and `await TestBed.inject(ApplicationRef).whenStable()`
settles the value. `fakeAsync`, `tick`, and `flush` from `@angular/core/testing` are not used:
Zone is not loaded, and nothing in the library advances timers.

#### The testing entry point

`@cccteam/resource-angular/testing` exports `provideResourceTesting(options?)`: the providers a spec
of a component over the library needs. `RESOURCE_CLIENT` is provided over a scripted transport
(`scriptedTransport` from `@cccteam/resource/testing`), so no request leaves the test and every
request is on record, and an empty router is provided, since the components read the route and
link to others. By default the client is `createClient` over an empty descriptor at `/api`; an
application passes its generated `createApi` as the `client` factory so the component under test
reads the descriptor its pages read, and its own transport to script the answers and read the
requests back:

```ts
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { scriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { createApi } from './zz_gen_api';
import { SquadronChannelComponent } from './squadron-channel.component';

describe('SquadronChannelComponent', () => {
  it('reads the squadron it is given and shows its callsign', async () => {
    const transport = scriptedTransport({ status: 200, body: { id: 'sq-1', callsign: 'Anvil Two' } });
    await TestBed.configureTestingModule({
      imports: [SquadronChannelComponent],
      providers: [provideResourceTesting({ transport, client: (t) => createApi({ baseUrl: '/api', transport: t }) })],
    }).compileComponents();

    const fixture = TestBed.createComponent(SquadronChannelComponent);
    fixture.componentRef.setInput('uuid', 'sq-1');
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(transport.requests.map((r) => r.url)).toEqual(['/api/squadrons/sq-1']);
    expect(fixture.nativeElement.textContent).toContain('Anvil Two');
  });
});
```

The client's error hook and error handler are not provided; a spec of the 401 redirect or the
uncaught-error notice uses `provideResourceClient` with its own transport. A component that reads
the page configuration from the route (`ActivatedRoute.snapshot.data['config']`) is given that
snapshot by its spec; the library's `resource-list-create.component.spec.ts` shows the shape. The
library's own creation specs (`*.component.spec.ts`) are the smallest examples.

### Known Issues

- **Contentful Dependency**: The library currently has a hard dependency on `@contentful/rich-text-types` due to the `CustomTypes.ContentfulDocument` type definition in the resource metadata. This means consumers of the library must have this package installed, even if they are not using this custom type.

## Package name

The library was published as `@cccteam/ccc-lib` through version 0.0.44. It was renamed
when the framework-neutral client was split out as `@cccteam/resource`, so that the two
packages share one root word and the Angular binding says which library it binds. The old
name receives no further releases; its published versions stay installable.

To do, once `@cccteam/resource-angular` is on npm and the downstream applications have
moved to it, and not before: deprecate the old name so an install of any old version
prints where to go.

```bash
npm deprecate @cccteam/ccc-lib "Renamed to @cccteam/resource-angular. Versions there start at the ABAC permission API; see its README for the migration."
```
