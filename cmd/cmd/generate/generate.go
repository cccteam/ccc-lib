// package generate produces all generated code, including resources, mocks, and cleanup
package generate

//go:generate go run ./resourcegenerator
//go:generate go run -tags=collect_resource_permissions ./typescriptgenerator
//go:generate go run ./mock_cleanup/mock_cleanup.go
//
// mock
//go:generate mockgen -source ../../pkg/router/router.go -destination ../../pkg/mock/mock_router/mock_handlers.go
//go:generate mockgen -destination=../../pkg/mock/mock_resource/mock_read_write_transaction.go github.com/cccteam/ccc/resource ReadWriteTransaction
//go:generate mockgen -destination=../../pkg/mock/mock_resource/mock_reader.go github.com/cccteam/ccc/resource Reader

// //go:generate mockgen -source ../../businesslayer/business_iface.go -destination ../../pkg/mock/mock_businesslayer/mock_business.go
// //go:generate mockgen -source ../../pkg/spanner/spanner_iface.go -destination ../../pkg/mock/mock_spanner/mock_spanner_iface.go
// //go:generate mockgen -source ../../pkg/spanner/types.go -destination ../../pkg/mock/mock_spanner/mock_types.go
// //go:generate mockgen -package=spanner -source=../../pkg/spanner/spanner_iface.go -destination=../../pkg/spanner/mock_spanner_iface.go
