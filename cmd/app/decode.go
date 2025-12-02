package app

import (
	"github.com/cccteam/ccc/accesstypes"
	"github.com/cccteam/ccc/resource"
	"github.com/cccteam/demo-app/pkg/rpc"
)

func NewQueryDecoder[Resource Resourcer, Request any](a *App, permissions ...accesstypes.Permission) *resource.QueryDecoder[Resource, Request] {
	rSet, err := resource.NewSet[Resource, Request](permissions...)
	if err != nil {
		panic(err)
	}

	if err := resource.AddResources(a.ResourceCollection, accesstypes.GlobalPermissionScope, rSet); err != nil {
		panic(err)
	}

	decoder, err := resource.NewQueryDecoder[Resource, Request](rSet)
	if err != nil {
		panic(err)
	}

	return decoder
}

func NewDecoder[Resource Resourcer, Request any](a *App, permissions ...accesstypes.Permission) *resource.Decoder[Resource, Request] {
	rSet, err := resource.NewSet[Resource, Request](permissions...)
	if err != nil {
		panic(err)
	}

	if err := resource.AddResources(a.ResourceCollection, accesstypes.GlobalPermissionScope, rSet); err != nil {
		panic(err)
	}

	decoder, err := resource.NewDecoder[Resource, Request](rSet)
	if err != nil {
		panic(err)
	}

	return decoder.WithValidator(a.validate)
}

func NewRPCDecoder[Method rpc.Method, Request any](a *App, perm accesstypes.Permission) *resource.RPCDecoder[Request] {
	var method Method
	res := method.Method()

	if err := a.ResourceCollection.AddMethodResource(accesstypes.GlobalPermissionScope, perm, res); err != nil {
		panic(err)
	}

	decoder, err := resource.NewRPCDecoder[Request](a.UserPermissions, res, perm)
	if err != nil {
		panic(err)
	}

	return decoder.WithValidator(a.validate)
}
