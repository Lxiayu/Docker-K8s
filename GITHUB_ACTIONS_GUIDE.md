# GitHub Actions CI/CD 工作流指南

## 概述

本指南介绍如何使用GitHub Actions工作流来执行CI/CD操作，解决本地测试压力大的问题。通过将构建、测试、部署和回滚等操作移至GitHub Actions，您可以：

- 解放本地开发环境，专注于代码开发
- 利用GitHub的基础设施进行构建和测试
- 实现自动化部署和回滚
- 在不同环境中进行测试

## 工作流功能

### 核心功能

1. **自动构建**：代码推送时自动构建后端和前端
2. **自动测试**：运行单元测试和代码检查
3. **镜像构建**：构建并推送Docker镜像到GitHub Container Registry
4. **自动部署**：部署到指定的Kubernetes环境
5. **一键回滚**：轻松回滚到之前的版本

### 支持的环境

- **开发环境** (dev)
- **测试环境** (test)
- **生产环境** (prod)

## 工作流配置

### 配置文件

- `.github/workflows/ci-cd.yml` - 主要的CI/CD工作流配置
- `.github/SETUP_GUIDE.md` - 详细的设置指南
- `kubernetes/backend-deployment.yaml` - 后端部署配置
- `kubernetes/frontend-deployment.yaml` - 前端部署配置

### 工作流触发方式

1. **自动触发**：
   - 推送到 main、develop 或 feature 分支
   - 对 main 或 develop 分支的拉取请求

2. **手动触发**：
   - 从GitHub Actions界面手动运行
   - 可以选择目标环境和回滚选项

## 使用指南

### 1. 初始设置

按照 [.github/SETUP_GUIDE.md](file:///workspace/.github/SETUP_GUIDE.md) 中的说明设置GitHub Secrets和Kubernetes集群。

### 2. 代码推送

当您推送代码到支持的分支时，工作流会自动运行：

```bash
git push origin feature/my-feature
```

### 3. 手动部署

1. 进入GitHub仓库的Actions标签页
2. 选择"CI/CD Pipeline"
3. 点击"Run workflow"
4. 选择目标环境
5. 点击"Run workflow"

### 4. 回滚操作

1. 进入GitHub仓库的Actions标签页
2. 选择"CI/CD Pipeline"
3. 点击"Run workflow"
4. 选择目标环境
5. 将"Rollback to previous version"设置为true
6. 点击"Run workflow"

## 优势

### 1. 解放本地环境

- **无需本地构建**：构建过程在GitHub服务器上执行
- **无需本地测试**：测试在GitHub服务器上运行
- **无需本地Kubernetes**：部署在远程集群中执行

### 2. 自动化流程

- **代码提交即构建**：确保每次提交都能正常构建
- **自动测试**：捕获代码问题早期
- **自动部署**：减少手动部署错误
- **一键回滚**：快速回滚到稳定版本

### 3. 环境隔离

- **开发环境**：用于开发测试
- **测试环境**：用于集成测试
- **生产环境**：用于生产部署

### 4. 可扩展性

- **水平扩展**：Kubernetes部署支持自动扩缩容
- **并行构建**：GitHub Actions支持并行任务
- **自定义工作流**：可根据需要扩展工作流

## 监控和调试

### 工作流日志

- 在GitHub Actions界面查看详细的构建和部署日志
- 每个步骤的执行状态和输出

### Kubernetes监控

```bash
# 查看部署状态
kubectl get deployments -n cicd-<environment>

# 查看Pod状态
kubectl get pods -n cicd-<environment>

# 查看服务状态
kubectl get services -n cicd-<environment>

# 查看日志
kubectl logs -n cicd-<environment> deployment/cicd-backend
kubectl logs -n cicd-<environment> deployment/cicd-frontend
```

## 常见问题

### 1. 工作流失败

- **检查日志**：查看GitHub Actions日志找出失败原因
- **检查Secret**：确保所有必要的Secret都已设置
- **检查Kubernetes配置**：确保kubeconfig正确

### 2. 部署失败

- **检查资源**：确保集群有足够的资源
- **检查网络**：确保集群网络正常
- **检查配置**：确保部署配置正确

### 3. 回滚失败

- **检查历史版本**：确保有可回滚的历史版本
- **检查权限**：确保GitHub Actions有足够的权限

## 结论

通过使用GitHub Actions工作流，您可以：

- **专注于开发**：将构建、测试和部署交给自动化流程
- **提高可靠性**：标准化的流程减少人为错误
- **加速迭代**：快速构建和部署缩短开发周期
- **降低风险**：一键回滚功能提供安全保障

这种方法完全解决了本地测试压力大的问题，同时提供了更专业、更可靠的CI/CD流程。