// package main implements a code generator for resource typescript permission & metadata.
package main

import (
	"context"
	"flag"
	"log"

	"github.com/cccteam/access"
	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/ccc/resource/generation"
	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/apppasswordauth"
	"github.com/cccteam/demo-app/pkg/computedresources"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/demo-app/pkg/rpc"
	"github.com/cccteam/session"
	"github.com/go-playground/validator/v10"
)

// passwordAuthGenConfigurer implements apppasswordauth.Configurer with just enough
// wired up to register routes and populate a ResourceCollection for generation.
type passwordAuthGenConfigurer struct {
	resourceCollection *resource.Collection
	pwdSession         *session.PasswordAuth
}

func (c *passwordAuthGenConfigurer) Access() access.Controller       { return nil }
func (c *passwordAuthGenConfigurer) ResourceClient() resource.Client { return nil }
func (c *passwordAuthGenConfigurer) ResourceCollection() *resource.Collection {
	return c.resourceCollection
}
func (c *passwordAuthGenConfigurer) Session() *session.PasswordAuth { return c.pwdSession }
func (c *passwordAuthGenConfigurer) RPCClient() *rpc.Client         { return nil }
func (c *passwordAuthGenConfigurer) ComputedClient() *computedresources.Client {
	return nil
}
func (c *passwordAuthGenConfigurer) Validator() *validator.Validate { return nil }

func main() {
	password := flag.Bool("password", false, "generate typescript for the password-auth showcase app instead of the OIDC showcase app")
	flag.Parse()

	ctx := context.Background()

	if *password {
		generatePasswordApp(ctx)
		return
	}

	generateApp(ctx)
}

func generateApp(ctx context.Context) {
	oidcSession, err := session.NewOIDCAzure(nil, nil, "", "", "", "", "")
	if err != nil {
		log.Fatal(err)
	}

	a := &app.App{
		OIDCAzure:          oidcSession,
		ResourceCollection: resource.NewCollection(),
	}
	router.New(a)

	generator, err := generation.NewTypescriptGenerator(
		ctx,
		"./pkg/resources",
		"file://schema/migrations",
		"../projects/showcase-app/src/app/core/generated",
		a.ResourceCollection,
		generation.GenerateMetadata(),
		generation.GeneratePermissions(),
		generation.GenerateEnums(),
		generation.WithRPC("pkg/rpc"),
		generation.WithComputedResources("pkg/computedresources"),
		generation.WithTypescriptOverrides(map[string]string{
			"resources.Attachment": "CustomTypes.Attachment[]",
		}),
		generation.WithSpannerEmulatorVersion("1.5.43"),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer generator.Close()

	if err := generator.Generate(); err != nil {
		panic(err)
	}
}

func generatePasswordApp(ctx context.Context) {
	pwdSession, err := session.NewPasswordAuth(nil, "")
	if err != nil {
		log.Fatal(err)
	}

	passwordApp := apppasswordauth.New(&passwordAuthGenConfigurer{
		resourceCollection: resource.NewCollection(),
		pwdSession:         pwdSession,
	})

	passwordGenerator, err := generation.NewTypescriptGenerator(
		ctx,
		"./pkg/resources",
		"file://schema/password_migrations",
		"../projects/showcase-app-password/src/app/core/generated",
		passwordApp.ResourceCollection,
		generation.GenerateMetadata(),
		generation.GeneratePermissions(),
		generation.GenerateEnums(),
		generation.WithRPC("pkg/rpc"),
		generation.WithComputedResources("pkg/computedresources"),
		generation.WithTypescriptOverrides(map[string]string{
			"resources.Attachment": "CustomTypes.Attachment[]",
		}),
		generation.WithSpannerEmulatorVersion("1.5.43"),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer passwordGenerator.Close()

	if err := passwordGenerator.Generate(); err != nil {
		panic(err)
	}
}
