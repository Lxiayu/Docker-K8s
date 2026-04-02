package handlers

import (
	"strconv"

	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var pipelineService = services.NewPipelineService()

type CreatePipelineRequest struct {
	Name        string                 `json:"name" binding:"required"`
	RepositoryID uint                  `json:"repository_id" binding:"required"`
	Branch      string                 `json:"branch"`
	Stages      []services.PipelineStage `json:"stages"`
	Description string                 `json:"description"`
}

type UpdatePipelineRequest struct {
	Name        string                 `json:"name"`
	Branch      string                 `json:"branch"`
	Stages      []services.PipelineStage `json:"stages"`
	Description string                 `json:"description"`
	Status      string                 `json:"status"`
}

func ListPipelines(c *gin.Context) {
	var query services.ListPipelinesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "invalid query parameters")
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 10
	}

	pipelines, total, err := pipelineService.List(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list pipelines")
		return
	}

	response.SuccessPage(c, pipelines, total, query.Page, query.PageSize)
}

func GetPipeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid pipeline id")
		return
	}

	pipeline, err := pipelineService.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, pipeline)
}

func CreatePipeline(c *gin.Context) {
	var req CreatePipelineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	pipeline := &services.PipelineRequest{
		Name:        req.Name,
		RepositoryID: req.RepositoryID,
		Branch:      req.Branch,
		Stages:      req.Stages,
		Description: req.Description,
	}

	result, err := pipelineService.Create(pipeline)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "pipeline created successfully", result)
}

func UpdatePipeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid pipeline id")
		return
	}

	var req UpdatePipelineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	pipeline := &services.PipelineRequest{
		Name:        req.Name,
		Branch:      req.Branch,
		Stages:      req.Stages,
		Description: req.Description,
	}

	result, err := pipelineService.Update(uint(id), pipeline)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "pipeline updated successfully", result)
}

func DeletePipeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid pipeline id")
		return
	}

	if err := pipelineService.Delete(uint(id)); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "pipeline deleted successfully", nil)
}

func TriggerPipeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid pipeline id")
		return
	}

	var req services.TriggerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = services.TriggerRequest{}
	}

	userID := c.GetUint("user_id")
	req.TriggeredBy = userID

	result, err := pipelineService.Trigger(uint(id), &req)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "pipeline triggered successfully", result)
}

func ListBuilds(c *gin.Context) {
	pipelineID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid pipeline id")
		return
	}

	var query services.ListBuildsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "invalid query parameters")
		return
	}

	query.PipelineID = uint(pipelineID)
	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 10
	}

	builds, total, err := pipelineService.ListBuilds(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list builds")
		return
	}

	response.SuccessPage(c, builds, total, query.Page, query.PageSize)
}

func GetBuild(c *gin.Context) {
	buildID := c.Param("build_id")
	if buildID == "" {
		response.BadRequest(c, "invalid build id")
		return
	}

	build, err := pipelineService.GetBuild(buildID)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, build)
}
