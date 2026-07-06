package config

import (
	"context"
	"time"

	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/demo-app/pkg/computedresources"
	"github.com/cccteam/demo-app/pkg/rpc"
	"github.com/cccteam/session"
	"github.com/cccteam/session/sessionstorage"
	"github.com/go-playground/errors/v5"
	"github.com/go-playground/validator/v10"
	"github.com/sethvargo/go-envconfig"
)

// PasswordAuthConfiguration holds the application configuration for the password-auth app.
type PasswordAuthConfiguration struct {
	*CliConfiguration
	httpConf       *HTTPConfig
	validator      *validator.Validate
	session        *session.PasswordAuth
	rpcClient      *rpc.Client
	computedClient *computedresources.Client
}

// NewPasswordAuth loads and returns the password-auth application configuration
func NewPasswordAuth(ctx context.Context) (conf *PasswordAuthConfiguration, err error) {
	var envVars passwordAppConfig
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

	validate, err := RegisterValidators()
	if err != nil {
		return nil, err
	}

	d, err := time.ParseDuration(envVars.Options.SessionTimeout)
	if err != nil {
		d = time.Hour
	}

	sess, err := session.NewPasswordAuth(
		sessionstorage.NewSpannerPasswordAuth(cliConfig.cloudSpannerClient),
		envVars.Options.CookieKey,
		session.WithSessionTimeout(d),
		session.WithSessionTableName("PasswordSessions"),
	)
	if err != nil {
		return nil, errors.Wrap(err, "session.NewPasswordAuth()")
	}

	return &PasswordAuthConfiguration{
		CliConfiguration: cliConfig,
		httpConf: &HTTPConfig{
			host: envVars.Host,
			port: envVars.Port,
		},
		validator:      validate,
		session:        sess,
		rpcClient:      rpc.NewClient(cliConfig.Access().UserManager()),
		computedClient: computedresources.NewClient(),
	}, nil
}

// Addr returns an http address
//
//	"hostname:port"
func (c *PasswordAuthConfiguration) Addr() string {
	return c.httpConf.host + ":" + c.httpConf.port
}

// Session returns a reference to the password auth session management client
func (c *PasswordAuthConfiguration) Session() *session.PasswordAuth {
	return c.session
}

// RPCClient returns a reference to the RPC dependencies client
func (c *PasswordAuthConfiguration) RPCClient() *rpc.Client {
	return c.rpcClient
}

// ComputedClient returns a reference to the Computed Resources dependencies client
func (c *PasswordAuthConfiguration) ComputedClient() *computedresources.Client {
	return c.computedClient
}

// Validator returns a reference to a data validator
func (c *PasswordAuthConfiguration) Validator() *validator.Validate {
	return c.validator
}

func (c *PasswordAuthConfiguration) ResourceCollection() *resource.Collection {
	return resource.NewCollection()
}

// passwordAppConfig holds the environment vars used only in the password-auth app
type passwordAppConfig struct {
	// Host is the hostname of the application server
	Host string `env:"APP_HOST"`

	// Port is the port the web server is running on
	Port string `env:"APP_PORT,default=8080"`

	Options Options
}
