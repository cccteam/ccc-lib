// main is the entrypoint for the application
package main

import (
	"context"
	"log"

	"github.com/cccteam/demo-app/app"
	"github.com/cccteam/demo-app/pkg/config"
	"github.com/go-playground/errors/v5"
	"github.com/jtwatson/server"
	_ "go.uber.org/mock/mockgen/model"
)

func main() {
	if err := Main(); err != nil {
		log.Fatal(err)
	}
}

func Main() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	conf, err := config.New(ctx)
	if err != nil {
		return errors.Wrap(err, "failed to get config")
	}
	defer conf.Close()

	if err := server.New(conf.Addr()).Start(ctx, app.New(conf)); err != nil {
		return errors.Wrap(err, "server exited unexpectedly")
	}

	return nil
}
