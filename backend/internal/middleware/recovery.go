package middleware

import (
	"github.com/cicd-platform/backend/pkg/logger"
	"github.com/cicd-platform/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("Panic recovered",
					zap.Any("error", err),
					zap.String("path", c.Request.URL.Path),
				)
				response.InternalServerError(c, "internal server error")
				c.Abort()
			}
		}()
		c.Next()
	}
}
