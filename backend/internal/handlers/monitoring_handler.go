package handlers

import (
	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var monitoringService = services.NewMonitoringService("http://prometheus:9090")

type CreateAlertRuleRequest struct {
	Name        string            `json:"name" binding:"required"`
	Query       string            `json:"query" binding:"required"`
	Duration    string            `json:"duration"`
	Severity    string            `json:"severity"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

func GetMetrics(c *gin.Context) {
	namespace := c.Query("namespace")
	serviceName := c.Query("service")

	metrics := make(map[string]interface{})

	if namespace != "" {
		cpuUsage, err := monitoringService.GetCPUUsage(c.Request.Context(), namespace)
		if err == nil {
			metrics["cpu_usage"] = cpuUsage
		}

		memUsage, err := monitoringService.GetMemoryUsage(c.Request.Context(), namespace)
		if err == nil {
			metrics["memory_usage"] = memUsage
		}

		podStatus, err := monitoringService.GetPodStatus(c.Request.Context(), namespace)
		if err == nil {
			metrics["pod_status"] = podStatus
		}
	}

	if serviceName != "" {
		reqRate, err := monitoringService.GetHTTPRequestRate(c.Request.Context(), serviceName)
		if err == nil {
			metrics["http_request_rate"] = reqRate
		}

		errRate, err := monitoringService.GetErrorRate(c.Request.Context(), serviceName)
		if err == nil {
			metrics["error_rate"] = errRate
		}
	}

	response.Success(c, metrics)
}

func ListAlerts(c *gin.Context) {
	alerts, err := monitoringService.GetAlerts(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "failed to get alerts")
		return
	}

	response.Success(c, alerts)
}

func CreateAlertRule(c *gin.Context) {
	var req CreateAlertRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	rule := services.AlertRule{
		Name:        req.Name,
		Query:       req.Query,
		Duration:    req.Duration,
		Severity:    req.Severity,
		Labels:      req.Labels,
		Annotations: req.Annotations,
	}

	if err := monitoringService.CreateAlertRule(rule); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "alert rule created successfully", rule)
}
