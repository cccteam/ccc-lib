package resources

import "github.com/cccteam/ccc"

type (
	// @resource
	User struct {
		Id       ccc.UUID `spanner:"Id"`
		Username string   `spanner:"Username"`
	}
)
