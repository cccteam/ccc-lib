// package routerpasswordauth handles wiring up the routes to handlers and the middleware in between.
package routerpasswordauth

import (
	"net/http"

	"github.com/cccteam/session"
	"github.com/go-chi/chi/v5"
)

// Handlers is an interface for the http handlers
type Handlers interface {
	GeneratedHandlers
	Login() http.HandlerFunc
	Session() session.PasswordAuthHandlers

	// app handlers
	LoggerMiddleware() func(http.Handler) http.Handler
	SecurityHeaders(next http.Handler) http.Handler
	WithParamsHTTP() func(http.Handler) http.Handler

	// api handlers
	NoCaching(next http.Handler) http.Handler
	CompressionMiddleware() func(http.Handler) http.Handler

	// Angular app assets
	DeepLink(next http.Handler) http.Handler
	Assets() http.HandlerFunc
}

func New(h Handlers) *chi.Mux {
	r := chi.NewRouter()

	r.Use(h.LoggerMiddleware())
	r.Use(h.SecurityHeaders)
	r.Use(h.WithParamsHTTP())

	r.Group(func(r chi.Router) {
		// Disable all caching of API requests
		r.Use(h.NoCaching)

		// compress api data so large responses are not a problem
		r.Use(h.CompressionMiddleware())

		// Configure global session handling
		r.Use(h.Session().StartSession)

		// Set and validate xsrf token for all requests in this group
		r.Use(h.Session().SetXSRFToken)
		r.Use(h.Session().ValidateXSRFToken)

		r.Get("/api/user/session", h.Session().Authenticated())
		r.Post("/api/user/session", h.Login())
		r.Delete("/api/user/session", h.Session().Logout())

		r.Group(func(r chi.Router) {
			// all api requests must be authenticated
			r.Use(h.Session().ValidateSession)

			generatedRoutes(r, h)
		})
	})

	r.Route("/api/", func(r chi.Router) {
		r.NotFound(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			http.Error(w, "Not Found", http.StatusNotFound)
		}))
	})

	r.Route("/", func(r chi.Router) {
		r.Use(h.DeepLink)

		r.Get("/*", h.Assets())
	})

	return r
}
