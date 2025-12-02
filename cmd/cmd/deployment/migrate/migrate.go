// migrate is the entrypoint for initiating a migration
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/cccteam/access"
	"github.com/cccteam/ccc/resource"
	initiator "github.com/cccteam/db-initiator"
	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/pkg/config"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/httpio"
	"github.com/cccteam/session"
	"github.com/go-playground/errors/v5"
	"github.com/golang-migrate/migrate/v4"
)

func main() {
	if err := Main(); err != nil {
		log.Fatal(err)
	}
}

func Main() error {
	ctx := context.Background()
	systemConfig, err := config.NewCliConfiguration(ctx)
	if err != nil {
		return errors.Wrap(err, "config.New()")
	}

	if err := runMigrations(ctx, systemConfig); err != nil {
		return err
	}

	a := &app.App{
		OIDCAzureSession:   session.NewOIDCAzure(nil, nil, nil, httpio.Log, nil, 0),
		ResourceCollection: resource.NewCollection(),
	}

	router.New(a)

	roleConfig, err := parseJSONFile(os.Getenv("APP_BOOTSTRAP_ROLE_PATH"))
	if err != nil {
		return err
	}

	if err := access.MigrateRoles(ctx, systemConfig.Access().UserManager(), a.ResourceCollection, roleConfig); err != nil {
		return errors.Wrap(err, "deployment.MigrateRoles()")
	}

	return nil
}

func runMigrations(ctx context.Context, conf *config.CliConfiguration) error {
	db, err := initiator.ConnectToSpanner(ctx, conf.SpannerProjectID(), conf.SpannerInstanceID(), conf.SpannerDatabaseName())
	if err != nil {
		return errors.Wrapf(err, "failed to connect to database %s", conf.SpannerDatabaseName())
	}
	defer db.Close()

	fmt.Printf("Connected to Database %s\n", conf.SpannerDatabaseName())

	if err := db.MigrateUp("file://schema/migrations"); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return errors.Wrap(err, "failed to failed to run migrations")
	} else if errors.Is(err, migrate.ErrNoChange) {
		fmt.Println("No new Migration scripts found. No changes applied.")
	} else {
		fmt.Println("Ran migration successful")
	}

	return nil
}

func parseJSONFile(filename string) (*access.RoleConfig, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, errors.Wrapf(err, "os.OpenFile(%q)", filename)
	}
	defer file.Close()

	var roleConfig access.RoleConfig
	if err = json.NewDecoder(file).Decode(&roleConfig); err != nil {
		return nil, errors.Wrap(err, "decoder.Decode()")
	}

	return &roleConfig, nil
}
