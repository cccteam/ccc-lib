package spanner

import (
	"context"
	"reflect"
	"testing"
)

func TestClient_DomainExists(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name      string
		domainID  string
		sourceURL []string
		want      bool
		wantErr   bool
	}{
		{
			name:     "domain will not exist",
			domainID: "domain2",
			want:     false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			c := &Client{}

			got, err := c.DomainExists(ctx, tt.domainID)
			if (err != nil) != tt.wantErr {
				t.Errorf("client.DomainExists() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("client.DomainExists() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestClient_DomainIDs(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name      string
		sourceURL []string
		want      []string
		wantErr   bool
	}{
		{
			name: "success getting domains",
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			c := &Client{}

			got, err := c.DomainIDs(ctx)
			if (err != nil) != tt.wantErr {
				t.Errorf("client.Domains() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("client.Domains() = %v, want %v", got, tt.want)
			}
		})
	}
}
