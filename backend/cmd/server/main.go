package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cicd-platform/backend/internal/middleware"
	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/internal/router"
	"github.com/cicd-platform/backend/internal/seeder"
	"github.com/cicd-platform/backend/pkg/config"
	"github.com/cicd-platform/backend/pkg/database"
	"github.com/cicd-platform/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "./configs/config.yaml"
	}

	if err := config.Init(configPath); err != nil {
		panic(fmt.Sprintf("Failed to initialize config: %v", err))
	}

	cfg := config.Get()

	if err := logger.Init(
		cfg.Log.Level,
		cfg.Log.Filename,
		cfg.Log.MaxSize,
		cfg.Log.MaxBackups,
		cfg.Log.MaxAge,
		cfg.Log.Compress,
	); err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	if err := database.Init(&cfg.Database); err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer database.Close()

	if err := models.AutoMigrate(database.Get()); err != nil {
		logger.Fatal("Failed to auto migrate", zap.Error(err))
	}

	// 初始化测试数据
	if err := seeder.Seed(); err != nil {
		logger.Error("Failed to seed database", zap.Error(err))
	}

	gin.SetMode(cfg.Server.Mode)

	engine := gin.New()
	engine.Use(
		middleware.Recovery(),
		middleware.Logger(),
		middleware.CORS(),
	)

	router.Setup(engine)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      engine,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	go func() {
		logger.Info("Starting server",
			zap.Int("port", cfg.Server.Port),
			zap.String("mode", cfg.Server.Mode),
		)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}
