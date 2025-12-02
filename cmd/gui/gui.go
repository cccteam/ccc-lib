// gui serves the static content for the frontend
package gui

import (
	"net/http"
)

// Assets returns a filesystem with our assets
func Assets(path string) http.Handler {
	return http.FileServer(http.Dir(path))
}
