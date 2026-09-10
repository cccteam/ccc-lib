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

A config describes the widest surface a page can have; the permission digest decides how much of it a given user gets. A create form renders only the inputs the digest grants for Create, and a list requests and renders only the configured columns the digest grants for List (key fields are structural and always pass), so one config serves a full-width role and a narrow one without a refusal in between. When the digest leaves a list no column at all, or the server refuses a request, the table says so in place of "No records found". The same digest decides whether a row can be opened: a list draws its view arrow, and the row route admits, only when Read is granted or conditional for the resource, and a row whose read is refused says so in place of its form.

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

To run the library's tests, use the following command:

```bash
ng test resource-angular
```

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
