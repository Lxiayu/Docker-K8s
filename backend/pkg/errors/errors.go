package errors

import "fmt"

type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("code: %d, message: %s", e.Code, e.Message)
}

func NewAppError(code int, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
	}
}

var (
	ErrUserNotFound     = NewAppError(1001, "user not found")
	ErrUserAlreadyExist = NewAppError(1002, "user already exists")
	ErrInvalidPassword  = NewAppError(1003, "invalid password")
	ErrInvalidToken     = NewAppError(1004, "invalid token")
	ErrUnauthorized     = NewAppError(1005, "unauthorized")
	ErrForbidden        = NewAppError(1006, "forbidden")

	ErrPipelineNotFound = NewAppError(2001, "pipeline not found")
	ErrBuildFailed      = NewAppError(2002, "build failed")
	ErrDeployFailed     = NewAppError(2003, "deploy failed")

	ErrDatabaseError = NewAppError(5001, "database error")
	ErrInternalError = NewAppError(5002, "internal server error")
)
