// package routerpasswordauth handles wiring up the routes to handlers and the middleware in between.
package routerpasswordauth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	mock_router "github.com/cccteam/demo-app/pkg/mock/mock_router_password_auth"
	"github.com/go-chi/chi/v5"
	"go.uber.org/mock/gomock"
)

func TestNew(t *testing.T) {
	t.Parallel()

	type testDef struct {
		url            string
		method         string
		wantError      bool
		wantHandler    string
		wantParameters map[string]string
		wantMiddleware map[string]int
	}

	tests := []testDef{
		{
			url: "/does/not/exist/get", method: http.MethodGet,
			wantHandler:    "Assets",
			wantMiddleware: map[string]int{"Logger": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "DeepLink": 1},
		},
		{
			url: "/does/not/exist/post", method: http.MethodPost,
			wantMiddleware: map[string]int{"Logger": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
			wantError:      true,
		},
		{
			url: "/does/not/exist/patch", method: http.MethodPatch,
			wantMiddleware: map[string]int{"Logger": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
			wantError:      true,
		},
		{
			url: "/does/not/exist/delete", method: http.MethodDelete,
			wantMiddleware: map[string]int{"Logger": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
			wantError:      true,
		},
		{
			url: "/does/not/exist/put", method: http.MethodPut,
			wantMiddleware: map[string]int{"Logger": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
			wantError:      true,
		},
		{
			url: "/api/not/exist/put", method: http.MethodGet,
			wantMiddleware: map[string]int{"Logger": 1, "NoCaching": 1, "CompressionMiddleware": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
			wantError:      true,
		},
		{
			url: "/api/user/session", method: http.MethodGet,
			wantHandler:    "Session.Authenticated",
			wantMiddleware: map[string]int{"Logger": 1, "NoCaching": 1, "CompressionMiddleware": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
		},
		{
			url: "/api/user/session", method: http.MethodPost,
			wantHandler:    "Login",
			wantMiddleware: map[string]int{"Logger": 1, "NoCaching": 1, "CompressionMiddleware": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
		},
		{
			url: "/api/user/session", method: http.MethodDelete,
			wantHandler:    "Session.Logout",
			wantMiddleware: map[string]int{"Logger": 1, "NoCaching": 1, "CompressionMiddleware": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1},
		},
	}
	for _, r := range generatedRouterTests() {
		tests = append(tests, testDef{
			url:            r.url,
			method:         r.method,
			wantHandler:    r.handlerFunc,
			wantParameters: r.parameters,
			wantMiddleware: map[string]int{"Logger": 1, "NoCaching": 1, "CompressionMiddleware": 1, "WithParamsHTTP": 1, "SecurityHeaders": 1, "Session.StartSession": 1, "Session.SetXSRFToken": 1, "Session.ValidateXSRFToken": 1, "Session.ValidateSession": 1},
		})
	}
	for _, tt := range tests {
		t.Run(tt.method+"-url"+strings.ReplaceAll(tt.url, "/", "-"), func(t *testing.T) {
			t.Parallel()

			rec := newCallRecorder()
			ctrl := gomock.NewController(t)
			handlers := mock_router.NewMockHandlers(ctrl)
			session := mock_router.NewMockPasswordAuthHandlers(ctrl)
			e := handlers.EXPECT()
			s := session.EXPECT()

			// Middleware. Will be called for multiple handlers, no need to track exact count.
			e.LoggerMiddleware().MinTimes(1).Return(rec.RecordMiddlewareCall("Logger"))
			e.NoCaching(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("NoCaching"))
			e.CompressionMiddleware().Times(1).Return(rec.RecordMiddlewareCall("CompressionMiddleware"))
			e.WithParamsHTTP().MinTimes(1).Return(rec.RecordMiddlewareCall("WithParamsHTTP"))
			e.SecurityHeaders(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("SecurityHeaders"))
			e.DeepLink(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("DeepLink"))

			// Session middleware
			e.Session().AnyTimes().Return(session)
			s.StartSession(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("Session.StartSession"))
			s.SetXSRFToken(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("Session.SetXSRFToken"))
			s.ValidateXSRFToken(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("Session.ValidateXSRFToken"))
			s.ValidateSession(gomock.Any()).MinTimes(1).DoAndReturn(rec.RecordMiddlewareCall("Session.ValidateSession"))

			// session routes
			s.Authenticated().Times(1).Return(rec.RecordHandlerCall("Session.Authenticated"))
			s.Logout().Times(1).Return(rec.RecordHandlerCall("Session.Logout"))

			// client routes
			e.Login().Times(1).Return(rec.RecordHandlerCall("Login"))

			// generated recorder calls
			generatedExpectCalls(e, rec)

			// Angular app assets
			e.Assets().Times(1).Return(rec.RecordHandlerCall("Assets"))

			// // -------------------

			got := New(handlers)

			ctx, cancel := context.WithCancel(context.Background())
			req, err := http.NewRequestWithContext(ctx, tt.method, tt.url, http.NoBody)
			if err != nil {
				t.Fatal(err)
			}
			defer cancel()

			rr := httptest.NewRecorder()
			got.ServeHTTP(rr, req)

			if tt.wantError && rr.Code == http.StatusOK {
				t.Error("expected error but did not receive one")
			}

			if tt.wantError {
				return
			}

			if got := rr.Code; got != http.StatusOK {
				t.Errorf("response.Code = %v, want %v", got, http.StatusOK)
			}

			if cnt := len(rec.handlers); cnt != 1 {
				t.Fatalf("expected %d handlers calls, got: %v", 1, rec.handlers)
			}
			if cnt := rec.handlers[tt.wantHandler]; cnt != 1 {
				t.Fatalf("handlers %s, expected %d call, got: %d", tt.wantHandler, 1, cnt)
			}

			if cnt := len(tt.wantMiddleware); cnt != rec.MiddlewareCount() {
				t.Fatalf("expected %d middleware calls, got: %#v", cnt, rec.middlewares)
			}

			for m, c := range tt.wantMiddleware {
				if cnt := rec.MiddlewareCallCount(m); cnt != c {
					t.Fatalf("middleware %s, expected %d call, got: %d", m, c, cnt)
				}
			}

			for key, value := range tt.wantParameters {
				if got := rec.Parameter(tt.wantHandler, key); got != value {
					t.Fatalf("%s = %s, expected %s", key, got, value)
				}
			}
		})
	}
}

type callRecorder struct {
	handlers       map[string]int
	wantParameters map[string]map[string]string
	middlewares    map[string]int
}

func newCallRecorder() *callRecorder {
	return &callRecorder{
		handlers:       make(map[string]int),
		wantParameters: make(map[string]map[string]string),
		middlewares:    make(map[string]int),
	}
}

func (rec *callRecorder) RecordHandlerCall(name string) http.HandlerFunc {
	return func(_ http.ResponseWriter, r *http.Request) {
		keys := generatedRouteParameters()
		for _, key := range keys {
			if value := chi.URLParam(r, key); value != "" {
				if _, found := rec.wantParameters[name]; !found {
					rec.wantParameters[name] = make(map[string]string)
				}
				rec.wantParameters[name][key] = value
			}
		}

		rec.handlers[name]++
	}
}

func (rec *callRecorder) RecordMiddlewareCall(name string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rec.middlewares[name]++
			next.ServeHTTP(w, r)
		})
	}
}

func (rec *callRecorder) MiddlewareCount() int {
	return len(rec.middlewares)
}

func (rec *callRecorder) MiddlewareCallCount(name string) int {
	return rec.middlewares[name]
}

func (rec *callRecorder) Parameter(name, key string) string {
	if _, ok := rec.wantParameters[name]; !ok {
		return ""
	}

	return rec.wantParameters[name][key]
}
