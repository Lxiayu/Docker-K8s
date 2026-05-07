package router

import (
	"net/http"
	"time"

	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/pkg/database"
	"backend/pkg/redis"
	"github.com/gin-gonic/gin"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"
)

var startTime = time.Now()

func Setup(engine *gin.Engine) {
	engine.GET("/health", func(c *gin.Context) {
		uptime := time.Since(startTime)
		c.JSON(200, gin.H{
			"status":  "ok",
			"uptime":  uptime.String(),
			"started": startTime.Format(time.RFC3339),
		})
	})

	engine.GET("/ready", func(c *gin.Context) {
		dbErr := database.Ping()
		redisErr := redis.Ping()

		if dbErr != nil || redisErr != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"database": dbErr == nil,
				"redis":    redisErr == nil,
			})
			return
		}

		c.JSON(200, gin.H{
			"status":   "ready",
			"database": true,
			"redis":    true,
		})
	})

	// Swagger 文档路由
	engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := engine.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", middleware.RateLimit(5, 10), handlers.Login)
			auth.POST("/register", handlers.Register)
		}

		users := api.Group("/users").Use(middleware.JWTAuth())
		{
			users.GET("", handlers.ListUsers)
			users.GET("/:id", handlers.GetUser)
			users.POST("", handlers.CreateUser)
			users.PUT("/:id", handlers.UpdateUser)
			users.DELETE("/:id", handlers.DeleteUser)
			users.GET("/me", handlers.GetCurrentUser)
			users.PUT("/me", handlers.UpdateProfile)
			users.PUT("/me/password", handlers.ChangePassword)
		}

		repos := api.Group("/repositories").Use(middleware.JWTAuth())
		{
			repos.GET("", handlers.ListRepositories)
			repos.GET("/:id", handlers.GetRepository)
			repos.POST("", handlers.CreateRepository)
			repos.PUT("/:id", handlers.UpdateRepository)
			repos.DELETE("/:id", handlers.DeleteRepository)
			repos.POST("/:id/test", handlers.TestRepository)
		}

		pipelines := api.Group("/pipelines").Use(middleware.JWTAuth())
		{
			pipelines.GET("", handlers.ListPipelines)
			pipelines.GET("/:id", handlers.GetPipeline)
			pipelines.POST("", handlers.CreatePipeline)
			pipelines.PUT("/:id", handlers.UpdatePipeline)
			pipelines.DELETE("/:id", handlers.DeletePipeline)
			pipelines.POST("/:id/trigger", handlers.TriggerPipeline)
			pipelines.GET("/:id/builds", handlers.ListBuilds)
			pipelines.GET("/:id/builds/:build_id", handlers.GetBuild)
		}

		deployments := api.Group("/deployments").Use(middleware.JWTAuth())
		{
			deployments.GET("", handlers.ListDeployments)
			deployments.GET("/:id", handlers.GetDeployment)
			deployments.POST("", handlers.CreateDeployment)
			deployments.PUT("/:id", handlers.UpdateDeployment)
			deployments.DELETE("/:id", handlers.DeleteDeployment)
			deployments.POST("/:id/deploy", handlers.Deploy)
			deployments.POST("/:id/rollback", handlers.RollbackDeployment)
			deployments.GET("/:id/logs", handlers.GetDeploymentLogs)
			deployments.GET("/:id/pods", handlers.GetDeploymentPods)
			deployments.GET("/:id/events", handlers.GetDeploymentEvents)
			deployments.GET("/:id/pod-logs", handlers.GetPodLogs)
			deployments.GET("/:id/pod-containers", handlers.GetPodContainers)
		}

		images := api.Group("/images").Use(middleware.JWTAuth())
		{
			images.GET("", handlers.ListImages)
			images.GET("/:id", handlers.GetImage)
			images.POST("", handlers.BuildImage)
			images.GET("/:id/scan", handlers.ScanImage)
		}

		monitoring := api.Group("/monitoring").Use(middleware.JWTAuth())
		{
			monitoring.GET("/metrics", handlers.GetMetrics)
			monitoring.GET("/alerts", handlers.ListAlerts)
			monitoring.POST("/alerts/rules", handlers.CreateAlertRule)
		}

		settings := api.Group("/settings").Use(middleware.JWTAuth())
		{
			settings.GET("", handlers.GetSettings)
			settings.GET("/:category", handlers.GetSettingsByCategory)
			settings.PUT("", handlers.UpdateSettings)
		}

		dashboard := api.Group("/dashboard").Use(middleware.JWTAuth())
		{
			dashboard.GET("/stats", handlers.GetDashboardStats)
		}
	}
}
