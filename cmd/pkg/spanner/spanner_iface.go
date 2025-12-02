package spanner

import (
	"context"
)

// DB is the interface for the database methods
type DB interface {
	DomainExists(ctx context.Context, domainID string) (bool, error)
	DomainIDs(ctx context.Context) ([]string, error)
}
