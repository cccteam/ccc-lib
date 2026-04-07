// package main implements a code generator for resource typescript permission & metadata.
package main

import (
	"context"
	"log"

	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/ccc/resource/generation"
	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/session"
)

func main() {
	oidcSession, err := session.NewOIDCAzure(nil, nil, "", "", "", "", "")
	if err != nil {
		log.Fatal(err)
	}

	a := &app.App{
		OIDCAzure:          oidcSession,
		ResourceCollection: resource.NewCollection(),
	}
	router.New(a)

	ctx := context.Background()

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
			"resources.Attachment": "customtypes.attachment[]",
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
