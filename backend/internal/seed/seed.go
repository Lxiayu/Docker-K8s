package seed

import (
	"time"

	"backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedAll(db *gorm.DB) error {
	if err := SeedUsers(db); err != nil {
		return err
	}
	if err := SeedRepositories(db); err != nil {
		return err
	}
	if err := SeedPipelines(db); err != nil {
		return err
	}
	if err := SeedBuilds(db); err != nil {
		return err
	}
	if err := SeedDeployments(db); err != nil {
		return err
	}
	if err := SeedSettings(db); err != nil {
		return err
	}
	return nil
}

func SeedUsers(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	users := []models.User{
		{Username: "admin", Email: "admin@example.com", Password: string(hashedPassword), Role: "admin", Status: 1},
		{Username: "developer1", Email: "developer1@example.com", Password: string(hashedPassword), Role: "developer", Status: 1},
		{Username: "developer2", Email: "developer2@example.com", Password: string(hashedPassword), Role: "developer", Status: 1},
		{Username: "devops", Email: "devops@example.com", Password: string(hashedPassword), Role: "devops", Status: 1},
		{Username: "viewer", Email: "viewer@example.com", Password: string(hashedPassword), Role: "viewer", Status: 1},
	}

	return db.Create(&users).Error
}

func SeedRepositories(db *gorm.DB) error {
	var count int64
	db.Model(&models.GitRepository{}).Count(&count)
	if count > 0 {
		return nil
	}

	repos := []models.GitRepository{
		{Name: "frontend-app", URL: "https://github.com/example/frontend-app.git", Type: "github", Branch: "main", Status: 1},
		{Name: "backend-api", URL: "https://github.com/example/backend-api.git", Type: "github", Branch: "main", Status: 1},
		{Name: "microservice-auth", URL: "https://gitlab.com/example/microservice-auth.git", Type: "gitlab", Branch: "develop", Status: 1},
	}

	return db.Create(&repos).Error
}

func SeedPipelines(db *gorm.DB) error {
	var count int64
	db.Model(&models.Pipeline{}).Count(&count)
	if count > 0 {
		return nil
	}

	pipelines := []models.Pipeline{
		{Name: "frontend-build", RepoID: 1, Status: "success"},
		{Name: "backend-build", RepoID: 2, Status: "success"},
		{Name: "auth-service-build", RepoID: 3, Status: "running"},
		{Name: "frontend-deploy", RepoID: 1, Status: "success"},
		{Name: "backend-deploy", RepoID: 2, Status: "failed"},
	}

	return db.Create(&pipelines).Error
}

func SeedBuilds(db *gorm.DB) error {
	var count int64
	db.Model(&models.Build{}).Count(&count)
	if count > 0 {
		return nil
	}

	statuses := []string{"success", "success", "success", "failed", "running"}
	now := time.Now()

	var builds []models.Build
	for i := 0; i < 20; i++ {
		pipelineID := uint((i % 5) + 1)
		status := statuses[i%len(statuses)]
		createdAt := now.Add(-time.Duration(i*2) * time.Hour)

		commitHash := "abc" + string(rune('0'+i%10)) + "def" + string(rune('0'+(i+1)%10))

		builds = append(builds, models.Build{
			PipelineID: pipelineID,
			CommitHash: commitHash,
			Branch:     "main",
			Status:     status,
			Log:        "Build log for build " + string(rune('0'+i%10)),
			Duration:   120 + i*10,
			CreatedAt:  createdAt,
		})
	}

	return db.Create(&builds).Error
}

func SeedDeployments(db *gorm.DB) error {
	var count int64
	db.Model(&models.Deployment{}).Count(&count)
	if count > 0 {
		return nil
	}

	deployments := []models.Deployment{
		{Name: "frontend-app", Namespace: "production", Image: "harbor.local/production/frontend:v1.0.0", Replicas: 3, Strategy: "rolling", Status: "running", Environment: "prod"},
		{Name: "backend-api", Namespace: "production", Image: "harbor.local/production/backend:v2.0.0", Replicas: 2, Strategy: "canary", Status: "running", Environment: "prod"},
		{Name: "frontend-app", Namespace: "development", Image: "harbor.local/dev/frontend:latest", Replicas: 1, Strategy: "rolling", Status: "running", Environment: "dev"},
		{Name: "backend-api", Namespace: "development", Image: "harbor.local/dev/backend:latest", Replicas: 1, Strategy: "rolling", Status: "running", Environment: "dev"},
		{Name: "auth-service", Namespace: "staging", Image: "harbor.local/staging/auth:v1.0.0", Replicas: 2, Strategy: "blue-green", Status: "running", Environment: "test"},
	}

	return db.Create(&deployments).Error
}

func SeedSettings(db *gorm.DB) error {
	var count int64
	db.Model(&models.Settings{}).Count(&count)
	if count > 0 {
		return nil
	}

	settings := []models.Settings{
		{Key: "system_name", Value: "CI/CD Platform", Category: "general", Description: "系统名称"},
		{Key: "system_description", Value: "企业级持续集成/持续部署平台", Category: "general", Description: "系统描述"},
		{Key: "default_namespace", Value: "default", Category: "general", Description: "默认命名空间"},

		{Key: "kubernetes_cluster_name", Value: "production-cluster", Category: "kubernetes", Description: "集群名称"},
		{Key: "kubernetes_api_server", Value: "https://k8s-api.example.com", Category: "kubernetes", Description: "API Server地址"},
		{Key: "kubernetes_namespaces", Value: "default,production,staging,development", Category: "kubernetes", Description: "可用命名空间"},

		{Key: "harbor_url", Value: "https://harbor.example.com", Category: "registry", Description: "Harbor地址"},
		{Key: "harbor_username", Value: "admin", Category: "registry", Description: "Harbor用户名"},
		{Key: "harbor_password", Value: "", Category: "registry", Description: "Harbor密码"},
		{Key: "harbor_default_project", Value: "production", Category: "registry", Description: "默认项目"},

		{Key: "smtp_host", Value: "smtp.example.com", Category: "notification", Description: "SMTP服务器"},
		{Key: "smtp_port", Value: "587", Category: "notification", Description: "SMTP端口"},
		{Key: "smtp_user", Value: "noreply@example.com", Category: "notification", Description: "SMTP用户"},
		{Key: "smtp_password", Value: "", Category: "notification", Description: "SMTP密码"},
		{Key: "dingtalk_webhook", Value: "", Category: "notification", Description: "钉钉Webhook"},
		{Key: "wechat_webhook", Value: "", Category: "notification", Description: "企业微信Webhook"},

		{Key: "enable_image_scanning", Value: "true", Category: "security", Description: "启用镜像扫描"},
		{Key: "scan_severity", Value: "high", Category: "security", Description: "扫描严重级别"},
		{Key: "block_high_severity", Value: "true", Category: "security", Description: "阻止高危漏洞"},
		{Key: "enable_audit_log", Value: "true", Category: "security", Description: "启用审计日志"},
		{Key: "audit_log_retention", Value: "90", Category: "security", Description: "审计日志保留天数"},
	}

	return db.Create(&settings).Error
}
