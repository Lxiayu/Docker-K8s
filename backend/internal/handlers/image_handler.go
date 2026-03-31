package handlers

import (
	"strconv"

	"github.com/cicd-platform/backend/internal/services"
	"github.com/cicd-platform/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var harborService *services.HarborService

func init() {
	harborService = services.NewHarborService("", "", "", "")
}

var buildService = services.NewBuildService()

type BuildImageRequest struct {
	Name        string `json:"name" binding:"required"`
	Dockerfile  string `json:"dockerfile"`
	Context     string `json:"context"`
	Tag         string `json:"tag"`
	RepositoryID uint   `json:"repository_id"`
}

func ListImages(c *gin.Context) {
	var query services.ListImagesQuery
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

	images, total, err := harborService.ListImages(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list images")
		return
	}

	response.SuccessPage(c, images, total, query.Page, query.PageSize)
}

func GetImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid image id")
		return
	}

	image, err := harborService.GetImage(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, image)
}

func BuildImage(c *gin.Context) {
	var req BuildImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	buildReq := &services.BuildRequest{
		Name:         req.Name,
		Dockerfile:   req.Dockerfile,
		ContextPath:  req.Context,
		Tag:          req.Tag,
		RepositoryID: req.RepositoryID,
	}

	userID := c.GetUint("user_id")
	result, err := buildService.Build(buildReq, userID)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "image build started successfully", result)
}

func ScanImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid image id")
		return
	}

	result, err := harborService.ScanImageRecord(uint(id))
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "image scan started successfully", result)
}
