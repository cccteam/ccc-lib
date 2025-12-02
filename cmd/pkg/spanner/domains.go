package spanner

import (
	"context"

	"go.opentelemetry.io/otel"
)

// DomainExists returns true if domain ID exists.
func (c *Client) DomainExists(ctx context.Context, _ string) (bool, error) {
	_, span := otel.Tracer(name).Start(ctx, "client.DomainExists()")
	defer span.End()

	return false, nil
}

// DomainIDs returns a full list of the application domains.
func (c *Client) DomainIDs(ctx context.Context) ([]string, error) {
	_, span := otel.Tracer(name).Start(ctx, "client.Domains()")
	defer span.End()

	return nil, nil
}
