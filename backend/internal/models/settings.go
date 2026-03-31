package models

import (
	"time"

	"gorm.io/gorm"
)

type Settings struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Key         string         `gorm:"uniqueIndex;size:100;not null" json:"key"`
	Value       string         `gorm:"type:text" json:"value"`
	Category    string         `gorm:"size:50;not null;index" json:"category"`
	Description string         `gorm:"size:255" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
