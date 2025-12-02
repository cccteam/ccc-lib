// app contains the core functionality for the application server. This includes the routing and handlers for http requests
package app

import (
	"context"
	"net/http"
	"strings"

	"github.com/cccteam/access"
	"github.com/cccteam/ccc/accesstypes"
	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/demo-app/gui"
	"github.com/cccteam/demo-app/pkg/computedresources"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/demo-app/pkg/rpc"
	"github.com/cccteam/httpio"
	"github.com/cccteam/logger"
	"github.com/cccteam/session"
	"github.com/cccteam/session/sessioninfo"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/errors/v5"
	"github.com/go-playground/validator/v10"
	"github.com/jtwatson/spaassets"
)

const (
	name = "github.com/cccteam/demo-app/app"

	// Refer to the 'Content Security Policy (CSP)' section of the README for an explanation of the CSP policy
	cspPolicy string = "default-src 'self'; worker-src 'self'; connect-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:"

	hstsPolicy          string = "max-age=31536000; includeSubDomains"
	referrerPolicy      string = "no-referrer"
	xContentTypeOptions string = "nosniff"
	xFrameOptions       string = "SAMEORIGIN"

	// Disable permissions for all standardized features
	permissionsPolicy string = "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), bluetooth=(), camera=(), ch-ua=(), ch-ua-arch=(), " +
		"ch-ua-bitness=(), ch-ua-full-version=(), ch-ua-full-version-list=(), ch-ua-mobile=(), ch-ua-model=(), ch-ua-platform=(), ch-ua-platform-version=(), " +
		"ch-ua-wow64=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), " +
		"fullscreen=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), " +
		"payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), web-share=(), window-management=(), xr-spatial-tracking=()"
)

var _ http.Handler = &App{}

type App struct {
	router *chi.Mux
	access access.Controller
	*session.OIDCAzureSession
	resourceClient     resource.Client
	rpcClient          *rpc.Client
	computedClient     *computedresources.Client
	validate           *validator.Validate
	ResourceCollection *resource.Collection
}

func New(cfg Configurer) *App {
	a := &App{
		access:             cfg.Access(),
		OIDCAzureSession:   cfg.Session(),
		resourceClient:     cfg.ResourceClient(),
		rpcClient:          cfg.RPCClient(),
		computedClient:     cfg.ComputedClient(),
		validate:           cfg.Validator(),
		ResourceCollection: cfg.ResourceCollection(),
	}

	a.router = router.New(a)

	return a
}

// ServeHTTP implements the http Handler interface
func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.router.ServeHTTP(w, r)
}

// Logger returns a middleware that logs requests
func (a *App) LoggerMiddleware() func(http.Handler) http.Handler {
	return logger.NewRequestLogger(logger.NewConsoleExporter())
}

// SecurityHeaders is a middleware that sets security-related headers on the http response
func (a *App) SecurityHeaders(next http.Handler) http.Handler {
	return httpio.Log(func(w http.ResponseWriter, r *http.Request) error {
		w.Header().Set("Content-Security-Policy", cspPolicy)
		w.Header().Set("Strict-Transport-Security", hstsPolicy)
		w.Header().Set("Referrer-Policy", referrerPolicy)
		w.Header().Set("X-Content-Type-Options", xContentTypeOptions)
		w.Header().Set("X-Frame-Options", xFrameOptions)
		w.Header().Set("Permissions-Policy", permissionsPolicy)

		next.ServeHTTP(w, r)

		return nil
	})
}

// NoCaching is a middleware that sets headers to prevent caching of the http response
func (a *App) NoCaching(next http.Handler) http.Handler {
	return httpio.Log(func(w http.ResponseWriter, r *http.Request) error {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache") // For HTTP/1.0 backward compatibility
		w.Header().Set("Expires", "0")       // For proxies

		next.ServeHTTP(w, r)

		return nil
	})
}

func (a *App) Assets() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") || r.URL.Path == "/index.html" {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache") // For HTTP/1.0 backward compatibility
			w.Header().Set("Expires", "0")       // For proxies
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}

		gui.Assets("../projects/showcase-app/dist").ServeHTTP(w, r)
	}
}

// CompressionMiddleware returns a middleware that compresses http responses.
func (a *App) CompressionMiddleware() func(http.Handler) http.Handler {
	return middleware.Compress(5)
}

func (a *App) DeepLink(next http.Handler) http.Handler {
	return spaassets.DeepLink(next, "/")
}

func (a *App) WithParamsHTTP() func(http.Handler) http.Handler {
	return httpio.WithParams
}

func (a *App) UserPermissions(r *http.Request) resource.UserPermissions {
	return &UserPermissions{
		domain: accesstypes.GlobalDomain,
		user:   accesstypes.User(sessioninfo.FromCtx(r.Context()).Username),
		access: a.access,
	}
}

func (a *App) ResourceClient() resource.Client {
	return a.resourceClient
}

func (a *App) RPCClient() *rpc.Client {
	return a.rpcClient
}

func (a *App) ComputedClient() *computedresources.Client {
	return a.computedClient
}

type UserPermissions struct {
	domain accesstypes.Domain
	user   accesstypes.User
	access access.Controller
}

func (u *UserPermissions) Domain() accesstypes.Domain {
	return u.domain
}

func (u *UserPermissions) User() accesstypes.User {
	return u.user
}

func (u *UserPermissions) Check(ctx context.Context, perm accesstypes.Permission, res ...accesstypes.Resource) (ok bool, missing []accesstypes.Resource, err error) {
	ok, missing, err = u.access.RequireResources(ctx, u.user, u.domain, perm, res...)
	if err != nil {
		return false, nil, errors.Wrap(err, "access.RequireResources()")
	}

	return ok, missing, nil
}

func handleError[T any](err error) error {
	// switch any(new(T)).(type) {
	// case *resources.<resource>:
	// 	return err
	// }

	return err
}
