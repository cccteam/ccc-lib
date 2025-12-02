// package main implements bootstrapping of the database in a spanner emulator for development purposes
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/cccteam/access"
	"github.com/cccteam/ccc/resource"
	initiator "github.com/cccteam/db-initiator"
	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/pkg/config"
	"github.com/cccteam/demo-app/pkg/router"
	"github.com/cccteam/httpio"
	"github.com/cccteam/session"
	"github.com/go-playground/errors/v5"
	"github.com/jtwatson/shutdown"
)

func main() {
	if err := Main(); err != nil {
		log.Fatal(err)
	}
}

func Main() error {
	ctx, cancel := shutdown.CaptureInterrupts(context.Background())
	defer cancel()

	conf, err := config.NewCliConfiguration(ctx)
	if err != nil {
		return errors.Wrap(err, "failed to initialize config")
	}
	defer conf.Close()

	a := &app.App{
		OIDCAzureSession:   session.NewOIDCAzure(nil, nil, nil, httpio.Log, nil, 0),
		ResourceCollection: resource.NewCollection(),
	}

	router.New(a)

	db, err := bootstrapInstanceWithSchema(ctx, conf)
	if err != nil {
		return errors.Wrap(err, "bootstrapInstanceWithSchema()")
	}
	defer db.Close()

	roleConfig, err := parseJSONFile(os.Getenv("APP_BOOTSTRAP_ROLE_PATH"))
	if err != nil {
		return errors.Wrap(err, "readJSONFile()")
	}

	if err := access.MigrateRoles(ctx, conf.Access().UserManager(), a.ResourceCollection, roleConfig); err != nil {
		return errors.Wrap(err, "deployment.MigrateRoles()")
	}

	if err := bootstrapData(db); err != nil {
		return errors.Wrap(err, "bootstrapData()")
	}

	return nil
}

func bootstrapInstanceWithSchema(ctx context.Context, conf *config.CliConfiguration) (*initiator.SpannerDB, error) {
	if err := initiator.NewSpannerInstance(ctx, conf.SpannerProjectID(), conf.SpannerInstanceID()); err != nil {
		return nil, errors.Wrapf(err, "failed to create instance %s", conf.SpannerInstanceID())
	}
	fmt.Printf("Created Instance %s\n", conf.SpannerInstanceID())

	db, err := initiator.NewSpannerDatabase(ctx, conf.SpannerProjectID(), conf.SpannerInstanceID(), conf.SpannerDatabaseName())
	if err != nil {
		return nil, errors.Wrapf(err, "failed to create database %s", conf.SpannerDatabaseName())
	}

	fmt.Printf("Created Database %s\n", conf.SpannerDatabaseName())

	if err := db.MigrateUp("file://schema/migrations"); err != nil {
		return nil, errors.Wrap(err, "failed to create schema")
	}
	fmt.Println("Created Schema")

	return db, nil
}

func bootstrapData(db *initiator.SpannerDB) error {
	path := os.Getenv("APP_BOOTSTRAP_DATA_PATH")
	if path == "" {
		return nil
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return errors.Wrap(err, "failed to get absolute path")
	}

	if _, err := os.Stat(absPath); err != nil {
		return errors.Wrapf(err, "bootstrap directory does not exist: %s", absPath)
	}

	begin := time.Now()
	if err := db.MigrateUp("file://" + absPath); err != nil {
		return errors.Wrap(err, "failed to create schema")
	}
	fmt.Printf("Completed data load in %s\n", time.Since(begin))

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
