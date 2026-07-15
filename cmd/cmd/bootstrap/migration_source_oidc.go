//go:build !passwordApp

package main

// migrationSource returns the source(s) for schema migration scripts
func migrationSource() []string {
	return []string{"file://schema/migrations"}
}

// bootstrapDataPathEnv returns the environment variable that specifies the path to the bootstrap data directory
func bootstrapDataPathEnv() string {
	return "APP_OIDC_BOOTSTRAP_DATA_PATH"
}
