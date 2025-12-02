package customvalidators

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

func TestValidator_RegisterValidation(t *testing.T) {
	r := New()
	type args struct {
		tag                      string
		fn                       validator.Func
		callValidationEvenIfNull []bool
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "valid",
			args: args{
				tag: "email",
				fn:  Email,
			},
		},
		{
			name: "invalid 1",
			args: args{
				tag: "",
				fn:  Email,
			},
			wantErr: true,
		},
		{
			name: "invalid 2",
			args: args{
				tag: "email2",
				fn:  nil,
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r.RegisterValidation(tt.args.tag, tt.args.fn, tt.args.callValidationEvenIfNull...)
			if err := r.Err(); (err != nil) != tt.wantErr {
				t.Fatalf("Validator.Err() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestRegExp(t *testing.T) {
	t.Parallel()

	v := New()
	v.RegisterValidation("regexp", RegExp("^(one|two)$"))
	if err := v.Err(); err != nil {
		t.Fatalf("failed to register RegExp()")
	}

	type args struct {
		value interface{}
	}
	tests := []struct {
		name      string
		args      args
		wantErr   bool
		wantPanic bool
	}{
		{
			name: "valid",
			args: args{
				value: struct {
					Value1 string `validate:"regexp"`
					Value2 string `validate:"regexp"`
				}{
					Value1: "one",
					Value2: "two",
				},
			},
		},
		{
			name: "not valid 1",
			args: args{
				value: struct {
					Value1 string `validate:"regexp"`
				}{
					Value1: "one ",
				},
			},
			wantErr: true,
		},
		{
			name: "not valid 2",
			args: args{
				value: struct {
					Value1 string `validate:"regexp"`
				}{
					Value1: " one",
				},
			},
			wantErr: true,
		},
		{
			name: "panic",
			args: args{
				value: struct {
					Value1 int `validate:"regexp"`
				}{
					Value1: 9,
				},
			},
			wantPanic: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			defer func() {
				if r := recover(); (r != nil) != tt.wantPanic {
					t.Errorf("panic = %v, wantPanic %v", r, tt.wantPanic)
				}
			}()
			if err := v.Validate().Struct(tt.args.value); (err != nil) != tt.wantErr {
				t.Fatalf("Validator.Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEmail(t *testing.T) {
	t.Parallel()

	v := New()
	v.RegisterValidation("email", Email)
	if err := v.Err(); err != nil {
		t.Fatalf("failed to register Email")
	}

	type args struct {
		value interface{}
	}
	tests := []struct {
		name      string
		args      args
		wantErr   bool
		wantPanic bool
	}{
		{
			name: "valid",
			args: args{
				value: struct {
					Email string `validate:"email"`
				}{
					Email: "user@gmail.com",
				},
			},
		},
		{
			name: "not valid 1",
			args: args{
				value: struct {
					Email string `validate:"email"`
				}{
					Email: "user",
				},
			},
			wantErr: true,
		},
		{
			name: "panic",
			args: args{
				value: struct {
					Email int `validate:"email"`
				}{
					Email: 9,
				},
			},
			wantPanic: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			defer func() {
				if r := recover(); (r != nil) != tt.wantPanic {
					t.Errorf("panic = %v, wantPanic %v", r, tt.wantPanic)
				}
			}()
			if err := v.Validate().Struct(tt.args.value); (err != nil) != tt.wantErr {
				t.Fatalf("Validator.Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
