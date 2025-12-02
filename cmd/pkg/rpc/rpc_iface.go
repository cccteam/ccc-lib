package rpc

import (
	"context"

	"github.com/cccteam/ccc/accesstypes"
	"github.com/cccteam/ccc/resource"
)

type TxnRunner interface {
	Method() accesstypes.Resource
	Execute(ctx context.Context, txn resource.ReadWriteTransaction, client *Client) error
}

type DBRunner interface {
	Method() accesstypes.Resource
	Execute(ctx context.Context, db resource.Client, client *Client) error
}
