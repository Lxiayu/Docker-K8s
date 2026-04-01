package seeder

import (
	"fmt"
	"time"

	"backend/internal/models"
	"backend/pkg/database"
	"backend/pkg/logger"
	"go.uber.org/zap"
)

// Seed populates the database with initial mock data if it's empty
func Seed() error {
	db := database.Get()
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	// Check if repositories exist
	var repoCount int64
	db.Model(&models.GitRepository{}).Count(&repoCount)

	if repoCount == 0 {
		logger.Info("Database is empty, starting to seed mock data...")

		// 1. Seed Repositories
		repos := []models.GitRepository{
			{Name: "frontend-app", URL: "https://github.com/example/frontend-app.git", Type: "github", Branch: "main", Status: 1},
			{Name: "backend-service", URL: "https://github.com/example/backend-service.git", Type: "github", Branch: "main", Status: 1},
			{Name: "payment-gateway", URL: "https://github.com/example/payment-gateway.git", Type: "gitlab", Branch: "master", Status: 1},
			{Name: "data-analytics", URL: "https://github.com/example/data-analytics.git", Type: "gitee", Branch: "main", Status: 1},
		}

		for i := range repos {
			if err := db.Create(&repos[i]).Error; err != nil {
				logger.Error("Failed to seed repository", zap.Error(err))
			}
		}

		// 2. Seed Pipelines
		pipelines := []models.Pipeline{
			{
				Name: "frontend-ci-cd",
				RepoID: repos[0].ID,
				Config: `{"stages":[{"name":"build","image":"node:18","script":["npm install","npm run build"]},{"name":"test","image":"node:18","script":["npm test"]},{"name":"docker","image":"docker:latest","script":["docker build -t frontend:latest ."]}]}`,
				Status: "idle",
			},
			{
				Name: "backend-main-pipeline",
				RepoID: repos[1].ID,
				Config: `{"stages":[{"name":"build","image":"golang:1.21","script":["go build -o app"]},{"name":"test","image":"golang:1.21","script":["go test ./..."]},{"name":"docker","image":"docker:latest","script":["docker build -t backend:latest ."]}]}`,
				Status: "idle",
			},
			{
				Name: "payment-security-check",
				RepoID: repos[2].ID,
				Config: `{"stages":[{"name":"sast","image":"secure/scanner","script":["scan ."]}]}`,
				Status: "idle",
			},
		}

		for i := range pipelines {
			if err := db.Create(&pipelines[i]).Error; err != nil {
				logger.Error("Failed to seed pipeline", zap.Error(err))
			}
		}

		// 3. Seed Builds (Execution History)
		now := time.Now()
		statuses := []string{"success", "success", "success", "failed", "success", "running", "success"}
		
		for i := 0; i < 20; i++ {
			// Distribute builds across last 7 days
			daysAgo := (i % 7)
			buildDate := now.AddDate(0, 0, -daysAgo).Add(-time.Duration(i*2) * time.Hour)
			
			status := statuses[i%len(statuses)]
			duration := 120 + (i * 15 % 300) // Random duration 2-7 minutes
			
			if status == "running" {
				duration = 0 // Still running
				// only make the most recent ones running
				if daysAgo > 0 {
					status = "success"
					duration = 200
				}
			}

			build := models.Build{
				PipelineID: pipelines[i%len(pipelines)].ID,
				CommitHash: fmt.Sprintf("abcdef%d", i),
				Branch:     "main",
				Status:     status,
				Duration:   duration,
				Log:        "Simulated build logs...\nStep 1: OK\nStep 2: OK\nFinished.",
			}
			
			// Override times directly to bypass gorm auto hooks for created_at if possible, 
			// or just let them be created now but for dashboard trend we need varying created_at
			db.Create(&build)
			db.Model(&build).Update("created_at", buildDate)
			
			// Update pipeline last build time
			if daysAgo == 0 {
				db.Model(&pipelines[build.PipelineID%3]).Update("last_build_at", buildDate)
				db.Model(&pipelines[build.PipelineID%3]).Update("status", status)
			}
		}

		// 4. Seed Deployments
		deployments := []models.Deployment{
			{Name: "frontend", Namespace: "default", Environment: "prod", Image: "frontend:v1.2.0", Strategy: "rolling", Status: "success", Replicas: 3},
			{Name: "frontend", Namespace: "default", Environment: "test", Image: "frontend:v1.3.0-rc1", Strategy: "rolling", Status: "success", Replicas: 1},
			{Name: "backend", Namespace: "default", Environment: "prod", Image: "backend:v2.0.5", Strategy: "rolling", Status: "success", Replicas: 5},
			{Name: "backend", Namespace: "default", Environment: "dev", Image: "backend:latest", Strategy: "rolling", Status: "success", Replicas: 1},
			{Name: "payment", Namespace: "default", Environment: "prod", Image: "payment:v1.0.0", Strategy: "canary", Status: "running", Replicas: 2},
		}

		for i := range deployments {
			if err := db.Create(&deployments[i]).Error; err != nil {
				logger.Error("Failed to seed deployment", zap.Error(err))
			}
		}

		logger.Info("Mock data seeding completed successfully!")
	} else {
		logger.Info("Database already contains data, skipping seeder.")
	}

	return nil
}
