#!/bin/bash

# 验证GitHub Actions配置

echo "=== 验证GitHub Actions配置 ==="

# 检查GitHub Actions工作流文件
if [ -f ".github/workflows/full-ci-cd.yml" ]; then
    echo "✓ GitHub Actions工作流文件存在"
else
    echo "✗ GitHub Actions工作流文件不存在"
    exit 1
fi

# 检查服务配置文件
if [ -f "kubernetes/backend-service.yaml" ]; then
    echo "✓ 后端服务配置文件存在"
else
    echo "✗ 后端服务配置文件不存在"
    exit 1
fi

if [ -f "kubernetes/frontend-service.yaml" ]; then
    echo "✓ 前端服务配置文件存在"
else
    echo "✗ 前端服务配置文件不存在"
    exit 1
fi

# 检查部署配置文件
if [ -f "kubernetes/backend-deployment.yaml" ]; then
    echo "✓ 后端部署配置文件存在"
else
    echo "✗ 后端部署配置文件不存在"
    exit 1
fi

if [ -f "kubernetes/frontend-deployment.yaml" ]; then
    echo "✓ 前端部署配置文件存在"
else
    echo "✗ 前端部署配置文件不存在"
    exit 1
fi

# 检查设置指南
if [ -f ".github/SETUP_GUIDE.md" ]; then
    echo "✓ GitHub Actions设置指南存在"
else
    echo "✗ GitHub Actions设置指南不存在"
    exit 1
fi

# 检查后端配置文件
if [ -f "backend/pkg/config/config.go" ]; then
    echo "✓ 后端配置文件存在"
else
    echo "✗ 后端配置文件不存在"
    exit 1
fi

# 检查前端配置文件
if [ -f "frontend/vite.config.ts" ]; then
    echo "✓ 前端配置文件存在"
else
    echo "✗ 前端配置文件不存在"
    exit 1
fi

echo "=== 验证完成 ==="
echo "所有配置文件都已正确设置！"
echo "您现在可以完全依托于GitHub Actions运行项目了。"
echo "请参考 .github/SETUP_GUIDE.md 获取详细的设置指南。"
