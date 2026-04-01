package handlers

import (
	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var settingsService = services.NewSettingsService()

type UpdateSettingsRequest struct {
	Settings map[string]string `json:"settings" binding:"required"`
}

func GetSettings(c *gin.Context) {
	settings, err := settingsService.GetAllSettings()
	if err != nil {
		response.InternalServerError(c, "failed to get settings")
		return
	}

	response.Success(c, settings)
}

func GetSettingsByCategory(c *gin.Context) {
	category := c.Param("category")
	if category == "" {
		response.BadRequest(c, "category is required")
		return
	}

	settings, err := settingsService.GetSettingsByCategory(category)
	if err != nil {
		response.InternalServerError(c, "failed to get settings")
		return
	}

	response.Success(c, settings)
}

func UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	settings, err := settingsService.UpdateSettings(req.Settings)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "settings updated successfully", settings)
}
