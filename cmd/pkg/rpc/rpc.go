// Package rpc define RPC Methods, wiring them up to implementation code. The generator uses this to generate handlers for RPC endpoints.
package rpc

import (
	"github.com/cccteam/access"
)

type Client struct {
	userManager access.UserManager
}

func NewClient(userManager access.UserManager) *Client {
	return &Client{
		userManager: userManager,
	}
}
