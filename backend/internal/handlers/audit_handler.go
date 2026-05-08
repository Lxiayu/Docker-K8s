package handlers

import (
	"strconv"

	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type AuditLog struct {
	ID           int    `json:"id"`
	UserID       int    `json:"user_id"`
	Username     string `json:"username"`
	Action       string `json:"action"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	Details      string `json:"details"`
	IPAddress    string `json:"ip_address"`
	CreatedAt    string `json:"created_at"`
}

func ListAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	response.SuccessPage(c, []AuditLog{}, 0, page, pageSize)
}
