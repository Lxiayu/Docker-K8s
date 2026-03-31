# CI/CD Platform - 快速开始指南

## 🚀 快速开始

本指南将帮助您在 10 分钟内快速部署 CI/CD Platform。

### 前置要求

确保您的系统已安装以下工具：

- **Docker** 24.0+
- **kubectl** 1.28+
- **Helm** 3.12+
- **Go** 1.21+ (开发)
- **Node.js** 18+ (开发)

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd Docker-K8s

# 添加执行权限
chmod +x deploy-all.sh verify-system.sh uninstall-all.sh

# 一键部署所有组件
./deploy-all.sh
```

### 分步部署

如果需要分步部署或自定义配置：

#### 1. 部署 Kubernetes 集群

```bash
cd kubernetes
./scripts/setup-cluster.sh
./scripts/check-status.sh
cd ..
```

#### 2. 部署 Harbor 镜像仓库

```bash
cd harbor
./deploy.sh
cd ..
```

#### 3. 部署监控系统

```bash
cd monitoring
./deploy.sh
cd ..
```

#### 4. 部署日志系统

```bash
cd logging
./deploy.sh
cd ..
```

#### 5. 部署数据库

```bash
cd database
./scripts/deploy.sh
cd ..
```

#### 6. 部署应用

```bash
# 构建并推送镜像
cd backend && make docker && cd ..
cd frontend && npm install && npm run build && docker build -t cicd-platform-frontend:latest . && cd ..

# 部署应用
kubectl apply -f backend/k8s/
kubectl apply -f frontend/k8s/
```

### 验证部署

```bash
# 验证系统状态
./verify-system.sh
```

### 访问系统

部署完成后，通过以下地址访问系统：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://cicd-platform.local | Web 控制台 |
| 后端 API | http://api.cicd-platform.local | API 接口 |
| Grafana | http://grafana.local | 监控看板 |
| Harbor | http://harbor.local | 镜像仓库 |
| Kibana | http://kibana.local | 日志查询 |

### 默认账号

| 系统 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | admin123 |
| Harbor 管理员 | admin | Harbor12345 |

⚠️ **重要**: 请在首次登录后立即修改默认密码！

## 📖 使用指南

### 1. 创建第一个流水线

1. 登录系统
2. 进入"流水线"页面
3. 点击"新建流水线"
4. 填写流水线名称和配置
5. 保存并触发构建

### 2. 配置代码仓库

1. 进入"代码仓库"页面
2. 点击"添加仓库"
3. 填写 Git 仓库信息
4. 测试连接
5. 配置 Webhook

### 3. 部署应用

1. 进入"部署管理"页面
2. 点击"创建部署"
3. 选择镜像和配置
4. 选择部署策略
5. 执行部署

## 🔧 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 运行开发服务器
make run

# 运行测试
make test

# 构建生产版本
make build
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🐛 故障排查

### 常见问题

#### 1. Pod 一直处于 Pending 状态

```bash
# 检查 Pod 状态
kubectl describe pod <pod-name> -n <namespace>

# 检查节点资源
kubectl describe nodes

# 检查存储
kubectl get pv,pvc
```

#### 2. 服务无法访问

```bash
# 检查 Ingress
kubectl get ingress --all-namespaces

# 检查 Service
kubectl get svc --all-namespaces

# 查看 Ingress 日志
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

#### 3. 镜像拉取失败

```bash
# 检查 Harbor 状态
kubectl get pods -n harbor-system

# 检查镜像是否存在
curl -u admin:Harbor12345 http://harbor.local/api/v2.0/projects

# 配置 Docker 信任证书
sudo mkdir -p /etc/docker/certs.d/harbor.local
sudo cp harbor/certs/ca.crt /etc/docker/certs.d/harbor.local/
sudo systemctl restart docker
```

### 查看日志

```bash
# 查看后端日志
kubectl logs -f -n cicd-system -l app=backend

# 查看前端日志
kubectl logs -f -n cicd-system -l app=frontend

# 查看所有日志
kubectl logs -f --all-namespaces -l app
```

## 🗑️ 卸载系统

```bash
# 完全卸载（包括数据）
./uninstall-all.sh
```

## 📚 更多文档

- [部署文档](docs/deployment.md)
- [API 文档](docs/api.md)
- [运维手册](docs/operations.md)
- [故障排查](docs/troubleshooting.md)

## 💬 获取帮助

- GitHub Issues: <repository-url>/issues
- 文档: <repository-url>/wiki

## 📝 下一步

- [ ] 配置自定义域名和证书
- [ ] 创建第一个流水线
- [ ] 配置监控告警
- [ ] 设置备份策略
- [ ] 阅读最佳实践文档

祝您使用愉快！🎉
