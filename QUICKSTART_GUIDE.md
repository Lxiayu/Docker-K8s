# CI/CD平台快速启动指南

## 概述

本指南帮助您快速启动和运行CI/CD平台。所有配置已经过全面检查和修复，确保程序真正可用。

## 已修复的问题

### 1. GitHub Actions工作流配置
- ✓ 添加了kubectl版本固定（v1.28.0）
- ✓ 添加了kubeconfig目录创建和权限设置
- ✓ 添加了集群连接验证
- ✓ 改进了secrets创建流程
- ✓ 添加了部署等待和状态检查
- ✓ 添加了回滚验证步骤
- ✓ 添加了测试作业

### 2. Kubernetes部署配置
- ✓ 修复了数据库主机名（使用完整的K8s服务名）
- ✓ 修复了数据库用户名（与数据库secret一致）
- ✓ 添加了健康检查超时和失败阈值
- ✓ 移除了前端不必要的env配置
- ✓ 创建了secrets模板文件

### 3. 前端nginx配置
- ✓ 修复了后端服务名称（cicd-backend）
- ✓ 添加了代理超时设置
- ✓ 添加了健康检查端点

### 4. 数据库配置
- ✓ 验证了数据库初始化脚本
- ✓ 确认了数据库secret配置正确

## 快速启动步骤

### 步骤1：准备GitHub Secrets

在GitHub仓库中设置以下Secrets（Settings → Secrets and variables → Actions）：

| Secret名称 | 描述 | 获取方式 |
|-----------|------|----------|
| `KUBE_CONFIG` | Kubernetes集群配置 | `cat ~/.kube/config \| base64 -w 0` |
| `DOCKER_USERNAME` | Docker Hub用户名 | 您的Docker Hub用户名 |
| `DOCKER_PASSWORD` | Docker Hub密码 | 您的Docker Hub密码或访问令牌 |
| `DATABASE_PASSWORD` | 数据库密码 | 自定义一个强密码 |
| `JWT_SECRET` | JWT密钥 | 生成一个随机字符串 |

### 步骤2：推送代码到GitHub

```bash
git add .
git commit -m "Fix CI/CD platform configuration"
git push origin main
```

### 步骤3：运行GitHub Actions工作流

1. 进入GitHub仓库 → Actions → Full CI/CD Pipeline
2. 点击"Run workflow"
3. 选择环境：`dev`
4. 选择操作：`provision`（首次部署）
5. 点击"Run workflow"

### 步骤4：部署应用

1. 等待provision完成
2. 再次运行工作流，选择操作：`deploy`
3. 等待部署完成

### 步骤5：访问应用

```bash
# 获取前端服务地址
kubectl get service cicd-frontend -n cicd-dev

# 获取后端服务地址
kubectl get service cicd-backend -n cicd-dev
```

## 验证配置

运行验证脚本确保所有配置正确：

```bash
./validate-config.sh
```

## 常见问题排查

### 问题1：数据库连接失败
**原因**：数据库服务未启动或secret配置错误
**解决方案**：
```bash
kubectl get pods -n database
kubectl logs -n database postgres-0
kubectl get secrets -n database
```

### 问题2：前端无法访问后端API
**原因**：nginx配置错误或服务名称不匹配
**解决方案**：
```bash
kubectl get services -n cicd-dev
kubectl logs -n cicd-dev deployment/cicd-frontend
```

### 问题3：部署超时
**原因**：镜像拉取失败或资源不足
**解决方案**：
```bash
kubectl describe pods -n cicd-dev
kubectl get events -n cicd-dev
```

## 文件结构

```
.
├── .github/
│   ├── workflows/
│   │   └── full-ci-cd.yml       # GitHub Actions工作流
│   └── SETUP_GUIDE.md           # 设置指南
├── kubernetes/
│   ├── backend-deployment.yaml  # 后端部署配置
│   ├── frontend-deployment.yaml # 前端部署配置
│   ├── backend-service.yaml     # 后端服务
│   ├── frontend-service.yaml    # 前端服务
│   └── secrets.yaml             # Secrets模板
├── database/
│   ├── postgres/                # 数据库配置
│   └── init/init.sql            # 数据库初始化脚本
├── backend/
│   ├── Dockerfile               # 后端Dockerfile
│   └── pkg/config/config.go     # 后端配置
├── frontend/
│   ├── Dockerfile               # 前端Dockerfile
│   └── nginx.conf               # Nginx配置
├── validate-config.sh           # 配置验证脚本
├── TECHNICAL_PRINCIPLES_GUIDE.md # 技术原理指南
└── GITHUB_ACTIONS_ONLY.md       # GitHub Actions使用指南
```

## 下一步

1. **监控部署**：使用`kubectl get pods -n cicd-dev`监控部署状态
2. **查看日志**：使用`kubectl logs -n cicd-dev deployment/cicd-backend`查看应用日志
3. **配置域名**：配置Ingress以使用自定义域名
4. **设置监控**：部署Prometheus和Grafana进行监控
5. **配置备份**：设置数据库自动备份

## 支持

如有问题，请参考：
- [技术原理指南](TECHNICAL_PRINCIPLES_GUIDE.md)
- [GitHub Actions设置指南](.github/SETUP_GUIDE.md)
- [GitHub Actions使用指南](GITHUB_ACTIONS_ONLY.md)
