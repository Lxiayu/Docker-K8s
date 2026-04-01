package redis

import (
	"context"
	"fmt"
	"time"

	"backend/pkg/config"
	"backend/pkg/logger"
	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

var (
	Client *redis.Client
	Ctx    = context.Background()
)

// Init 初始化Redis客户端
func Init(cfg *config.RedisConfig) error {
	Client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// 测试连接
	_, err := Client.Ping(Ctx).Result()
	if err != nil {
		logger.Error("Failed to connect to Redis", zap.Error(err))
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info("Redis connected successfully")
	return nil
}

// Close 关闭Redis连接
func Close() error {
	if Client != nil {
		return Client.Close()
	}
	return nil
}

// Set 设置键值对
func Set(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(Ctx, key, value, expiration).Err()
}

// Get 获取值
func Get(key string) (string, error) {
	return Client.Get(Ctx, key).Result()
}

// Delete 删除键
func Delete(key string) error {
	return Client.Del(Ctx, key).Err()
}

// Exists 检查键是否存在
func Exists(key string) (bool, error) {
	result, err := Client.Exists(Ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// Increment 自增
func Increment(key string) (int64, error) {
	return Client.Incr(Ctx, key).Result()
}

// Decrement 自减
func Decrement(key string) (int64, error) {
	return Client.Decr(Ctx, key).Result()
}

// SetWithExpiration 设置带过期时间的键值对
func SetWithExpiration(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(Ctx, key, value, expiration).Err()
}

// GetWithTTL 获取值和剩余过期时间
func GetWithTTL(key string) (string, time.Duration, error) {
	val, err := Client.Get(Ctx, key).Result()
	if err != nil {
		return "", 0, err
	}

	ttl, err := Client.TTL(Ctx, key).Result()
	if err != nil {
		return "", 0, err
	}

	return val, ttl, nil
}
