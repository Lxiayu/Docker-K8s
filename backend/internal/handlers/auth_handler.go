package handlers

import (
	"strconv"

	"backend/internal/middleware"
	"backend/internal/services"
	"backend/pkg/response"
	"github.com/gin-gonic/gin"
)

var authService = services.NewAuthService()
var userService = services.NewUserService()
var rbacService = services.NewRBACService()

// Login godoc
// @Summary 用户登录
// @Description 用户登录并获取认证令牌
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body services.LoginRequest true "登录请求"
// @Success 200 {object} response.Response{data=services.LoginResponse} "登录成功"
// @Failure 400 {object} response.Response "请求参数错误"
// @Failure 401 {object} response.Response "登录失败"
// @Router /api/v1/auth/login [post]

// Register godoc
// @Summary 用户注册
// @Description 注册新用户
// @Tags 认证
// @Accept json
// @Produce json
// @Param request body services.RegisterRequest true "注册请求"
// @Success 200 {object} response.Response{data=services.User} "注册成功"
// @Failure 400 {object} response.Response "请求参数错误"
// @Router /api/v1/auth/register [post]

// GetCurrentUser godoc
// @Summary 获取当前用户
// @Description 获取当前登录用户的信息
// @Tags 用户
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} response.Response{data=services.User} "获取成功"
// @Failure 401 {object} response.Response "未授权"
// @Failure 404 {object} response.Response "用户不存在"
// @Router /api/v1/users/me [get]

// UpdateProfile godoc
// @Summary 更新个人资料
// @Description 更新当前登录用户的个人资料
// @Tags 用户
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body services.UpdateProfileRequest true "更新请求"
// @Success 200 {object} response.Response{data=services.User} "更新成功"
// @Failure 400 {object} response.Response "请求参数错误"
// @Failure 401 {object} response.Response "未授权"
// @Router /api/v1/users/me [put]

// ChangePassword godoc
// @Summary 修改密码
// @Description 修改当前登录用户的密码
// @Tags 用户
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body services.ChangePasswordRequest true "修改密码请求"
// @Success 200 {object} response.Response "修改成功"
// @Failure 400 {object} response.Response "请求参数错误"
// @Failure 401 {object} response.Response "未授权"
// @Router /api/v1/users/me/password [put]

func Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	result, err := authService.Login(&req)
	if err != nil {
		response.Error(c, 401, err.Error())
		return
	}

	response.Success(c, result)
}

func Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	user, err := authService.Register(&req)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "user registered successfully", user)
}

func ListUsers(c *gin.Context) {
	var query services.ListUsersQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "invalid query parameters")
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 10
	}

	users, total, err := userService.List(&query)
	if err != nil {
		response.InternalServerError(c, "failed to list users")
		return
	}

	response.SuccessPage(c, users, total, query.Page, query.PageSize)
}

func GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	user, err := userService.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, user)
}

func CreateUser(c *gin.Context) {
	var req services.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	user, err := userService.Create(&req)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "user created successfully", user)
}

func UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	var req services.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	user, err := userService.Update(uint(id), &req)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "user updated successfully", user)
}

func DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	if err := userService.Delete(uint(id)); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "user deleted successfully", nil)
}

func GetCurrentUser(c *gin.Context) {
	userID := c.GetUint("user_id")

	user, err := userService.GetByID(userID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	response.Success(c, user)
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req services.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	user, err := userService.UpdateProfile(userID, &req)
	if err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "profile updated successfully", user)
}

func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req services.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request parameters")
		return
	}

	if err := userService.ChangePassword(userID, &req); err != nil {
		response.Error(c, 400, err.Error())
		return
	}

	response.SuccessWithMessage(c, "password changed successfully", nil)
}

func RequirePermission(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id")

		hasPermission, err := rbacService.CheckPermission(userID, resource, action)
		if err != nil {
			response.InternalServerError(c, "failed to check permission")
			c.Abort()
			return
		}

		if !hasPermission {
			response.Forbidden(c, "permission denied")
			c.Abort()
			return
		}

		c.Next()
	}
}

func init() {
	_ = middleware.GenerateToken
}
