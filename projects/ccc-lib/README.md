# ccc-lib

**ccc-lib** is a comprehensive Angular library developed by the [cccteam](https://cloudcomputingconsultants.com/). It is designed to provide a consistent and configurable foundation for building enterprise-level data-driven applications. By defining a configuration, you can dynamically generate entire application pages.

## Core Features

- **Dynamic Page Generation**: Define a `resourceConfig` to dynamically render components and build complex layouts. For example, the `resource-resolver` can switch between components based on your data.
- **Authentication & Authorization**: A set of services and guards for managing user authentication and permissions.
- **Rich UI Components**: A collection of UI components, including a grid wrapper for Kendo UI, alert services, and more.
- **Utility Functions**: A set of helper functions for various tasks, such as data manipulation and request customization. Also included are tools for handling PATCH requests per the JSON Patch standard [RFC 6902](https://tools.ietf.org/html/rfc6902).

## Getting Started

To install **ccc-lib** in your project, run the following command:

```bash
npm install ccc-lib
```

## Core Concepts

The central concept of **ccc-lib** is the `resourceConfig`. This configuration object defines the structure and behavior of a page or a part of a page. It specifies which components to render, how they are connected, and how they interact with data.

The `compound-component` component is the engine that brings the `resourceConfig` to life. It dynamically creates and configures components based on the provided configuration, allowing for highly flexible and data-driven UIs.

## Modules Overview

- **`ccc-resource`**: The core module of the library. It contains the components and services related to dynamic page generation and data management.
- **`auth`**: This module provides authentication and authorization, including login forms, route guards, and permission directives.
- **`ui`**: This module contains UI components and services, such as alerts, notifications, and sidenav components. It also includes the `ccc-grid` component, a wrapper for the Kendo UI grid that allows for dynamic configuration.
- **`utils`**: A collection of utility pipes and functions for various purposes.

## Development

### Building the Library

To build the library locally, use the Angular CLI:

```bash
ng build ccc-lib
```

### Running Tests

To run the library's tests, use the following command:

```bash
ng test ccc-lib
```
