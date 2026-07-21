// package main implements a code generator for resource types and handlers.
package main

import (
	"context"
	"log"

	"github.com/cccteam/ccc/resource/generation"
)

func main() {
	ctx := context.Background()

	generator, err := generation.NewResourceGenerator(
		ctx,
		"./pkg/resources",
		"file://schema/migrations",
		[]string{
			"cloud.google.com/go/civil",
			"github.com/cccteam/demo-app/pkg/mock/mock_router",
			"github.com/cccteam/demo-app/pkg/resources",
			"github.com/cccteam/demo-app/pkg/router",
			"github.com/cccteam/demo-app/pkg/rpc",
			"github.com/cccteam/demo-app/pkg/spanner",
			"github.com/shopspring/decimal",
		},
		generation.GenerateHandlers("app"),
		generation.GenerateRoutes("pkg/router", "api"),
		generation.WithRPC("pkg/rpc"),
		generation.WithComputedResources("pkg/computedresources"),
		generation.WithConsolidatedHandlers("resources", true),
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
