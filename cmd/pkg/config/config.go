// config supports loading application configuration.
package config

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	cloudspanner "cloud.google.com/go/spanner"
	"github.com/cccteam/access"
	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/demo-app/pkg/computedresources"
	"github.com/cccteam/demo-app/pkg/customvalidators"
	"github.com/cccteam/demo-app/pkg/rpc"
	"github.com/cccteam/demo-app/pkg/spanner"
	"github.com/cccteam/httpio"
	"github.com/cccteam/session"
	"github.com/cccteam/session/oidc"
	"github.com/go-playground/errors/v5"
	"github.com/go-playground/validator/v10"
	"github.com/gorilla/securecookie"
	"github.com/sethvargo/go-envconfig"
	"golang.org/x/crypto/pbkdf2"
)

type CliConfiguration struct {
	cloudSpannerClient *cloudspanner.Client
	resourceClient     *resource.SpannerClient
	access             *access.Client
	spannerConn        *spanner.ConnectionSettings
	baseConfig         cliConfig
}

func NewCliConfiguration(ctx context.Context) (*CliConfiguration, error) {
	var envVars cliConfig
	if err := envconfig.ProcessWith(ctx, &envconfig.Config{
		Target:   &envVars,
		Lookuper: envconfig.OsLookuper(),
	}); err != nil {
		return nil, errors.Wrap(err, "envconfig.ProcessWith()")
	}

	spannerConn := &spanner.ConnectionSettings{
		ProjectID:    envVars.Spanner.ProjectID,
		InstanceID:   envVars.Spanner.InstanceID,
		DatabaseName: envVars.Spanner.DatabaseName,
	}

	cloudSpannerClient, err := cloudspanner.NewClient(ctx, spannerConn.DBName())
	if err != nil {
		return nil, errors.Wrapf(err, "spanner.NewClient()")
	}
	accessClient, err := access.New(spanner.New(), access.NewSpannerAdapter(spannerConn.DBName(), "AccessPolicies"))
	if err != nil {
		return nil, errors.Wrap(err, "access.New()")
	}

	return &CliConfiguration{
		cloudSpannerClient: cloudSpannerClient,
		resourceClient:     resource.NewSpannerClient(cloudSpannerClient),
		access:             accessClient,
		spannerConn:        spannerConn,
		baseConfig:         envVars,
	}, nil
}

// Close handles cleaning up resources
func (c *CliConfiguration) Close() {
	c.cloudSpannerClient.Close()
}

// ResourceClient returns a resource client
func (c *CliConfiguration) ResourceClient() resource.Client {
	return c.resourceClient
}

// Access returns a reference to the access management client
func (c *CliConfiguration) Access() access.Controller {
	return c.access
}

func (c *CliConfiguration) ProjectID() string {
	return c.baseConfig.ProjectID
}

func (c *CliConfiguration) SpannerProjectID() string {
	return c.baseConfig.Spanner.ProjectID
}

func (c *CliConfiguration) SpannerInstanceID() string {
	return c.baseConfig.Spanner.InstanceID
}

func (c *CliConfiguration) SpannerDatabaseName() string {
	return c.baseConfig.Spanner.DatabaseName
}

// Configuration holds the application configuration.
type Configuration struct {
	*CliConfiguration
	httpConf       *HTTPConfig
	validator      *validator.Validate
	session        *session.OIDCAzureSession
	rpcClient      *rpc.Client
	computedClient *computedresources.Client
}

// New loads and returns the application configuration
func New(ctx context.Context) (conf *Configuration, err error) {
	var envVars appConfig
	if err := envconfig.ProcessWith(ctx, &envconfig.Config{
		Target:   &envVars,
		Lookuper: envconfig.OsLookuper(),
	}); err != nil {
		return nil, errors.Wrap(err, "envconfig.ProcessWith()")
	}

	cliConfig, err := NewCliConfiguration(ctx)
	if err != nil {
		return nil, err
	}

	secureCookie, err := createSecureCookie(envVars.Options.CookieKey)
	if err != nil {
		return nil, err
	}

	validate, err := RegisterValidators()
	if err != nil {
		return nil, err
	}

	d, err := time.ParseDuration(envVars.Options.SessionTimeout)
	if err != nil {
		d = time.Hour
	}

	return &Configuration{
		CliConfiguration: cliConfig,
		httpConf: &HTTPConfig{
			host: envVars.Host,
			port: envVars.Port,
		},
		validator: validate,
		session: session.NewOIDCAzure(
			oidc.New(secureCookie, envVars.OIDC.IssuerURL, envVars.OIDC.ClientID, envVars.OIDC.ClientSecret, envVars.OIDC.RedirectURL),
			session.NewSpannerOIDCSessionStorage(cliConfig.cloudSpannerClient),
			cliConfig.Access().UserManager(),
			httpio.Log,
			secureCookie,
			d,
		),
		rpcClient:      rpc.NewClient(cliConfig.Access().UserManager()),
		computedClient: computedresources.NewClient(),
	}, nil
}

// Addr returns an http address
//
//	"hostname:port"
func (c *Configuration) Addr() string {
	return c.httpConf.host + ":" + c.httpConf.port
}

// Session returns a reference to the session management client
func (c *Configuration) Session() *session.OIDCAzureSession {
	return c.session
}

// RPCClient returns a reference to the RPC dependencies client
func (c *Configuration) RPCClient() *rpc.Client {
	return c.rpcClient
}

// ComputedClient returns a reference to the Computed Resources dependencies client
func (c *Configuration) ComputedClient() *computedresources.Client {
	return c.computedClient
}

// Validator returns a reference to a data validator
func (c *Configuration) Validator() *validator.Validate {
	return c.validator
}

func (c *Configuration) ResourceCollection() *resource.Collection {
	return resource.NewCollection()
}

func RegisterValidators() (*validator.Validate, error) {
	val := customvalidators.New()

	val.RegisterValidation("name", customvalidators.RegExp("^[a-zA-Z0-9]+$"))
	val.RegisterValidation("email", customvalidators.Email)

	if err := val.Err(); err != nil {
		return nil, errors.Wrap(err, "validator registration failed")
	}

	return val.Validate(), nil
}

func createSecureCookie(cookieKey string) (*securecookie.SecureCookie, error) {
	if cookieKey == "" {
		rKey := securecookie.GenerateRandomKey(96)
		if rKey == nil {
			return nil, errors.New("failed to generate random key")
		}
		cookieKey = base64.StdEncoding.EncodeToString(rKey)

		fmt.Printf("Using random CookieKey: %s\n", cookieKey)
	}

	k, err := base64.StdEncoding.DecodeString(cookieKey)
	if err != nil {
		return nil, errors.Wrap(err, "base64.StdEncoding.DecodeString()")
	}
	if len(k) < 96 {
		return nil, errors.New("CookieKey to short.  Expect minimum of 96 bytes. (128 bytes when base64 encoded)")
	}

	hSaltIndex := int(k[55] % 4)
	hIndex := int(k[7]%4 + 12)
	saltIndex := int(k[73]%4 + 48)
	index := int(k[37]%4 + 60)

	return securecookie.New(
		pbkdf2.Key(k[hIndex:hIndex+32], k[hSaltIndex:hSaltIndex+8], 4356+hIndex*saltIndex, 64, sha256.New),
		pbkdf2.Key(k[index:index+32], k[saltIndex:saltIndex+8], 4491+(hSaltIndex+1)*index, 32, sha256.New),
	), nil
}

type HTTPConfig struct {
	port string
	host string
}

// cliConfig holds the environment vars that are used in the cli and app
type cliConfig struct {
	// ProjectID is the project the application is running in
	ProjectID string `env:"GOOGLE_CLOUD_PROJECT,required"`

	Spanner Spanner
}

// appConfig holds the environment vars used only in the app
type appConfig struct {
	// Host is the hostname of the application server
	Host string `env:"APP_HOST"`

	// Port is the port the web server is running on
	Port string `env:"APP_PORT,default=8080"`

	Options Options
	OIDC    OIDC
}

// Options contains configuration information for miscellaneous options
type Options struct {
	SessionTimeout string `env:"APP_SESSION_TIMEOUT"`
	CookieKey      string `env:"APP_COOKIE_KEY"`
}

type OIDC struct {
	IssuerURL    string `env:"APP_OIDC_ISSUER_URL,required"`
	ClientID     string `env:"APP_OIDC_CLIENT_ID,required"`
	ClientSecret string `env:"APP_OIDC_CLIENT_SECRET,required"`
	RedirectURL  string `env:"APP_OIDC_REDIRECT_URL,required"`
}

type Spanner struct {
	// SpannerProjectID is the project the Spanner database is in
	ProjectID string `env:"GOOGLE_CLOUD_SPANNER_PROJECT,default=$GOOGLE_CLOUD_PROJECT"`

	// SpannerInstanceID is the Spanner Instance ID
	InstanceID string `env:"GOOGLE_CLOUD_SPANNER_INSTANCE_ID,required"`

	// SpannerDatabaseName is the Spanner Database Name
	DatabaseName string `env:"GOOGLE_CLOUD_SPANNER_DATABASE_NAME,required"`
}
