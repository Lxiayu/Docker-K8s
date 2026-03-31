# CI/CD Platform - API 文档

## 基础信息

- **Base URL**: `http://api.cicd-platform.local/api/v1`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 认证

### 登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@cicd-platform.local",
      "role": "admin"
    },
    "expire_at": "2026-03-12T00:00:00Z"
  }
}
```

### 注册

```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

## 用户管理

### 获取用户列表

```http
GET /users?page=1&page_size=10
Authorization: Bearer <token>
```

### 获取用户详情

```http
GET /users/:id
Authorization: Bearer <token>
```

### 创建用户

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "developer"
}
```

### 更新用户

```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "role": "devops"
}
```

### 删除用户

```http
DELETE /users/:id
Authorization: Bearer <token>
```

## 代码仓库管理

### 获取仓库列表

```http
GET /repositories?page=1&page_size=10
Authorization: Bearer <token>
```

### 创建仓库

```http
POST /repositories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "frontend-app",
  "url": "https://github.com/example/frontend-app.git",
  "type": "github",
  "branch": "main"
}
```

### 测试仓库连接

```http
POST /repositories/:id/test
Authorization: Bearer <token>
```

## 流水线管理

### 获取流水线列表

```http
GET /pipelines?page=1&page_size=10
Authorization: Bearer <token>
```

### 创建流水线

```http
POST /pipelines
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "frontend-pipeline",
  "repo_id": 1,
  "config": "stages:\n  - build\n  - test\n  - deploy"
}
```

### 触发流水线

```http
POST /pipelines/:id/trigger
Authorization: Bearer <token>
```

### 获取构建历史

```http
GET /pipelines/:id/builds?page=1&page_size=10
Authorization: Bearer <token>
```

## 部署管理

### 获取部署列表

```http
GET /deployments?page=1&page_size=10&environment=prod
Authorization: Bearer <token>
```

### 创建部署

```http
POST /deployments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "frontend-app",
  "namespace": "prod",
  "image": "harbor.local/production/frontend-app:v1.0.0",
  "replicas": 3,
  "strategy": "rolling",
  "environment": "prod"
}
```

### 执行部署

```http
POST /deployments/:id/deploy
Authorization: Bearer <token>
```

### 回滚部署

```http
POST /deployments/:id/rollback
Authorization: Bearer <token>
Content-Type: application/json

{
  "target_version": "v1.0.0"
}
```

### 获取部署日志

```http
GET /deployments/:id/logs
Authorization: Bearer <token>
```

## 镜像管理

### 获取镜像列表

```http
GET /images?page=1&page_size=10
Authorization: Bearer <token>
```

### 构建镜像

```http
POST /images
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "frontend-app",
  "dockerfile": "FROM node:18\n...",
  "tag": "v1.0.0"
}
```

### 扫描镜像

```http
GET /images/:id/scan
Authorization: Bearer <token>
```

## 监控管理

### 获取监控指标

```http
GET /monitoring/metrics?app=frontend-app
Authorization: Bearer <token>
```

### 获取告警列表

```http
GET /monitoring/alerts?page=1&page_size=10
Authorization: Bearer <token>
```

### 创建告警规则

```http
POST /monitoring/alerts/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "high-cpu-usage",
  "condition": "cpu_usage > 80",
  "threshold": 80,
  "notification": ["email", "dingtalk"]
}
```

## 错误响应

所有错误响应格式：

```json
{
  "code": 400,
  "message": "错误描述"
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 分页

所有列表接口支持分页参数：

- `page`: 页码（从 1 开始）
- `page_size`: 每页数量（默认 10，最大 100）

响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "page_size": 10
  }
}
```

## OpenAPI 规范

完整的 OpenAPI 规范文档请访问：
- Swagger UI: http://api.cicd-platform.local/swagger
- OpenAPI JSON: http://api.cicd-platform.local/openapi.json
