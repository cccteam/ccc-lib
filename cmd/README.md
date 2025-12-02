# Demo Application

This repository contains the code for showcasing CCC's full-stack system.

## Getting Started

### Prerequisites

- [Go](https://golang.org/doc/install)
- [Docker](https://docs.docker.com/install/) (Windows), [Podman](https://podman.io/) (Fedora)

### Local Development

We have the following build tags:

- `dev`: Used to differentiate local development vs cloud-based environment. For local development the dev build tag is used. The difference is primarily how logging and tracing are configured. In dev mode logging is to the local console, and tracing is disabled.
- `skipAuth`: Used to differentiate local authentication/authorization vs cloud-based OIDC OAuth 2.0 flow. In `skipAuth` mode authentication/authorization is controled via environment variables.

[Air](https://github.com/cosmtrek/air) is used for auto-reloading the web server when changes are made to the go source code.

We use a process manager [overmind](https://github.com/DarthSim/overmind) to run the development environment. It is configured with the `Procfile` and relies heavily on environment variables.

There is a separate `ProdProcfile` that sets up the dev server to directly serve the Angular files as you would see in production. Your angular port (from `.envrc`, `APP_NG_SERVE_PORT`) is reused so that you can access the frontend from the same endpoint. This setup allows service workers to run.

Starting Overmind

```bash
$ overmind s
```

Starting Overmind in Production Mode

```bash
$ overmind s -f ProdProcfile
```

To get started, create a `.envrc` file using the `.envrc.template` as a starting point. **Your `.envrc` file should never be checked into the repository.**

````

For local development:

```bash
go build -tags=dev
````

#### Front-End Local Development

In addition to the general local development setup listed above, do the following:

1. In the root of the repository run `cd gui; npm i` to install dependencies.
2. Run `cd ..; overmind s` to start up the app.
3. Visit `localhost:<port>` in a browser, where `port` is the Angular port set in your `.envrc` file.

#### Bootstrap data

Use the `APP_BOOTSTRAP_DATA_PATH` env var in your `.envrc` file to point at a directory containing bootstrap data scripts. If you get the following `Unrecognized ddl` error, run the subsequent `docker pull` command to fix it.

##### Error excerpts

```
INTERNAL: ZETASQL_RET_CHECK failure ... Unrecognized ddl::ColumnDefinition ... proto_type_name: "TOKENLIST"
```

##### Fix

```bash
docker pull gcr.io/cloud-spanner-emulator/emulator:latest
```

#### Code generation

Use `go generate ./...` at the root of the project to re-generate auto-generated portions of the project. If you get an error, try installing the latest `mockgen` by running `go install go.uber.org/mock/mockgen@latest`.

### Cloud Environment

### Database Management

The database is managed via migrations in the [schema/migrations](schema/migrations/) folder. To run migrations, you must have the [migrate](https://github.com/golang-migrate/migrate) cli installed. Follow [these instructions](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) to install it.

## Content Security Policy (CSP)

The CSP for this application is:

> _trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script'; default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:_

Per Angular documentation (as of 03-JAN-2024):

> The minimal policy required for a brand-new Angular application is:  
> _default-src 'self'; style-src 'self' 'nonce-randomNonceGoesHere'; script-src 'self' 'nonce-randomNonceGoesHere';_  
> ...  
> If you cannot generate nonces in your project, you can allow inline styles by adding 'unsafe-inline' to the style-src section of the CSP header.  
> ...  
> It is recommended that you use Trusted Types as a way to help secure your applications from cross-site scripting attacks.  
> ...  
> An example of a header specifically configured for Trusted Types and Angular applications that use any of Angular's methods in DomSanitizer that bypasses security:  
> _Content-Security-Policy: trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script';_

For certain portions of this application (e.g., Angular Material's use of element.setAttribute()), the nonce approach for style-src is not feasible. Therefore, the 'unsafe-inline' directive is used, as permitted by the Angular documentation excerpt provided above.

The inclusion of angular#unsafe-bypass in the trusted-types directive is necessary due to the use of DomSanitizer.bypassSecurityTrustResourceUrl() in this application. Note that this method is only used in situtations where it has been determined that the URL is safe to use.

https://fonts.gstatic.com is a domain used by Google to serve web fonts that are used in this application.

The inclusion of "_data:_" in the img-src directive is necessary for certain Angular Material components used in this application.
