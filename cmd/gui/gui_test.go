package gui

import (
	"context"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func TestAssets(t *testing.T) {
	t.Parallel()

	type args struct {
		assetsDir string
		assetURL  string
	}
	tests := []struct {
		name    string
		args    args
		want    int
		wantErr bool
	}{
		{name: "found", args: args{assetsDir: "testdata", assetURL: "placeholder.txt"}, want: 200},
		{name: "missing", args: args{assetsDir: "testdata", assetURL: "missing.txt"}, want: 404},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			assets := Assets(tt.args.assetsDir)
			w := httptest.NewRecorder()
			r, err := http.NewRequestWithContext(context.TODO(), "GET", tt.args.assetURL, http.NoBody)
			if (err != nil) != tt.wantErr {
				t.Fatalf("http.NewRequest() error = %v, wantErr %v", err, tt.wantErr)
			}
			assets.ServeHTTP(w, r)
			if got := w.Code; !reflect.DeepEqual(got, tt.want) {
				t.Errorf("http response code = %v, want %v", got, tt.want)
			}
		})
	}
}
