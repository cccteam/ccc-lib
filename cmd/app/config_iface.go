package app

import (
	"github.com/cccteam/access"
	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/demo-app/pkg/computedresources"
	"github.com/cccteam/demo-app/pkg/rpc"
	"github.com/cccteam/session"
	"github.com/go-playground/validator/v10"
)

// Configurer is the interface that is need to setup a server
type Configurer interface {
	Access() access.Controller
	ResourceClient() resource.Client
	ResourceCollection() *resource.Collection
	Session() *session.OIDCAzureSession
	RPCClient() *rpc.Client
	ComputedClient() *computedresources.Client
	Validator() *validator.Validate
}
