package services

import (
	"errors"

	"github.com/cicd-platform/backend/internal/models"
	"github.com/cicd-platform/backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
	Status   int    `json:"status"`
}

type UpdateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Status   *int   `json:"status"`
}

type ListUsersQuery struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	Username string `form:"username"`
	Email    string `form:"email"`
	Role     string `form:"role"`
	Status   *int   `form:"status"`
}

func (s *UserService) List(query *ListUsersQuery) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	db := database.Get().Model(&models.User{})

	if query.Username != "" {
		db = db.Where("username LIKE ?", "%"+query.Username+"%")
	}
	if query.Email != "" {
		db = db.Where("email LIKE ?", "%"+query.Email+"%")
	}
	if query.Role != "" {
		db = db.Where("role = ?", query.Role)
	}
	if query.Status != nil {
		db = db.Where("status = ?", *query.Status)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (s *UserService) GetByID(id uint) (*models.User, error) {
	var user models.User
	if err := database.Get().First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) Create(req *CreateUserRequest) (*models.User, error) {
	var count int64
	database.Get().Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("username or email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	if req.Role == "" {
		req.Role = "user"
	}
	if req.Status == 0 {
		req.Status = 1
	}

	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
		Status:   req.Status,
	}

	if err := database.Get().Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) Update(id uint, req *UpdateUserRequest) (*models.User, error) {
	user, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})

	if req.Email != "" && req.Email != user.Email {
		var count int64
		database.Get().Model(&models.User{}).Where("email = ? AND id != ?", req.Email, id).Count(&count)
		if count > 0 {
			return nil, errors.New("email already exists")
		}
		updates["email"] = req.Email
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		updates["password"] = string(hashedPassword)
	}

	if req.Role != "" {
		updates["role"] = req.Role
	}

	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) > 0 {
		if err := database.Get().Model(user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *UserService) Delete(id uint) error {
	user, err := s.GetByID(id)
	if err != nil {
		return err
	}

	return database.Get().Delete(user).Error
}

type UpdateProfileRequest struct {
	Email string `json:"email"`
}

func (s *UserService) UpdateProfile(id uint, req *UpdateProfileRequest) (*models.User, error) {
	user, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})

	if req.Email != "" && req.Email != user.Email {
		var count int64
		database.Get().Model(&models.User{}).Where("email = ? AND id != ?", req.Email, id).Count(&count)
		if count > 0 {
			return nil, errors.New("email already exists")
		}
		updates["email"] = req.Email
	}

	if len(updates) > 0 {
		if err := database.Get().Model(user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return user, nil
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func (s *UserService) ChangePassword(id uint, req *ChangePasswordRequest) error {
	user, err := s.GetByID(id)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return errors.New("old password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return database.Get().Model(user).Update("password", string(hashedPassword)).Error
}
