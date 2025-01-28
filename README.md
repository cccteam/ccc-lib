# CCC-Lib

## Overview

**CCC-Lib** provides a collection of reusable UI components, authentication functions, utility functions, and type definitions.

## Features

- **Components**: A set of reusable UI components
- **Authentication Functions**: Authentication and authorization guards
- **Utilities**: Utility functions for patching, cleaning forms, and customizing requests
- **Type Definitions**: Types for allowing permissions and

## Installation

You can install **CCC-Lib** via npm:

```bash
npm install ccc-lib
```

## Building the Library

To build **CCC-Lib**, use the Angular CLI:

```bash
ng build ccc-lib
```

This command compiles the library and outputs the build artifacts to the `dist/ccc-lib` directory.

## Packaging

After building the library, navigate to the distribution folder and create a package:

```bash
cd dist/ccc-lib
npm pack
```

This will generate a `.tgz` file that can be published to the npm registry or used locally.

## Publishing

Before publishing, ensure that you have updated the version number in `package.json` following [Semantic Versioning](https://semver.org/).

To publish **CCC-Lib** to the npm registry:

1. **Bump the Version**

   Update the version number in `dist/ccc-lib/package.json`:

   ```bash
   cd dist/ccc-lib
   npm version patch # or minor, major
   ```

2. **Publish to npm**

   ```bash
   npm publish
   ```

   > **Note:** Ensure you have the necessary permissions and are logged in to your npm account using `npm login`.
