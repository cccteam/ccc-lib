package computedresources

import (
	"context"
	"iter"

	"github.com/cccteam/ccc"
	"github.com/cccteam/ccc/accesstypes"
	"github.com/cccteam/ccc/resource"
)

/*
	An example Computed Resource. A Computed Resource must satisfy the interface in `comp_iface.go`.
	The code generator assumes a Read and List function is provided for each Computed Resource,
	unless the handler is suppressed with a comment annotation e.g. `@suppress(listHandler)`.
*/

// Fetches the current temperature for all Persons' Addresses who are linked to a given loan by a given association type
type (
	// @computed
	Weather struct {
		LoanID          ccc.UUID // @primarykey
		PersonAddressID ccc.UUID
		Temperature     float32 `conditions:"pii"`
	}
)

func (w Weather) Resource() accesstypes.Resource {
	return "Weathers"
}

// The code generator expects the function ReadWeather because its handler is not suppressed on the Weather struct above.
func ReadWeather(ctx context.Context, loanID ccc.UUID, querySet *resource.QuerySet[Weather], txn resource.ReadOnlyTransaction, client *Client) (*Weather, error) {
	return nil, nil
}

func ListWeather(ctx context.Context, querySet *resource.QuerySet[Weather], txn resource.ReadOnlyTransaction, _ *Client) iter.Seq2[*Weather, error] {
	return func(yield func(*Weather, error) bool) {
		w := &Weather{}
		if !yield(w, nil) {
			return
		}
	}
}
