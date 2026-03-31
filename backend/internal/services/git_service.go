package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/pkg/database"
	"gorm.io/gorm"
)

type GitService struct{}

func NewGitService() *GitService {
	return &GitService{}
}

type ListRepositoriesQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Name     string `form:"name"`
	Type     string `form:"type"`
	Status   *int   `form:"status"`
}

type RepositoryRequest struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Type        string `json:"type"`
	Branch      string `json:"branch"`
	Credential  string `json:"credential"`
	Description string `json:"description"`
}

type CreateRepositoryRequest struct {
	Name       string `json:"name" binding:"required,min=1,max=100"`
	URL        string `json:"url" binding:"required,url"`
	Type       string `json:"type" binding:"required,oneof=gitlab github gitee"`
	Branch     string `json:"branch"`
	Credential string `json:"credential"`
}

type UpdateRepositoryRequest struct {
	Name       string `json:"name"`
	URL        string `json:"url"`
	Branch     string `json:"branch"`
	Credential string `json:"credential"`
	Status     *int   `json:"status"`
}

type RepositoryListQuery struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	Name     string `form:"name"`
	Type     string `form:"type"`
	Status   *int   `form:"status"`
}

type BranchInfo struct {
	Name      string `json:"name"`
	Commit    string `json:"commit"`
	Author    string `json:"author"`
	Timestamp string `json:"timestamp"`
}

func (s *GitService) List(query *RepositoryListQuery) ([]models.GitRepository, int64, error) {
	var repos []models.GitRepository
	var total int64

	db := database.Get().Model(&models.GitRepository{})

	if query.Name != "" {
		db = db.Where("name LIKE ?", "%"+query.Name+"%")
	}
	if query.Type != "" {
		db = db.Where("type = ?", query.Type)
	}
	if query.Status != nil {
		db = db.Where("status = ?", *query.Status)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("created_at DESC").Find(&repos).Error; err != nil {
		return nil, 0, err
	}

	return repos, total, nil
}

func (s *GitService) GetByID(id uint) (*models.GitRepository, error) {
	var repo models.GitRepository
	if err := database.Get().First(&repo, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("repository not found")
		}
		return nil, err
	}
	return &repo, nil
}

func (s *GitService) Create(req *CreateRepositoryRequest) (*models.GitRepository, error) {
	var count int64
	database.Get().Model(&models.GitRepository{}).Where("url = ?", req.URL).Count(&count)
	if count > 0 {
		return nil, errors.New("repository URL already exists")
	}

	if req.Branch == "" {
		req.Branch = "main"
	}

	repo := &models.GitRepository{
		Name:       req.Name,
		URL:        req.URL,
		Type:       req.Type,
		Branch:     req.Branch,
		Credential: req.Credential,
		Status:     1,
	}

	if err := database.Get().Create(repo).Error; err != nil {
		return nil, err
	}

	return repo, nil
}

func (s *GitService) Update(id uint, req *UpdateRepositoryRequest) (*models.GitRepository, error) {
	repo, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})

	if req.Name != "" && req.Name != repo.Name {
		updates["name"] = req.Name
	}

	if req.URL != "" && req.URL != repo.URL {
		var count int64
		database.Get().Model(&models.GitRepository{}).Where("url = ? AND id != ?", req.URL, id).Count(&count)
		if count > 0 {
			return nil, errors.New("repository URL already exists")
		}
		updates["url"] = req.URL
	}

	if req.Branch != "" {
		updates["branch"] = req.Branch
	}

	if req.Credential != "" {
		updates["credential"] = req.Credential
	}

	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) > 0 {
		if err := database.Get().Model(repo).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return repo, nil
}

func (s *GitService) Delete(id uint) error {
	repo, err := s.GetByID(id)
	if err != nil {
		return err
	}

	return database.Get().Delete(repo).Error
}

func (s *GitService) TestConnection(id uint) (map[string]interface{}, error) {
	repo, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	err = s.testGitConnection(repo.URL, repo.Branch, repo.Credential)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"message": err.Error(),
		}, nil
	}

	return map[string]interface{}{
		"success": true,
		"message": "Connection successful",
		"branch":  repo.Branch,
	}, nil
}

func (s *GitService) testGitConnection(url, branch, credential string) error {
	// TODO: 实现真实的Git连接测试
	// 这里应该使用go-git或其他Git库来测试连接
	// 目前返回成功作为占位符
	return nil
}

func (s *GitService) GetBranches(id uint) ([]BranchInfo, error) {
	repo, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// TODO: 实现真实的分支列表获取
	// 这里应该使用go-git或其他Git库来获取分支列表
	// 目前返回模拟数据
	branches := []BranchInfo{
		{
			Name:      repo.Branch,
			Commit:    "abc123",
			Author:    "Developer",
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}

	return branches, nil
}

func (s *GitService) GenerateWebhookURL(id uint, baseURL string) (string, string, error) {
	repo, err := s.GetByID(id)
	if err != nil {
		return "", "", err
	}

	webhookKey := fmt.Sprintf("wh_%d_%s", id, time.Now().Format("20060102150405"))
	webhookURL := fmt.Sprintf("%s/api/v1/webhooks/%d/%s", baseURL, id, webhookKey)

	updates := map[string]interface{}{
		"webhook_url": webhookURL,
		"webhook_key": webhookKey,
	}

	if err := database.Get().Model(repo).Updates(updates).Error; err != nil {
		return "", "", err
	}

	return webhookURL, webhookKey, nil
}

func (s *GitService) HandleWebhook(repoID uint, webhookKey string, payload map[string]interface{}) error {
	repo, err := s.GetByID(repoID)
	if err != nil {
		return err
	}

	if repo.WebhookKey != webhookKey {
		return errors.New("invalid webhook key")
	}

	// 解析Webhook payload
	// 支持GitLab/GitHub/Gitee的不同格式
	var branch, commit, author string

	switch repo.Type {
	case "gitlab":
		if ref, ok := payload["ref"].(string); ok {
			branch = strings.TrimPrefix(ref, "refs/heads/")
		}
		if commits, ok := payload["commits"].([]interface{}); ok && len(commits) > 0 {
			if commitMap, ok := commits[0].(map[string]interface{}); ok {
				commit = fmt.Sprintf("%v", commitMap["id"])
				if authorMap, ok := commitMap["author"].(map[string]interface{}); ok {
					author = fmt.Sprintf("%v", authorMap["name"])
				}
			}
		}
	case "github":
		if ref, ok := payload["ref"].(string); ok {
			branch = strings.TrimPrefix(ref, "refs/heads/")
		}
		if headCommit, ok := payload["head_commit"].(map[string]interface{}); ok {
			commit = fmt.Sprintf("%v", headCommit["id"])
			if authorMap, ok := headCommit["author"].(map[string]interface{}); ok {
				author = fmt.Sprintf("%v", authorMap["name"])
			}
		}
	case "gitee":
		if ref, ok := payload["ref"].(string); ok {
			branch = strings.TrimPrefix(ref, "refs/heads/")
		}
		if commits, ok := payload["commits"].([]interface{}); ok && len(commits) > 0 {
			if commitMap, ok := commits[0].(map[string]interface{}); ok {
				commit = fmt.Sprintf("%v", commitMap["id"])
				if authorMap, ok := commitMap["author"].(map[string]interface{}); ok {
					author = fmt.Sprintf("%v", authorMap["name"])
				}
			}
		}
	}

	// TODO: 触发流水线
	// 这里应该调用流水线服务来触发构建
	// 使用解析出的变量避免编译错误
	_ = branch
	_ = commit
	_ = author
	// pipelineService.Trigger(repo.ID, branch, commit, author)

	return nil
}
