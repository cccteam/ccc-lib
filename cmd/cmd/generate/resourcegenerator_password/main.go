// package main implements a code generator for resource types and handlers.
package main

import (
	"context"
	"log"

	"github.com/cccteam/ccc/resource/generation"
)

func main() {
	ctx := context.Background()

	generatePasswordApp(ctx)
}

func generatePasswordApp(ctx context.Context) {
	passwordAppGenerator, err := generation.NewResourceGenerator(
		ctx,
		"./pkg/resources",
		"file://schema/password_migrations",
		[]string{
			"cloud.google.com/go/civil",
			"github.com/cccteam/demo-app/pkg/mock/mock_router_password_auth",
			"github.com/cccteam/demo-app/pkg/resources",
			"github.com/cccteam/demo-app/pkg/routerpasswordauth",
			"github.com/cccteam/demo-app/pkg/rpc",
			"github.com/cccteam/demo-app/pkg/spanner",
			"github.com/shopspring/decimal",
		},
		generation.GenerateHandlers("apppasswordauth"),
		generation.GenerateRoutes("pkg/routerpasswordauth", "api"),
		generation.WithRPC("pkg/rpc"),
		generation.WithComputedResources("pkg/computedresources"),
		generation.WithConsolidatedHandlers("resources", true),
		generation.WithSpannerEmulatorVersion("1.5.43"),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer passwordAppGenerator.Close()

	if err := passwordAppGenerator.Generate(); err != nil {
		panic(err)
	}
}
