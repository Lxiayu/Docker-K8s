package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInit(t *testing.T) {
	// 测试从文件加载配置
	err := Init("../../configs/config.yaml")
	assert.NoError(t, err)
	config := Get()
	assert.NotNil(t, config)
	assert.Equal(t, 8080, config.Server.Port)
	assert.Equal(t, "localhost", config.Database.Host)
}

func TestInitFromEnv(t *testing.T) {
	// 设置环境变量
	os.Setenv("SERVER_PORT", "9090")
	os.Setenv("DATABASE_HOST", "localhost")
	os.Setenv("DATABASE_PORT", "5432")
	os.Setenv("DATABASE_USER", "testuser")
	os.Setenv("DATABASE_PASSWORD", "testpass")
	os.Setenv("DATABASE_NAME", "testdb")
	os.Setenv("JWT_SECRET", "testsecret")

	// 测试从环境变量加载配置（使用不存在的配置文件路径）
	err := Init("nonexistent-config.yaml")
	assert.NoError(t, err)
	config := Get()
	assert.NotNil(t, config)
	assert.Equal(t, 9090, config.Server.Port)
	assert.Equal(t, "localhost", config.Database.Host)
	assert.Equal(t, 5432, config.Database.Port)
	assert.Equal(t, "testuser", config.Database.User)
	assert.Equal(t, "testpass", config.Database.Password)
	assert.Equal(t, "testdb", config.Database.DBName)
	assert.Equal(t, "testsecret", config.JWT.Secret)

	// 清理环境变量
	os.Unsetenv("SERVER_PORT")
	os.Unsetenv("DATABASE_HOST")
	os.Unsetenv("DATABASE_PORT")
	os.Unsetenv("DATABASE_USER")
	os.Unsetenv("DATABASE_PASSWORD")
	os.Unsetenv("DATABASE_NAME")
	os.Unsetenv("JWT_SECRET")
}

func TestGet(t *testing.T) {
	// 初始化配置
	err := Init("../../configs/config.yaml")
	assert.NoError(t, err)

	// 测试获取配置
	config := Get()
	assert.NotNil(t, config)
	assert.Equal(t, 8080, config.Server.Port)
}
