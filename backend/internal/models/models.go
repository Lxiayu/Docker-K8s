package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email     string         `gorm:"uniqueIndex;size:100;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Role      string         `gorm:"size:20;default:'user'" json:"role"`
	Status    int            `gorm:"default:1" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Role struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Description string         `gorm:"size:255" json:"description"`
	Permissions []Permission   `gorm:"many2many:role_permissions;" json:"permissions"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Permission struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Resource    string         `gorm:"size:100;not null" json:"resource"`
	Action      string         `gorm:"size:20;not null" json:"action"`
	Description string         `gorm:"size:255" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type GitRepository struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	URL         string         `gorm:"size:255;not null" json:"url"`
	Type        string         `gorm:"size:20;not null" json:"type"`
	Branch      string         `gorm:"size:50;default:'main'" json:"branch"`
	Credential  string         `gorm:"size:255" json:"-"`
	WebhookURL  string         `gorm:"size:255" json:"webhook_url"`
	WebhookKey  string         `gorm:"size:100" json:"-"`
	Status      int            `gorm:"default:1" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Pipeline struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	RepoID      uint           `gorm:"not null" json:"repo_id"`
	Config      string         `gorm:"type:text" json:"config"`
	Status      string         `gorm:"size:20;default:'idle'" json:"status"`
	LastBuildAt *time.Time     `json:"last_build_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Build struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	PipelineID uint           `gorm:"not null;index" json:"pipeline_id"`
	CommitHash string         `gorm:"size:40" json:"commit_hash"`
	Branch     string         `gorm:"size:50" json:"branch"`
	Status     string         `gorm:"size:20;default:'pending'" json:"status"`
	Log        string         `gorm:"type:text" json:"log"`
	Duration   int            `json:"duration"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type Deployment struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Namespace   string         `gorm:"size:50;not null" json:"namespace"`
	Image       string         `gorm:"size:255;not null" json:"image"`
	Replicas    int            `gorm:"default:1" json:"replicas"`
	Strategy    string         `gorm:"size:20;default:'rolling'" json:"strategy"`
	Status      string         `gorm:"size:20;default:'pending'" json:"status"`
	Environment string         `gorm:"size:20;not null" json:"environment"`
	Config      string         `gorm:"type:text" json:"config"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Username  string    `gorm:"size:50" json:"username"`
	Action    string    `gorm:"size:50;not null" json:"action"`
	Resource  string    `gorm:"size:100;not null" json:"resource"`
	Method    string    `gorm:"size:10" json:"method"`
	Path      string    `gorm:"size:255" json:"path"`
	IP        string    `gorm:"size:50" json:"ip"`
	UserAgent string    `gorm:"size:255" json:"user_agent"`
	Status    int       `json:"status"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Role{},
		&Permission{},
		&GitRepository{},
		&Pipeline{},
		&Build{},
		&Deployment{},
		&AuditLog{},
		&Settings{},
	)
}
