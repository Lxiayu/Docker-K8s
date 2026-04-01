package services

import (
	"errors"

	"backend/internal/models"
	"backend/pkg/database"
	"gorm.io/gorm"
)

type SettingsService struct{}

func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

func (s *SettingsService) GetSetting(key string) (*models.Settings, error) {
	var setting models.Settings
	if err := database.Get().Where("key = ?", key).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("setting not found")
		}
		return nil, err
	}
	return &setting, nil
}

func (s *SettingsService) GetSettingsByCategory(category string) ([]models.Settings, error) {
	var settings []models.Settings
	if err := database.Get().Where("category = ?", category).Order("key ASC").Find(&settings).Error; err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *SettingsService) GetAllSettings() ([]models.Settings, error) {
	var settings []models.Settings
	if err := database.Get().Order("category ASC, key ASC").Find(&settings).Error; err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *SettingsService) UpdateSetting(key string, value string) (*models.Settings, error) {
	var setting models.Settings
	if err := database.Get().Where("key = ?", key).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("setting not found")
		}
		return nil, err
	}

	setting.Value = value
	if err := database.Get().Save(&setting).Error; err != nil {
		return nil, err
	}
	return &setting, nil
}

func (s *SettingsService) UpdateSettings(settings map[string]string) ([]models.Settings, error) {
	var updatedSettings []models.Settings

	err := database.Get().Transaction(func(tx *gorm.DB) error {
		for key, value := range settings {
			var setting models.Settings
			if err := tx.Where("key = ?", key).First(&setting).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					continue
				}
				return err
			}

			setting.Value = value
			if err := tx.Save(&setting).Error; err != nil {
				return err
			}
			updatedSettings = append(updatedSettings, setting)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return updatedSettings, nil
}
