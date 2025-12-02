// customvalidators provides custom validation rules to use with go validator
package customvalidators

import (
	"fmt"
	"reflect"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/goware/emailx"
)

type Validator struct {
	validate *validator.Validate
	err      error
}

func New() *Validator {
	return &Validator{validate: validator.New()}
}

func (r *Validator) RegisterValidation(tag string, fn validator.Func, callValidationEvenIfNull ...bool) {
	if r.err != nil {
		return
	}

	r.err = r.validate.RegisterValidation(tag, fn, callValidationEvenIfNull...)
}

func (r *Validator) Err() error {
	return r.err
}

func (r *Validator) Validate() *validator.Validate {
	return r.validate
}

func RegExp(str string) validator.Func {
	valid := regexp.MustCompile(str)

	return func(fl validator.FieldLevel) bool {
		field := fl.Field()

		if field.Kind() == reflect.String {
			return valid.MatchString(field.String())
		}

		panic(fmt.Sprintf("RegExp(): bad field type %T", field.Interface()))
	}
}

func Email(fl validator.FieldLevel) bool {
	field := fl.Field()

	if field.Kind() == reflect.String {
		if err := emailx.Validate(field.String()); err != nil {
			return false
		}

		return true
	}

	panic(fmt.Sprintf("Email(): bad field type %T", field.Interface()))
}
