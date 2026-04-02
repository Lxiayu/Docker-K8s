#!/bin/bash

set -e

echo "=== 验证所有改进是否生效 ==="
echo

# 1. 验证后端测试框架
echo "1. 验证后端测试框架"
echo "------------------------"
cd backend
if go test -v ./pkg/config; then
    echo "✓ 后端测试框架正常工作"
else
    echo "✗ 后端测试框架失败"
    exit 1
fi
echo

# 2. 验证前端测试框架
echo "2. 验证前端测试框架"
echo "------------------------"
cd ../frontend
if npm test; then
    echo "✓ 前端测试框架正常工作"
else
    echo "✗ 前端测试框架失败"
    exit 1
fi
echo

# 3. 验证安全扫描集成
echo "3. 验证安全扫描集成"
echo "------------------------"
cd ../
if [ -f ".github/workflows/full-ci-cd.yml" ]; then
    if grep -q "gosec" .github/workflows/full-ci-cd.yml && grep -q "npm audit" .github/workflows/full-ci-cd.yml; then
        echo "✓ 安全扫描已集成到CI/CD"
    else
        echo "✗ 安全扫描未集成到CI/CD"
        exit 1
    fi
else
    echo "✗ GitHub Actions配置文件不存在"
    exit 1
fi
echo

# 4. 验证API性能监控
echo "4. 验证API性能监控"
echo "------------------------"
cd backend
if grep -q "PerformanceMonitor" internal/middleware/performance.go; then
    echo "✓ API性能监控中间件已创建"
else
    echo "✗ API性能监控中间件未创建"
    exit 1
fi

if grep -q "middleware.PerformanceMonitor()" cmd/server/main.go; then
    echo "✓ API性能监控中间件已集成到主应用"
else
    echo "✗ API性能监控中间件未集成到主应用"
    exit 1
fi
echo

# 5. 验证Redis缓存
echo "5. 验证Redis缓存"
echo "------------------------"
if [ -f "pkg/redis/redis.go" ]; then
    echo "✓ Redis缓存包已创建"
else
    echo "✗ Redis缓存包未创建"
    exit 1
fi

if grep -q "redis.Init" cmd/server/main.go; then
    echo "✓ Redis缓存已集成到主应用"
else
    echo "✗ Redis缓存未集成到主应用"
    exit 1
fi

cd ../
if [ -f "kubernetes/redis-deployment.yaml" ] && [ -f "kubernetes/redis-service.yaml" ]; then
    echo "✓ Redis Kubernetes配置已创建"
else
    echo "✗ Redis Kubernetes配置未创建"
    exit 1
fi
echo

# 6. 验证API文档
echo "6. 验证API文档"
echo "------------------------"
cd backend
if [ -f "docs/swagger.json" ] && [ -f "docs/swagger.yaml" ]; then
    echo "✓ API文档已生成"
else
    echo "✗ API文档未生成"
    exit 1
fi

if grep -q "swagger" internal/router/router.go; then
    echo "✓ API文档路由已集成"
else
    echo "✗ API文档路由未集成"
    exit 1
fi
echo

# 7. 验证蓝绿部署和金丝雀发布
echo "7. 验证蓝绿部署和金丝雀发布"
echo "------------------------"
cd ../
if [ -f "kubernetes/backend-blue-green-deployment.yaml" ] && [ -f "kubernetes/frontend-blue-green-deployment.yaml" ]; then
    echo "✓ 蓝绿部署配置已创建"
else
    echo "✗ 蓝绿部署配置未创建"
    exit 1
fi

if [ -f "kubernetes/canary-deployment.yaml" ]; then
    echo "✓ 金丝雀发布配置已创建"
else
    echo "✗ 金丝雀发布配置未创建"
    exit 1
fi

if grep -q "blue-green" .github/workflows/full-ci-cd.yml; then
    echo "✓ 蓝绿部署已集成到CI/CD"
else
    echo "✗ 蓝绿部署未集成到CI/CD"
    exit 1
fi
echo

# 8. 验证GitHub Actions配置
echo "8. 验证GitHub Actions配置"
echo "------------------------"
if [ -f ".github/workflows/full-ci-cd.yml" ]; then
    echo "✓ GitHub Actions配置文件存在"
else
    echo "✗ GitHub Actions配置文件不存在"
    exit 1
fi

echo
 echo "=== 所有改进验证完成 ==="
echo "✓ 所有改进都已成功实现并集成"
