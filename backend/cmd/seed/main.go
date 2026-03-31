package main

import (
	"fmt"
	"log"
	"os"

	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/internal/seed"
	"github.com/cicd-platform/backend/pkg/config"
	"github.com/cicd-platform/backend/pkg/database"
	"github.com/cicd-platform/backend/pkg/logger"
)

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "./configs/config.yaml"
	}

	if err := config.Init(configPath); err != nil {
		log.Fatalf("Failed to initialize config: %v", err)
	}

	cfg := config.Get()

	if err := logger.Init(cfg.Log.Level, cfg.Log.Filename, cfg.Log.MaxSize, cfg.Log.MaxBackups, cfg.Log.MaxAge, cfg.Log.Compress); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	if err := database.Init(&cfg.Database); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	db := database.Get()

	if err := models.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	fmt.Println("Starting database seeding...")
	if err := seed.SeedAll(db); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}
	fmt.Println("Database seeding completed successfully!")
}
