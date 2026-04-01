package resources

import (
	"encoding/json"
	"fmt"

	"cloud.google.com/go/spanner"
	"github.com/cccteam/ccc"
)

type (
	Attachment struct {
		Title       string `json:"title"`
		URL         string `json:"url"`
		ContentType string `json:"contentType"`
	}

	Attachments []Attachment

	// @resource
	User struct {
		Id          ccc.UUID    `spanner:"Id"`
		Username    string      `spanner:"Username"`
		Attachments Attachments `spanner:"Attachments"`
	}
)

func (a *Attachments) DecodeSpanner(val interface{}) error {
	strVal, ok := val.(string)
	if !ok {
		return fmt.Errorf("failed to decode Attachments: expected string, got %T", val)
	}

	return json.Unmarshal([]byte(strVal), a)
}

func (a Attachments) EncodeSpanner() (interface{}, error) {
	return spanner.NullJSON{Value: a, Valid: true}, nil
}
