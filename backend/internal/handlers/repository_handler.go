package handlers

import (
	"strconv"

	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var gitService = services.NewGitService()

type CreateRepositoryRequest struct {
	Name        string `json:"name" binding:"required"`
	URL         string `json:"url" binding:"required"`
	Branch      string `json:"branch"`
	Credential  string `json:"credential"`
	Description string `json:"description"`
}

type UpdateRepositoryRequest struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Branch      string `json:"branch"`
	Credential  string `json:"credential"`
	Description string `json:"description"`
}

func ListRepositories(c *gin.Context) {
	var query services.RepositoryListQuery
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

	repos, total, err := gitService.List(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list repositories")
		return
	}

	response.SuccessPage(c, repos, total, query.Page, query.PageSize)
}

func GetRepository(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid repository id")
		return
	}

	repo, err := gitService.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, repo)
}

func CreateRepository(c *gin.Context) {
	var req CreateRepositoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	repo := &services.CreateRepositoryRequest{
		Name:       req.Name,
		URL:        req.URL,
		Type:       "gitlab",
		Branch:     req.Branch,
		Credential: req.Credential,
	}

	result, err := gitService.Create(repo)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "repository created successfully", result)
}

func UpdateRepository(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid repository id")
		return
	}

	var req UpdateRepositoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	repo := &services.UpdateRepositoryRequest{
		Name:       req.Name,
		URL:        req.URL,
		Branch:     req.Branch,
		Credential: req.Credential,
	}

	result, err := gitService.Update(uint(id), repo)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "repository updated successfully", result)
}

func DeleteRepository(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid repository id")
		return
	}

	if err := gitService.Delete(uint(id)); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "repository deleted successfully", nil)
}

func TestRepository(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid repository id")
		return
	}

	result, err := gitService.TestConnection(uint(id))
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, result)
}
