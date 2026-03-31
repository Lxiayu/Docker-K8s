# 测试数据说明

本目录包含 CI/CD 平台的测试/模拟数据配置文件，用于开发和演示目的。

## 📁 目录结构

```
test_program/
├── README.md                 # 本文件 - 测试数据说明
├── mock_data.json           # 完整的模拟数据集
├── mock_api_responses.json  # API 响应示例
├── mock_users.json          # 测试用户账号
└── mock_settings.json       # 默认系统设置
```

## 🎯 用途

这些文件用于：

1. **前端开发** - 在没有后端服务时模拟 API 响应
2. **演示展示** - 提供完整的演示数据
3. **测试验证** - 作为自动化测试的数据源
4. **文档参考** - 说明系统预期的数据结构

## ⚠️ 重要说明

### 这些数据是模拟的！

以下功能/数据在当前版本中是模拟的：

| 功能模块 | 模拟内容 | 说明 |
|---------|---------|------|
| Dashboard 统计 | 构建次数、部署次数、成功率 | 数据库查询，无真实业务数据时返回默认值 |
| Monitoring 指标 | CPU、内存、网络指标 | 需要 Prometheus 连接 |
| Image 扫描 | 漏洞扫描结果 | 需要 Trivy/Harbor 扫描器 |
| Pod 日志 | 容器日志 | 需要 Kubernetes 集群连接 |
| Git 仓库测试 | 连接测试 | 需要真实 Git 仓库访问 |

### 如何使用真实数据

要使用真实数据而非模拟数据：

1. **配置 Kubernetes 集群**
   ```bash
   # 设置 kubeconfig
   export KUBECONFIG=/path/to/kubeconfig
   ```

2. **配置 Harbor 镜像仓库**
   ```bash
   # 在系统设置中配置 Harbor 地址和凭据
   ```

3. **配置 Prometheus 监控**
   ```bash
   # 在系统设置中配置 Prometheus 地址
   ```

4. **运行数据库种子**
   ```bash
   cd backend
   go run cmd/seed/main.go
   ```

## 📊 测试用户账号

| 用户名 | 密码 | 角色 | 说明 |
|-------|------|------|------|
| admin | password123 | admin | 系统管理员，拥有所有权限 |
| developer1 | password123 | developer | 开发人员，可管理流水线 |
| developer2 | password123 | developer | 开发人员 |
| devops | password123 | devops | 运维人员，可管理部署 |
| viewer | password123 | viewer | 只读用户，仅可查看 |

## 🔄 数据初始化

运行以下命令初始化测试数据：

```bash
# 进入后端目录
cd backend

# 运行种子数据脚本
go run cmd/seed/main.go
```

## 📝 数据结构参考

各 JSON 文件包含的数据结构：

### mock_data.json
完整的模拟数据，包括：
- 用户 (users)
- 代码仓库 (repositories)
- 流水线 (pipelines)
- 构建 (builds)
- 部署 (deployments)
- 镜像 (images)

### mock_api_responses.json
各 API 端点的示例响应，用于前端 Mock 服务。

### mock_users.json
测试用户账号详细信息。

### mock_settings.json
系统默认设置配置。

## 🔧 开发模式

在开发模式下，前端可以使用这些模拟数据：

```typescript
// 在 src/services/ 中使用 mock 数据
import mockData from '@/../../test_program/mock_data.json'

// 当 API 调用失败时返回 mock 数据
const fetchData = async () => {
  try {
    return await api.get('/endpoint')
  } catch (error) {
    console.warn('API unavailable, using mock data')
    return mockData.endpoint
  }
}
```

## 📌 注意事项

1. **不要在生产环境使用这些密码** - 所有测试账号使用相同密码 `password123`
2. **数据会重置** - 每次运行 seed 命令会检查数据是否存在，不会重复插入
3. **API 响应格式** - mock_api_responses.json 中的格式与真实 API 响应格式一致
