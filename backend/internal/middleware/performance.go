package middleware

import (
	"time"

	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func PerformanceMonitor() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		method := c.Request.Method

		// 记录请求大小
		requestSize := c.Request.ContentLength

		// 处理请求
		c.Next()

		// 计算响应时间
		latency := time.Since(start)

		// 记录响应大小
		responseSize := c.Writer.Size()

		// 记录性能指标
		logger.Info("API Performance Metrics",
			zap.Int("status", c.Writer.Status()),
			zap.String("method", method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.Duration("latency", latency),
			zap.Int64("request_size", requestSize),
			zap.Int("response_size", responseSize),
			zap.String("user-agent", c.Request.UserAgent()),
		)

		// 检查是否存在性能问题
		if latency > 1000*time.Millisecond {
			logger.Warn("API Performance Warning: High Latency",
				zap.String("method", method),
				zap.String("path", path),
				zap.Duration("latency", latency),
			)
		}

		if responseSize > 1024*1024 {
			logger.Warn("API Performance Warning: Large Response Size",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("response_size", responseSize),
			)
		}
	}
}
