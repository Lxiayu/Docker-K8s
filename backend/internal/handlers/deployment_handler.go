package handlers

import (
	"strconv"

	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var k8sService *services.K8sService

func init() {
	var err error
	k8sService, err = services.NewK8sService()
	if err != nil {
		k8sService = nil
	}
}

type CreateDeploymentRequest struct {
	Name        string `json:"name" binding:"required"`
	Namespace   string `json:"namespace" binding:"required"`
	Image       string `json:"image" binding:"required"`
	Replicas    int32  `json:"replicas"`
	Port        int32  `json:"port"`
	Environment string `json:"environment"`
	Description string `json:"description"`
}

type UpdateDeploymentRequest struct {
	Replicas    int32  `json:"replicas"`
	Image       string `json:"image"`
	Environment string `json:"environment"`
	Description string `json:"description"`
}

func ListDeployments(c *gin.Context) {
	var query services.ListDeploymentsQuery
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

	deployments, total, err := k8sService.ListDeploymentRecords(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list deployments")
		return
	}

	response.SuccessPage(c, deployments, total, query.Page, query.PageSize)
}

func GetDeployment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	deployment, err := k8sService.GetDeploymentRecord(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, deployment)
}

func CreateDeployment(c *gin.Context) {
	var req CreateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	if req.Replicas == 0 {
		req.Replicas = 1
	}

	deployment := &services.DeploymentRequest{
		Name:        req.Name,
		Namespace:   req.Namespace,
		Image:       req.Image,
		Replicas:    req.Replicas,
		Port:        req.Port,
		Environment: req.Environment,
		Description: req.Description,
	}

	userID := c.GetUint("user_id")
	result, err := k8sService.CreateDeploymentRecord(deployment, userID)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "deployment created successfully", result)
}

func UpdateDeployment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	var req UpdateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	deployment := &services.DeploymentRequest{
		Image:       req.Image,
		Replicas:    req.Replicas,
		Environment: req.Environment,
		Description: req.Description,
	}

	result, err := k8sService.UpdateDeploymentRecord(uint(id), deployment)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "deployment updated successfully", result)
}

func DeleteDeployment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	if err := k8sService.DeleteDeploymentRecord(uint(id)); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "deployment deleted successfully", nil)
}

func Deploy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	var req services.DeployRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = services.DeployRequest{}
	}

	userID := c.GetUint("user_id")
	result, err := k8sService.DeployToK8s(uint(id), &req, userID)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "deployment started successfully", result)
}

func RollbackDeployment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	var req services.RollbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = services.RollbackRequest{}
	}

	userID := c.GetUint("user_id")
	result, err := k8sService.RollbackDeploymentRecord(uint(id), &req, userID)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "rollback started successfully", result)
}

func GetDeploymentLogs(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	var query services.LogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "invalid query parameters")
		return
	}

	logs, err := k8sService.GetDeploymentLogRecords(uint(id), &query)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, logs)
}

func GetDeploymentPods(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	deployment, err := k8sService.GetDeploymentRecord(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	pods, err := k8sService.GetDeploymentPods(deployment.Namespace, deployment.Name)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, pods)
}

func GetDeploymentEvents(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	deployment, err := k8sService.GetDeploymentRecord(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	events, err := k8sService.GetDeploymentEvents(deployment.Namespace, deployment.Name)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, events)
}

type PodLogQuery struct {
	Pod       string `form:"pod" binding:"required"`
	Container string `form:"container"`
	TailLines int64  `form:"tail_lines"`
}

func GetPodLogs(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	var query PodLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "invalid query parameters")
		return
	}

	deployment, err := k8sService.GetDeploymentRecord(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	tailLines := query.TailLines
	if tailLines == 0 {
		tailLines = 500
	}

	logs, err := k8sService.GetPodLogsByContainer(deployment.Namespace, query.Pod, query.Container, tailLines)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, gin.H{"logs": logs})
}

func GetPodContainers(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid deployment id")
		return
	}

	podName := c.Query("pod")
	if podName == "" {
		response.BadRequest(c, "pod name is required")
		return
	}

	deployment, err := k8sService.GetDeploymentRecord(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	containers, err := k8sService.GetPodContainers(deployment.Namespace, podName)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.Success(c, containers)
}
