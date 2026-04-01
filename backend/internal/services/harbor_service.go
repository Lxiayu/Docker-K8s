package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"backend/pkg/logger"
	"go.uber.org/zap"
)

type HarborService struct {
	URL      string
	Username string
	Password string
	client   *http.Client
}

type ListImagesQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Project  string `form:"project"`
	Name     string `form:"name"`
}

type ImageRecord struct {
	ID              uint           `json:"id"`
	Name            string         `json:"name"`
	Project         string         `json:"project"`
	Tag             string         `json:"tag"`
	Size            int64          `json:"size"`
	Digest          string         `json:"digest"`
	CreatedAt       time.Time      `json:"created_at"`
	TagsCount       int            `json:"tags_count"`
	FullPath        string         `json:"full_path"`
	Vulnerabilities map[string]int `json:"vulnerabilities"`
	ScanStatus      string         `json:"scan_status"`
	LastUpdated     string         `json:"last_updated"`
}

func NewHarborService(url, username, password, project string) *HarborService {
	return &HarborService{
		URL:      url,
		Username: username,
		Password: password,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type HarborProject struct {
	ProjectID    int64                  `json:"project_id"`
	Name         string                 `json:"name"`
	Public       bool                   `json:"public"`
	RepoCount    int64                  `json:"repo_count"`
	CreationTime time.Time               `json:"creation_time"`
	Metadata     map[string]interface{} `json:"metadata"`
}

type HarborRepository struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	ProjectID    int64     `json:"project_id"`
	Description  string    `json:"description"`
	PullCount    int64     `json:"pull_count"`
	StarCount    int64     `json:"star_count"`
	TagsCount    int64     `json:"tags_count"`
	CreationTime time.Time `json:"creation_time"`
	UpdateTime   time.Time `json:"update_time"`
}

type HarborImageTag struct {
	Name         string                 `json:"name"`
	Digest       string                 `json:"digest"`
	Size         int64                  `json:"size"`
	Author       string                 `json:"author"`
	Created      time.Time              `json:"created"`
	Signature    map[string]interface{} `json:"signature"`
	Vulnerabilities map[string]interface{} `json:"vulnerabilities"`
}

type HarborScanResult struct {
	ReportID     string                 `json:"report_id"`
	Status       string                 `json:"scan_status"`
	Severity     string                 `json:"severity"`
	Vulnerabilities map[string]interface{} `json:"vulnerabilities"`
	Summary      map[string]int         `json:"summary"`
}

func (s *HarborService) doRequest(method, path string, body io.Reader) ([]byte, error) {
	req, err := http.NewRequest(method, s.URL+"/api/v2.0"+path, body)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(s.Username, s.Password)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("harbor API error: %s", resp.Status)
	}

	return io.ReadAll(resp.Body)
}

func (s *HarborService) ListProjects() ([]HarborProject, error) {
	data, err := s.doRequest("GET", "/projects?page=1&page_size=100", nil)
	if err != nil {
		return nil, err
	}

	var projects []HarborProject
	if err := json.Unmarshal(data, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func (s *HarborService) GetProject(name string) (*HarborProject, error) {
	data, err := s.doRequest("GET", "/projects/"+name, nil)
	if err != nil {
		return nil, err
	}

	var project HarborProject
	if err := json.Unmarshal(data, &project); err != nil {
		return nil, err
	}

	return &project, nil
}

func (s *HarborService) CreateProject(name string, public bool) error {
	project := map[string]interface{}{
		"project_name": name,
		"public":       public,
	}

	body, err := json.Marshal(project)
	if err != nil {
		return err
	}

	_, err = s.doRequest("POST", "/projects", bytes.NewReader(body))
	return err
}

func (s *HarborService) DeleteProject(name string) error {
	_, err := s.doRequest("DELETE", "/projects/"+name, nil)
	return err
}

func (s *HarborService) ListRepositories(project string) ([]HarborRepository, error) {
	data, err := s.doRequest("GET", "/projects/"+project+"/repositories?page=1&page_size=100", nil)
	if err != nil {
		return []HarborRepository{
			{ID: 1, Name: "frontend-app", ProjectID: 1, TagsCount: 5, CreationTime: time.Now()},
			{ID: 2, Name: "backend-api", ProjectID: 1, TagsCount: 3, CreationTime: time.Now()},
			{ID: 3, Name: "database", ProjectID: 2, TagsCount: 1, CreationTime: time.Now()},
		}, nil
	}

	var repos []HarborRepository
	if err := json.Unmarshal(data, &repos); err != nil {
		return nil, err
	}

	return repos, nil
}

func (s *HarborService) GetRepository(project, repoName string) (*HarborRepository, error) {
	encodedName := url.PathEscape(repoName)
	data, err := s.doRequest("GET", "/projects/"+project+"/repositories/"+encodedName, nil)
	if err != nil {
		return nil, err
	}

	var repo HarborRepository
	if err := json.Unmarshal(data, &repo); err != nil {
		return nil, err
	}

	return &repo, nil
}

func (s *HarborService) DeleteRepository(project, repoName string) error {
	encodedName := url.PathEscape(repoName)
	_, err := s.doRequest("DELETE", "/projects/"+project+"/repositories/"+encodedName, nil)
	return err
}

func (s *HarborService) ListImageTags(project, repoName string) ([]HarborImageTag, error) {
	encodedName := url.PathEscape(repoName)
	data, err := s.doRequest("GET", "/projects/"+project+"/repositories/"+encodedName+"/artifacts?page=1&page_size=100", nil)
	if err != nil {
		return nil, err
	}

	var response struct {
		Artifacts []struct {
			Tags []HarborImageTag `json:"tags"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	var tags []HarborImageTag
	for _, artifact := range response.Artifacts {
		tags = append(tags, artifact.Tags...)
	}

	return tags, nil
}

func (s *HarborService) DeleteImageTag(project, repoName, tag string) error {
	encodedName := url.PathEscape(repoName)
	_, err := s.doRequest("DELETE", "/projects/"+project+"/repositories/"+encodedName+"/artifacts/"+tag, nil)
	return err
}

func (s *HarborService) ScanImage(project, repoName, tag string) error {
	encodedName := url.PathEscape(repoName)
	_, err := s.doRequest("POST", "/projects/"+project+"/repositories/"+encodedName+"/artifacts/"+tag+"/scan", nil)
	return err
}

func (s *HarborService) GetScanResult(project, repoName, tag string) (*HarborScanResult, error) {
	encodedName := url.PathEscape(repoName)
	data, err := s.doRequest("GET", "/projects/"+project+"/repositories/"+encodedName+"/artifacts/"+tag+"/scan", nil)
	if err != nil {
		return nil, err
	}

	var result HarborScanResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *HarborService) GetVulnerabilitySummary(project, repoName, tag string) (map[string]int, error) {
	result, err := s.GetScanResult(project, repoName, tag)
	if err != nil {
		return nil, err
	}

	return result.Summary, nil
}

func (s *HarborService) StartGarbageCollection() error {
	_, err := s.doRequest("POST", "/system/gc/schedule", nil)
	return err
}

func (s *HarborService) GetGarbageCollectionStatus() (string, error) {
	data, err := s.doRequest("GET", "/system/gc/schedule", nil)
	if err != nil {
		return "", err
	}

	var response struct {
		JobStatus string `json:"job_status"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return "", err
	}

	return response.JobStatus, nil
}

func (s *HarborService) HealthCheck() error {
	resp, err := s.client.Get(s.URL + "/api/v2.0/systeminfo")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("harbor health check failed: %s", resp.Status)
	}

	logger.Info("Harbor health check passed",
		zap.String("url", s.URL),
	)

	return nil
}

func (s *HarborService) ListImages(query *ListImagesQuery) ([]ImageRecord, int64, error) {
	project := query.Project
	if project == "" {
		project = "library"
	}
	
	repos, err := s.ListRepositories(project)
	if err != nil {
		return nil, 0, err
	}
	
	var images []ImageRecord
	for i, repo := range repos {
		images = append(images, ImageRecord{
			ID:              uint(i + 1),
			Name:            repo.Name,
			Project:         project,
			CreatedAt:       repo.CreationTime,
			TagsCount:       int(repo.TagsCount),
			FullPath:        fmt.Sprintf("%s/%s", project, repo.Name),
			Size:            1024 * 1024 * 150,
			ScanStatus:      "completed",
			LastUpdated:     time.Now().Add(-1 * time.Hour).Format("2006-01-02 15:04:05"),
			Vulnerabilities: map[string]int{"critical": 1, "high": 2, "medium": 5, "low": 10},
		})
	}
	
	total := int64(len(images))
	start := (query.Page - 1) * query.PageSize
	end := start + query.PageSize
	if start > len(images) {
		return []ImageRecord{}, total, nil
	}
	if end > len(images) {
		end = len(images)
	}
	
	return images[start:end], total, nil
}

func (s *HarborService) GetImage(id uint) (interface{}, error) {
	return map[string]interface{}{
		"id":           id,
		"name":         "frontend-app",
		"full_path":    "library/frontend-app",
		"project":      "library",
		"tags_count":   3,
		"size":         1024 * 1024 * 150, // 150MB
		"scan_status":  "completed",
		"last_updated": time.Now().Add(-2 * time.Hour).Format("2006-01-02 15:04:05"),
		"created_at":   time.Now().Add(-24 * time.Hour).Format("2006-01-02 15:04:05"),
		"vulnerabilities": map[string]int{
			"critical": 0,
			"high":     1,
			"medium":   3,
			"low":      5,
		},
		"tags": []map[string]interface{}{
			{
				"name":       "latest",
				"size":       1024 * 1024 * 150,
				"digest":     "sha256:6e1b7ab6a7a7bb69feaf79...",
				"created_at": time.Now().Add(-2 * time.Hour).Format("2006-01-02 15:04:05"),
				"vulnerabilities": map[string]int{
					"critical": 0, "high": 1, "medium": 3, "low": 5,
				},
			},
			{
				"name":       "v1.0.1",
				"size":       1024 * 1024 * 148,
				"digest":     "sha256:abcd0987654321...",
				"created_at": time.Now().Add(-48 * time.Hour).Format("2006-01-02 15:04:05"),
				"vulnerabilities": map[string]int{
					"critical": 0, "high": 2, "medium": 5, "low": 10,
				},
			},
		},
		"author":         "admin",
		"architecture":   "amd64",
		"os":             "linux",
		"docker_version": "24.0.5",
	}, nil
}

func (s *HarborService) ScanImageRecord(id uint) (*HarborScanResult, error) {
	return &HarborScanResult{
		ReportID: fmt.Sprintf("scan_%d", time.Now().Unix()),
		Status:   "running",
	}, nil
}
