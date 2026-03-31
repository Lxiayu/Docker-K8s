# CI/CD Platform Backend

基于 Go + Gin 框架的云原生 CI/CD 平台后端服务

## 技术栈

- **语言**: Go 1.21+
- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL
- **缓存**: Redis
- **配置管理**: Viper
- **日志**: Zap
- **认证**: JWT

## 项目结构

```
backend/
├── cmd/                    # 应用入口
│   └── server/            # 服务器主程序
├── internal/              # 私有应用代码
│   ├── handlers/         # HTTP处理器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── repository/       # 数据访问层
│   ├── router/           # 路由配置
│   └── services/         # 业务逻辑
├── pkg/                   # 公共库
│   ├── config/           # 配置管理
│   ├── database/         # 数据库连接
│   ├── errors/           # 错误定义
│   ├── logger/           # 日志系统
│   └── response/         # 统一响应
├── api/                   # API定义
├── configs/               # 配置文件
├── scripts/               # 脚本文件
├── go.mod
├── Makefile
└── Dockerfile
```

## 快速开始

### 环境要求

- Go 1.21+
- PostgreSQL 14+
- Redis 6+
- Docker (可选)

### 本地开发

1. 安装依赖
```bash
make deps
```

2. 配置数据库
```bash
# 创建数据库
createdb cicd_platform

# 或使用 psql
psql -U postgres -c "CREATE DATABASE cicd_platform;"
```

3. 修改配置文件
```bash
# 编辑 configs/config.yaml
# 修改数据库连接信息
```

4. 运行服务
```bash
make run
```

服务将在 `http://localhost:8080` 启动

### Docker 部署

1. 构建镜像
```bash
make docker
```

2. 运行容器
```bash
make docker-run
```

## API 接口

### 认证接口

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册

### 用户管理

- `GET /api/v1/users` - 用户列表
- `GET /api/v1/users/:id` - 用户详情
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 代码仓库

- `GET /api/v1/repositories` - 仓库列表
- `GET /api/v1/repositories/:id` - 仓库详情
- `POST /api/v1/repositories` - 创建仓库
- `PUT /api/v1/repositories/:id` - 更新仓库
- `DELETE /api/v1/repositories/:id` - 删除仓库
- `POST /api/v1/repositories/:id/test` - 测试连接

### 流水线管理

- `GET /api/v1/pipelines` - 流水线列表
- `GET /api/v1/pipelines/:id` - 流水线详情
- `POST /api/v1/pipelines` - 创建流水线
- `PUT /api/v1/pipelines/:id` - 更新流水线
- `DELETE /api/v1/pipelines/:id` - 删除流水线
- `POST /api/v1/pipelines/:id/trigger` - 触发流水线
- `GET /api/v1/pipelines/:id/builds` - 构建历史
- `GET /api/v1/pipelines/:id/builds/:build_id` - 构建详情

### 部署管理

- `GET /api/v1/deployments` - 部署列表
- `GET /api/v1/deployments/:id` - 部署详情
- `POST /api/v1/deployments` - 创建部署
- `PUT /api/v1/deployments/:id` - 更新部署
- `DELETE /api/v1/deployments/:id` - 删除部署
- `POST /api/v1/deployments/:id/deploy` - 执行部署
- `POST /api/v1/deployments/:id/rollback` - 回滚部署
- `GET /api/v1/deployments/:id/logs` - 部署日志

### 镜像管理

- `GET /api/v1/images` - 镜像列表
- `GET /api/v1/images/:id` - 镜像详情
- `POST /api/v1/images` - 构建镜像
- `GET /api/v1/images/:id/scan` - 扫描镜像

### 监控告警

- `GET /api/v1/monitoring/metrics` - 获取指标
- `GET /api/v1/monitoring/alerts` - 告警列表
- `POST /api/v1/monitoring/alerts/rules` - 创建告警规则

## 开发指南

### 运行测试
```bash
make test
```

### 代码检查
```bash
make lint
```

### 格式化代码
```bash
make fmt
```

## 配置说明

配置文件位于 `configs/config.yaml`，支持环境变量覆盖：

| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| server.port | SERVER_PORT | 服务端口 |
| database.host | DATABASE_HOST | 数据库地址 |
| database.port | DATABASE_PORT | 数据库端口 |
| database.user | DATABASE_USER | 数据库用户 |
| database.password | DATABASE_PASSWORD | 数据库密码 |
| database.dbname | DATABASE_DBNAME | 数据库名称 |
| jwt.secret | JWT_SECRET | JWT密钥 |

## License

MIT
