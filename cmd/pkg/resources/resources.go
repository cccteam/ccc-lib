// package resources provides the resource types for the application
package resources

import (
	"github.com/cccteam/ccc/resource"
)

func defaultConfig() resource.Config {
	return resource.Config{
		ChangeTrackingTable: "DataChangeEvents",
		TrackChanges:        true,
	}
}
