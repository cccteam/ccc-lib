// spanner provides our data storage API backed by Google Cloud Spanner
package spanner

const name = "github.com/cccteam/demo-app/pkg/spanner"

type Client struct{}

func New() *Client {
	return &Client{}
}
