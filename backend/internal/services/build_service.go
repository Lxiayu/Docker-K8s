package services

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"backend/internal/models"
	"backend/pkg/database"
	"backend/pkg/logger"
	"go.uber.org/zap"
)

type BuildService struct{}

func NewBuildService() *BuildService {
	return &BuildService{}
}

type BuildRequest struct {
	Name         string   `json:"name"`
	Dockerfile   string   `json:"dockerfile"`
	ContextPath  string   `json:"context_path"`
	Tag          string   `json:"tag"`
	Tags         []string `json:"tags"`
	BuildArgs    map[string]string `json:"build_args"`
	RepositoryID uint     `json:"repository_id"`
}

type BuildImageRequest struct {
	Name         string   `json:"name" binding:"required"`
	Dockerfile   string   `json:"dockerfile" binding:"required"`
	Context      string   `json:"context"`
	Tags         []string `json:"tags" binding:"required"`
	BuildArgs    map[string]string `json:"build_args"`
	Platforms    []string `json:"platforms"`
	NoCache      bool     `json:"no_cache"`
	Push         bool     `json:"push"`
	Registry     string   `json:"registry"`
}

type BuildStatus struct {
	BuildID    string    `json:"build_id"`
	Status     string    `json:"status"`
	Progress   int       `json:"progress"`
	Message    string    `json:"message"`
	Logs       string    `json:"logs"`
	StartTime  time.Time `json:"start_time"`
	EndTime    *time.Time `json:"end_time"`
	Duration   int       `json:"duration"`
	ImageSize  int64     `json:"image_size"`
}

func (s *BuildService) BuildImage(ctx context.Context, req *BuildImageRequest) (*BuildStatus, error) {
	buildID := fmt.Sprintf("build_%d", time.Now().Unix())
	
	status := &BuildStatus{
		BuildID:   buildID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	// 构建Docker命令
	args := []string{"build"}
	
	// 添加标签
	for _, tag := range req.Tags {
		args = append(args, "-t", tag)
	}
	
	// 添加构建参数
	for key, value := range req.BuildArgs {
		args = append(args, "--build-arg", fmt.Sprintf("%s=%s", key, value))
	}
	
	// 多平台构建
	if len(req.Platforms) > 0 {
		args = append(args, "--platform", strings.Join(req.Platforms, ","))
	}
	
	// 无缓存
	if req.NoCache {
		args = append(args, "--no-cache")
	}
	
	// 推送
	if req.Push {
		args = append(args, "--push")
	}
	
	// Dockerfile路径
	if req.Dockerfile != "" {
		args = append(args, "-f", req.Dockerfile)
	}
	
	// 构建上下文
	context := req.Context
	if context == "" {
		context = "."
	}
	args = append(args, context)

	// 执行构建命令
	cmd := exec.CommandContext(ctx, "docker", args...)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		status.Status = "failed"
		status.Message = fmt.Sprintf("Build failed: %v", err)
		status.Logs = string(output)
		now := time.Now()
		status.EndTime = &now
		status.Duration = int(now.Sub(status.StartTime).Seconds())
		return status, err
	}

	status.Status = "success"
	status.Progress = 100
	status.Message = "Build completed successfully"
	status.Logs = string(output)
	now := time.Now()
	status.EndTime = &now
	status.Duration = int(now.Sub(status.StartTime).Seconds())

	// 获取镜像大小
	if len(req.Tags) > 0 {
		imageSize, err := s.GetImageSize(req.Tags[0])
		if err == nil {
			status.ImageSize = imageSize
		}
	}

	return status, nil
}

func (s *BuildService) BuildWithBuildx(ctx context.Context, req *BuildImageRequest) (*BuildStatus, error) {
	buildID := fmt.Sprintf("build_%d", time.Now().Unix())
	
	status := &BuildStatus{
		BuildID:   buildID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	// 构建Docker Buildx命令
	args := []string{"buildx", "build"}
	
	// 添加标签
	for _, tag := range req.Tags {
		args = append(args, "-t", tag)
	}
	
	// 多平台构建
	if len(req.Platforms) > 0 {
		args = append(args, "--platform", strings.Join(req.Platforms, ","))
	} else {
		// 默认多平台
		args = append(args, "--platform", "linux/amd64,linux/arm64")
	}
	
	// 输出类型
	if req.Push {
		args = append(args, "--output", "type=registry")
	} else {
		args = append(args, "--output", "type=docker")
	}
	
	// 构建参数
	for key, value := range req.BuildArgs {
		args = append(args, "--build-arg", fmt.Sprintf("%s=%s", key, value))
	}
	
	// 无缓存
	if req.NoCache {
		args = append(args, "--no-cache")
	}
	
	// Dockerfile路径
	if req.Dockerfile != "" {
		args = append(args, "-f", req.Dockerfile)
	}
	
	// 构建上下文
	context := req.Context
	if context == "" {
		context = "."
	}
	args = append(args, context)

	// 执行构建命令
	cmd := exec.CommandContext(ctx, "docker", args...)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		status.Status = "failed"
		status.Message = fmt.Sprintf("Build failed: %v", err)
		status.Logs = string(output)
		now := time.Now()
		status.EndTime = &now
		status.Duration = int(now.Sub(status.StartTime).Seconds())
		return status, err
	}

	status.Status = "success"
	status.Progress = 100
	status.Message = "Build completed successfully"
	status.Logs = string(output)
	now := time.Now()
	status.EndTime = &now
	status.Duration = int(now.Sub(status.StartTime).Seconds())

	return status, nil
}

func (s *BuildService) GetImageSize(imageName string) (int64, error) {
	cmd := exec.Command("docker", "image", "inspect", imageName, "--format", "{{.Size}}")
	output, err := cmd.Output()
	if err != nil {
		return 0, err
	}

	var size int64
	_, err = fmt.Sscanf(string(output), "%d", &size)
	return size, err
}

func (s *BuildService) ParseDockerfile(dockerfile string) (map[string]interface{}, error) {
	// TODO: 实现Dockerfile解析
	// 这里应该解析Dockerfile并返回结构化信息
	result := make(map[string]interface{})
	result["valid"] = true
	result["stages"] = []string{"build", "runtime"}
	return result, nil
}

func (s *BuildService) ValidateDockerfile(dockerfile string) error {
	// TODO: 实现Dockerfile验证
	// 这里应该验证Dockerfile语法和最佳实践
	if dockerfile == "" {
		return errors.New("dockerfile cannot be empty")
	}
	return nil
}

func (s *BuildService) GenerateImageTag(name, version string) string {
	if version == "" {
		version = fmt.Sprintf("v%d", time.Now().Unix())
	}
	return fmt.Sprintf("%s:%s", name, version)
}

func (s *BuildService) PushImage(imageName string) error {
	cmd := exec.Command("docker", "push", imageName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		logger.Error("Failed to push image",
			zap.String("image", imageName),
			zap.Error(err),
			zap.String("output", string(output)),
		)
		return err
	}

	logger.Info("Image pushed successfully",
		zap.String("image", imageName),
	)
	return nil
}

func (s *BuildService) SaveBuildRecord(build *models.Build) error {
	return database.Get().Create(build).Error
}

func (s *BuildService) GetBuildHistory(pipelineID uint, page, pageSize int) ([]models.Build, int64, error) {
	var builds []models.Build
	var total int64

	db := database.Get().Model(&models.Build{}).Where("pipeline_id = ?", pipelineID)

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&builds).Error; err != nil {
		return nil, 0, err
	}

	return builds, total, nil
}

func (s *BuildService) Build(req *BuildRequest, userID uint) (*BuildStatus, error) {
	tags := req.Tags
	if len(tags) == 0 && req.Tag != "" {
		tags = []string{req.Tag}
	}
	if len(tags) == 0 {
		tags = []string{fmt.Sprintf("%s:latest", req.Name)}
	}
	
	buildReq := &BuildImageRequest{
		Name:       req.Name,
		Dockerfile: req.Dockerfile,
		Context:    req.ContextPath,
		Tags:       tags,
		BuildArgs:  req.BuildArgs,
	}
	
	return s.BuildImage(context.Background(), buildReq)
}
