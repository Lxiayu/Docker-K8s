package services

import (
	"errors"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	Token    string      `json:"token"`
	User     *models.User `json:"user"`
	ExpireAt time.Time   `json:"expire_at"`
}

func (s *AuthService) Login(req *LoginRequest) (*LoginResponse, error) {
	var user models.User
	if err := database.Get().Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	if user.Status != 1 {
		return nil, errors.New("user is disabled")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid password")
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:    token,
		User:     &user,
		ExpireAt: time.Now().Add(24 * time.Hour),
	}, nil
}

func (s *AuthService) Register(req *RegisterRequest) (*models.User, error) {
	var count int64
	database.Get().Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("username or email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "user",
		Status:   1,
	}

	if err := database.Get().Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := database.Get().First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*middleware.Claims, error) {
	claims := &middleware.Claims{}
	token, err := middleware.ParseToken(tokenString, claims)
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
