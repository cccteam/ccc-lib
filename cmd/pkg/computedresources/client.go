package computedresources

// add any computed resources dependencies here
type Client struct{}

func NewClient() *Client {
	return &Client{}
}
