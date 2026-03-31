package services

import (
	"errors"

	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/pkg/database"
	"gorm.io/gorm"
)

type RBACService struct{}

func NewRBACService() *RBACService {
	return &RBACService{}
}

func (s *RBACService) CreateRole(name, description string, permissions []uint) (*models.Role, error) {
	role := &models.Role{
		Name:        name,
		Description: description,
	}

	if len(permissions) > 0 {
		var perms []models.Permission
		if err := database.Get().Find(&perms, permissions).Error; err != nil {
			return nil, err
		}
		role.Permissions = perms
	}

	if err := database.Get().Create(role).Error; err != nil {
		return nil, err
	}

	return role, nil
}

func (s *RBACService) GetRoleByID(id uint) (*models.Role, error) {
	var role models.Role
	if err := database.Get().Preload("Permissions").First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}
	return &role, nil
}

func (s *RBACService) ListRoles() ([]models.Role, error) {
	var roles []models.Role
	if err := database.Get().Preload("Permissions").Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

func (s *RBACService) UpdateRolePermissions(roleID uint, permissionIDs []uint) error {
	role, err := s.GetRoleByID(roleID)
	if err != nil {
		return err
	}

	var permissions []models.Permission
	if len(permissionIDs) > 0 {
		if err := database.Get().Find(&permissions, permissionIDs).Error; err != nil {
			return err
		}
	}

	return database.Get().Model(role).Association("Permissions").Replace(permissions)
}

func (s *RBACService) CreatePermission(name, resource, action, description string) (*models.Permission, error) {
	permission := &models.Permission{
		Name:        name,
		Resource:    resource,
		Action:      action,
		Description: description,
	}

	if err := database.Get().Create(permission).Error; err != nil {
		return nil, err
	}

	return permission, nil
}

func (s *RBACService) ListPermissions() ([]models.Permission, error) {
	var permissions []models.Permission
	if err := database.Get().Find(&permissions).Error; err != nil {
		return nil, err
	}
	return permissions, nil
}

func (s *RBACService) CheckPermission(userID uint, resource, action string) (bool, error) {
	var user models.User
	if err := database.Get().Preload("Role.Permissions").First(&user, userID).Error; err != nil {
		return false, err
	}

	if user.Role == "admin" {
		return true, nil
	}

	var role models.Role
	if err := database.Get().Where("name = ?", user.Role).Preload("Permissions").First(&role).Error; err != nil {
		return false, err
	}

	for _, perm := range role.Permissions {
		if perm.Resource == resource && perm.Action == action {
			return true, nil
		}
		if perm.Resource == "*" && perm.Action == "*" {
			return true, nil
		}
	}

	return false, nil
}
