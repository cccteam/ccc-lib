// package router handles wiring up the routes to handlers and the middleware in between.
package router

import (
	"net/http"

	"github.com/cccteam/session"
	"github.com/go-chi/chi/v5"
)

// Handlers is an interface for the http handlers
type Handlers interface {
	GeneratedHandlers
	session.OIDCAzureHandlers

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
		r.Use(h.SetSessionTimeout)
		r.Use(h.StartSession)

		// Set xsrf token
		r.Use(h.SetXSRFToken)

		r.Get("/api/user/login", h.Login())
		r.Get("/api/user/callback", h.CallbackOIDC())

		r.Get("/api/user/session", h.Authenticated())
		r.Delete("/api/user/session", h.Logout())
		r.Get("/api/user/logout", h.FrontChannelLogout())

		r.Group(func(r chi.Router) {
			// all api requests must be authenticated
			r.Use(h.ValidateSession)
			// check xsrf token for all api calls
			r.Use(h.ValidateXSRFToken)

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
