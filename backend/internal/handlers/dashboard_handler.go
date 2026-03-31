package handlers

import (
	"github.com/cicd-platform/backend/internal/services"
	"github.com/cicd-platform/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var dashboardService = services.NewDashboardService()

func GetDashboardStats(c *gin.Context) {
	stats, err := dashboardService.GetDashboardStats()
	if err != nil {
		response.InternalServerError(c, "failed to get dashboard stats")
		return
	}

	response.Success(c, stats)
}
