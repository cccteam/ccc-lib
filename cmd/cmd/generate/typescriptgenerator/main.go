// package main implements a code generator for resource typescript permission & metadata.
package main

import (
	"context"
	"log"

	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/ccc/resource/generation"
	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/httpio"
	"github.com/cccteam/session"
)

func main() {
	a := &app.App{
		OIDCAzureSession:   session.NewOIDCAzure(nil, nil, nil, httpio.Log, nil, 0),
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
