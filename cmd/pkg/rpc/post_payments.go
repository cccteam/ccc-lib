// package rpc defined actions for rpc methods
package rpc

import (
	"context"
	"fmt"
	"time"

	"github.com/cccteam/ccc"
	"github.com/cccteam/ccc/accesstypes"
	"github.com/cccteam/ccc/resource"
	"github.com/shopspring/decimal"
)

type (
	// @rpc
	PostPayments struct {
		PersonID string
		Payments []Payment
		ID       ccc.UUID
	}
)

func (PostPayments) Method() accesstypes.Resource {
	return "PostPayments"
}

func (p *PostPayments) Execute(ctx context.Context, db resource.Client, _ *Client) error {
	ctx, span := ccc.StartTrace(ctx)
	defer span.End()

	_ = db.ExecuteFunc(ctx, func(ctx context.Context, txn resource.ReadWriteTransaction) error {
		_ = ctx
		_ = txn

		return nil
	})

	_ = db.ExecuteFunc(ctx, p.Execute2)

	fmt.Println("Called PostPayments.Execute()")

	return nil
}

func (p *PostPayments) Execute2(ctx context.Context, txn resource.ReadWriteTransaction) error {
	_ = ctx
	_ = txn

	fmt.Println("Called PostPayments.Execute2()")

	return nil
}

type Payment struct {
	Date   time.Time
	Amount decimal.Decimal
	Note   string
}
