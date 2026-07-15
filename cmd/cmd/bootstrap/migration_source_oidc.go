//go:build !passwordApp

package main

// migrationSource returns the source(s) for schema migration scripts
func migrationSource() []string {
	return []string{"file://schema/migrations"}
}

// bootstrapDataSource returns the source(s) for post-migration bootstrap data scripts
func bootstrapDataSource() []string {
	return []string{"file://schema/bootstrap"}
}
