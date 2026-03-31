package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/pkg/database"
	"github.com/cicd-platform/backend/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type PipelineService struct {
	buildService *BuildService
	k8sService   *K8sService
}

func NewPipelineService() *PipelineService {
	return &PipelineService{
		buildService: NewBuildService(),
	}
}

type ListPipelinesQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Name     string `form:"name"`
	Status   string `form:"status"`
}

type PipelineRequest struct {
	Name        string           `json:"name"`
	RepositoryID uint            `json:"repository_id"`
	Branch      string           `json:"branch"`
	Stages      []PipelineStage  `json:"stages"`
	Description string           `json:"description"`
	Config      string           `json:"config"`
}

type TriggerRequest struct {
	Branch      string `json:"branch"`
	Commit      string `json:"commit"`
	TriggeredBy uint   `json:"triggered_by"`
}

type ListBuildsQuery struct {
	PipelineID uint   `form:"pipeline_id"`
	Page       int    `form:"page"`
	PageSize   int    `form:"page_size"`
	Status     string `form:"status"`
}

type PipelineDefinition struct {
	Name   string                 `json:"name" yaml:"name"`
	Stages []PipelineStage        `json:"stages" yaml:"stages"`
	Env    map[string]string      `json:"env" yaml:"env"`
	Config map[string]interface{} `json:"config" yaml:"config"`
}

type PipelineStage struct {
	Name     string            `json:"name" yaml:"name"`
	Image    string            `json:"image" yaml:"image"`
	Script   []string          `json:"script" yaml:"script"`
	Env      map[string]string `json:"env" yaml:"env"`
	Timeout  int               `json:"timeout" yaml:"timeout"`
	Retry    int               `json:"retry" yaml:"retry"`
	Parallel bool              `json:"parallel" yaml:"parallel"`
	When     string            `json:"when" yaml:"when"`
}

type PipelineExecution struct {
	ID          string                 `json:"id"`
	PipelineID  uint                   `json:"pipeline_id"`
	Status      string                 `json:"status"`
	Stage       string                 `json:"stage"`
	Progress    int                    `json:"progress"`
	StartTime   time.Time              `json:"start_time"`
	EndTime     *time.Time             `json:"end_time"`
	Duration    int                    `json:"duration"`
	Logs        []StageLog             `json:"logs"`
	Variables   map[string]string      `json:"variables"`
	Artifacts   map[string]interface{} `json:"artifacts"`
}

type StageLog struct {
	Stage     string    `json:"stage"`
	Status    string    `json:"status"`
	Output    string    `json:"output"`
	StartTime time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	Duration  int       `json:"duration"`
}

var (
	executionMap = make(map[string]*PipelineExecution)
	mutex        sync.RWMutex
)

func (s *PipelineService) CreatePipeline(name string, repoID uint, config string) (*models.Pipeline, error) {
	// 验证配置格式
	var pipelineDef PipelineDefinition
	if err := json.Unmarshal([]byte(config), &pipelineDef); err != nil {
		return nil, fmt.Errorf("invalid pipeline config: %w", err)
	}

	pipeline := &models.Pipeline{
		Name:   name,
		RepoID: repoID,
		Config: config,
		Status: "idle",
	}

	if err := database.Get().Create(pipeline).Error; err != nil {
		return nil, err
	}

	return pipeline, nil
}

func (s *PipelineService) GetPipeline(id uint) (*models.Pipeline, error) {
	var pipeline models.Pipeline
	if err := database.Get().First(&pipeline, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("pipeline not found")
		}
		return nil, err
	}
	return &pipeline, nil
}

func (s *PipelineService) UpdatePipeline(id uint, config string) (*models.Pipeline, error) {
	pipeline, err := s.GetPipeline(id)
	if err != nil {
		return nil, err
	}

	// 验证配置格式
	var pipelineDef PipelineDefinition
	if err := json.Unmarshal([]byte(config), &pipelineDef); err != nil {
		return nil, fmt.Errorf("invalid pipeline config: %w", err)
	}

	pipeline.Config = config
	if err := database.Get().Save(pipeline).Error; err != nil {
		return nil, err
	}

	return pipeline, nil
}

func (s *PipelineService) DeletePipeline(id uint) error {
	pipeline, err := s.GetPipeline(id)
	if err != nil {
		return err
	}

	return database.Get().Delete(pipeline).Error
}

func (s *PipelineService) TriggerPipeline(id uint, branch, commit string) (*PipelineExecution, error) {
	pipeline, err := s.GetPipeline(id)
	if err != nil {
		return nil, err
	}

	// 解析流水线配置
	var pipelineDef PipelineDefinition
	if err := json.Unmarshal([]byte(pipeline.Config), &pipelineDef); err != nil {
		return nil, fmt.Errorf("invalid pipeline config: %w", err)
	}

	// 创建执行记录
	executionID := fmt.Sprintf("exec_%d_%d", id, time.Now().Unix())
	execution := &PipelineExecution{
		ID:         executionID,
		PipelineID: id,
		Status:     "pending",
		Progress:   0,
		StartTime:  time.Now(),
		Logs:       []StageLog{},
		Variables: map[string]string{
			"BRANCH": branch,
			"COMMIT": commit,
		},
		Artifacts: make(map[string]interface{}),
	}

	// 保存到内存
	mutex.Lock()
	executionMap[executionID] = execution
	mutex.Unlock()

	// 创建构建记录
	build := &models.Build{
		PipelineID: id,
		CommitHash: commit,
		Branch:     branch,
		Status:     "pending",
	}

	if err := database.Get().Create(build).Error; err != nil {
		return nil, err
	}

	// 更新流水线状态
	pipeline.Status = "running"
	now := time.Now()
	pipeline.LastBuildAt = &now
	database.Get().Save(pipeline)

	// 异步执行流水线
	go s.executePipeline(executionID, pipelineDef, build)

	return execution, nil
}

func (s *PipelineService) executePipeline(executionID string, pipelineDef PipelineDefinition, build *models.Build) {
	mutex.RLock()
	execution := executionMap[executionID]
	mutex.RUnlock()

	execution.Status = "running"
	s.updateBuildStatus(build, "running")

	// 执行各个阶段
	for i, stage := range pipelineDef.Stages {
		stageLog := StageLog{
			Stage:     stage.Name,
			Status:    "running",
			StartTime: time.Now(),
		}

		execution.Stage = stage.Name
		execution.Progress = (i * 100) / len(pipelineDef.Stages)

		// 执行阶段
		err := s.executeStage(stage, execution)
		if err != nil {
			stageLog.Status = "failed"
			now := time.Now()
			stageLog.EndTime = &now
			stageLog.Duration = int(now.Sub(stageLog.StartTime).Seconds())
			stageLog.Output = err.Error()
			execution.Logs = append(execution.Logs, stageLog)

			execution.Status = "failed"
			now = time.Now()
			execution.EndTime = &now
			execution.Duration = int(now.Sub(execution.StartTime).Seconds())

			s.updateBuildStatus(build, "failed")
			s.updatePipelineStatus(execution.PipelineID, "failed")
			return
		}

		stageLog.Status = "success"
		now := time.Now()
		stageLog.EndTime = &now
		stageLog.Duration = int(now.Sub(stageLog.StartTime).Seconds())
		execution.Logs = append(execution.Logs, stageLog)
	}

	// 所有阶段执行成功
	execution.Status = "success"
	execution.Progress = 100
	now := time.Now()
	execution.EndTime = &now
	execution.Duration = int(now.Sub(execution.StartTime).Seconds())

	s.updateBuildStatus(build, "success")
	s.updatePipelineStatus(execution.PipelineID, "success")
}

func (s *PipelineService) executeStage(stage PipelineStage, execution *PipelineExecution) error {
	logger.Info("Executing pipeline stage",
		zap.String("execution_id", execution.ID),
		zap.String("stage", stage.Name),
	)

	// Simulate stage execution steps
	for i, scriptLine := range stage.Script {
		execution.Logs = append(execution.Logs, StageLog{
			Stage:  stage.Name,
			Status: "running",
			Output: fmt.Sprintf("[%s] Running: %s\n", time.Now().Format(time.RFC3339), scriptLine),
		})
		
		// Wait to simulate work being done
		time.Sleep(time.Duration(2+i) * time.Second)
		
		execution.Logs = append(execution.Logs, StageLog{
			Stage:  stage.Name,
			Status: "running",
			Output: fmt.Sprintf("[%s] Completed: %s\n", time.Now().Format(time.RFC3339), scriptLine),
		})
	}

	return nil
}

func (s *PipelineService) updateBuildStatus(build *models.Build, status string) {
	build.Status = status
	database.Get().Save(build)
}

func (s *PipelineService) updatePipelineStatus(pipelineID uint, status string) {
	pipeline, err := s.GetPipeline(pipelineID)
	if err != nil {
		return
	}

	pipeline.Status = status
	database.Get().Save(pipeline)
}

func (s *PipelineService) GetExecutionStatus(executionID string) (*PipelineExecution, error) {
	mutex.RLock()
	execution, exists := executionMap[executionID]
	mutex.RUnlock()

	if !exists {
		return nil, errors.New("execution not found")
	}

	return execution, nil
}

func (s *PipelineService) CancelExecution(executionID string) error {
	mutex.RLock()
	execution, exists := executionMap[executionID]
	mutex.RUnlock()

	if !exists {
		return errors.New("execution not found")
	}

	if execution.Status == "running" {
		execution.Status = "cancelled"
		now := time.Now()
		execution.EndTime = &now
		execution.Duration = int(now.Sub(execution.StartTime).Seconds())
	}

	return nil
}

func (s *PipelineService) GetBuildHistory(pipelineID uint, page, pageSize int) ([]models.Build, int64, error) {
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

func (s *PipelineService) GetBuildLog(buildID uint) (string, error) {
	var build models.Build
	if err := database.Get().First(&build, buildID).Error; err != nil {
		return "", err
	}

	return build.Log, nil
}

func (s *PipelineService) CreatePipelineTemplate(name string, config string) error {
	// TODO: 实现流水线模板创建
	return nil
}

func (s *PipelineService) GetPipelineTemplates() ([]map[string]interface{}, error) {
	// TODO: 实现流水线模板查询
	templates := []map[string]interface{}{
		{
			"name":        "Java Maven Build",
			"description": "Java项目Maven构建模板",
			"config": `{
				"name": "java-maven-build",
				"stages": [
					{
						"name": "build",
						"image": "maven:3.8-openjdk-11",
						"script": ["mvn clean package"]
					},
					{
						"name": "test",
						"image": "maven:3.8-openjdk-11",
						"script": ["mvn test"]
					},
					{
						"name": "docker",
						"image": "docker:latest",
						"script": ["docker build -t app:latest ."]
					}
				]
			}`,
		},
		{
			"name":        "Node.js Build",
			"description": "Node.js项目构建模板",
			"config": `{
				"name": "nodejs-build",
				"stages": [
					{
						"name": "install",
						"image": "node:18",
						"script": ["npm install"]
					},
					{
						"name": "build",
						"image": "node:18",
						"script": ["npm run build"]
					},
					{
						"name": "test",
						"image": "node:18",
						"script": ["npm test"]
					}
				]
			}`,
		},
		{
			"name":        "Go Build",
			"description": "Go项目构建模板",
			"config": `{
				"name": "go-build",
				"stages": [
					{
						"name": "build",
						"image": "golang:1.21",
						"script": ["go build -o app"]
					},
					{
						"name": "test",
						"image": "golang:1.21",
						"script": ["go test ./..."]
					}
				]
			}`,
		},
	}

	return templates, nil
}

func (s *PipelineService) List(query *ListPipelinesQuery) ([]models.Pipeline, int64, error) {
	var pipelines []models.Pipeline
	var total int64

	db := database.Get().Model(&models.Pipeline{})

	if query.Name != "" {
		db = db.Where("name LIKE ?", "%"+query.Name+"%")
	}
	if query.Status != "" {
		db = db.Where("status = ?", query.Status)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("created_at DESC").Find(&pipelines).Error; err != nil {
		return nil, 0, err
	}

	return pipelines, total, nil
}

func (s *PipelineService) GetByID(id uint) (*models.Pipeline, error) {
	return s.GetPipeline(id)
}

func (s *PipelineService) Create(req *PipelineRequest) (*models.Pipeline, error) {
	config := "{}"
	if len(req.Stages) > 0 {
		configBytes, _ := json.Marshal(map[string]interface{}{
			"stages": req.Stages,
		})
		config = string(configBytes)
	}
	return s.CreatePipeline(req.Name, req.RepositoryID, config)
}

func (s *PipelineService) Update(id uint, req *PipelineRequest) (*models.Pipeline, error) {
	config := "{}"
	if len(req.Stages) > 0 {
		configBytes, _ := json.Marshal(map[string]interface{}{
			"stages": req.Stages,
		})
		config = string(configBytes)
	}
	return s.UpdatePipeline(id, config)
}

func (s *PipelineService) Delete(id uint) error {
	return s.DeletePipeline(id)
}

func (s *PipelineService) Trigger(id uint, req *TriggerRequest) (*PipelineExecution, error) {
	return s.TriggerPipeline(id, req.Branch, req.Commit)
}

func (s *PipelineService) ListBuilds(query *ListBuildsQuery) ([]models.Build, int64, error) {
	return s.GetBuildHistory(query.PipelineID, query.Page, query.PageSize)
}

func (s *PipelineService) GetBuild(buildID string) (*models.Build, error) {
	var build models.Build
	if err := database.Get().Where("id = ?", buildID).First(&build).Error; err != nil {
		return nil, err
	}
	return &build, nil
}
