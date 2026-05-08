# 前端页面报错问题及修复文档

## 问题一：Select.Item 空值导致页面崩溃

### 影响页面
- 部署管理 (`/deployments`)
- 镜像管理 (`/images`)
- 监控告警 (`/monitoring`)

### 报错信息
```
A <Select.Item /> must have a value prop that is not an empty string.
This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

### 根因分析
shadcn/ui 的 Select 组件基于 Radix UI，Radix UI 的 `SelectItem` **不允许 `value` 为空字符串 `""`**。这是因为 Radix UI 使用空字符串来表示"未选择"状态（显示 placeholder）。

项目中有 4 处使用了 `value=""`：

| 文件 | 行号 | 原始值 | 修复后 |
|------|------|--------|--------|
| `Deployments.tsx` | L325 | `<SelectItem value="">全部环境</SelectItem>` | `<SelectItem value="all">全部环境</SelectItem>` |
| `Images.tsx` | L294 | `<SelectItem value="">全部项目</SelectItem>` | `<SelectItem value="all">全部项目</SelectItem>` |
| `Images.tsx` | L589 | `<SelectItem value="">不使用仓库</SelectItem>` | `<SelectItem value="none">不使用仓库</SelectItem>` |
| `Monitoring.tsx` | L389 | `<SelectItem value="">全部级别</SelectItem>` | `<SelectItem value="all">全部级别</SelectItem>` |

### 修复方式
1. 将所有"全部xxx"选项的 `value` 从 `""` 改为 `"all"`
2. 将"不使用xxx"选项的 `value` 从 `""` 改为 `"none"`
3. 更新对应的 state 初始值和 filter 逻辑

**示例（Deployments.tsx）：**
```tsx
// 修复前
const [environment, setEnvironment] = useState<string>('')
// API 调用
environment: environment || undefined

// 修复后
const [environment, setEnvironment] = useState<string>('all')
// API 调用
environment: environment === 'all' ? undefined : environment
```

### 预防措施
**今后在 shadcn/ui 的 Select 组件中，永远不要使用空字符串作为 SelectItem 的 value。** 始终使用有意义的非空字符串（如 `"all"`、`"none"`、`"default"` 等）。

---

## 问题二：审计日志页面 404 报错

### 影响页面
- 审计日志 (`/audit`)

### 报错信息
```
请求的资源不存在
```

### 根因分析
前端 `AuditLogs.tsx` 调用 `GET /api/v1/audit/logs`，但后端 **没有注册 `/audit` 路由**，导致返回 404。

### 修复方式
1. **新建后端 Handler**：`backend/internal/handlers/audit_handler.go`
   - 实现 `ListAuditLogs` 函数，返回空列表（暂无审计数据表）
2. **注册路由**：在 `backend/internal/router/router.go` 中添加 `/audit` 路由组

```go
audit := api.Group("/audit").Use(middleware.JWTAuth())
{
    audit.GET("/logs", handlers.ListAuditLogs)
}
```

### 后续配置
要让审计日志真正记录数据，需要：
1. 在 PostgreSQL 中创建 `audit_logs` 表
2. 在后端中间件中添加审计日志记录逻辑（记录用户操作、IP、时间等）
3. 实现 `ListAuditLogs` 的真实数据库查询

**建议的表结构：**
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
```

---

## 问题三：监控告警部分功能不可用

### 影响页面
- 监控告警 (`/monitoring`) 的"规则"Tab 和"确认告警"按钮

### 根因分析
前端调用了以下 API，但后端未实现：

| 前端调用 | 后端状态 | 说明 |
|---------|---------|------|
| `GET /monitoring/alerts/rules` | ❌ 未实现 | 获取告警规则列表 |
| `PUT /monitoring/alerts/rules/:id` | ❌ 未实现 | 更新/切换告警规则 |
| `POST /monitoring/alerts/:id/acknowledge` | ❌ 未实现 | 确认告警 |

### 修复方式
添加了 stub（桩）Handler，返回空数据或成功响应，避免页面报错：

```go
func ListAlertRules(c *gin.Context) {
    response.Success(c, []AlertRuleItem{})
}

func AcknowledgeAlert(c *gin.Context) {
    response.SuccessWithMessage(c, "alert acknowledged", nil)
}

func UpdateAlertRule(c *gin.Context) {
    response.SuccessWithMessage(c, "alert rule updated", nil)
}
```

### 后续配置
要让监控告警功能完整工作，需要：
1. **部署 Prometheus**：后端连接 `http://prometheus:9090` 获取指标数据
2. **部署 Grafana**：可视化监控面板
3. **配置告警规则**：在 Prometheus 中配置实际的告警规则
4. **实现真实 Handler**：将 stub Handler 替换为真实的 Prometheus API 调用

**当前监控页面的预期行为：**
- ✅ 页面正常加载，不会崩溃
- ✅ 指标 Tab 显示"暂无指标数据"（需部署 Prometheus 后才有数据）
- ✅ 告警 Tab 显示"暂无告警"（需配置告警规则后才有数据）
- ✅ 规则 Tab 显示空列表
- ⚠️ "确认告警"和"切换规则"操作会返回成功但无实际效果

---

## 总结

| 问题 | 状态 | 是否需要额外配置 |
|------|------|-----------------|
| Select.Item 空值崩溃 | ✅ 已修复 | 否 |
| 审计日志 404 | ✅ 已修复（stub） | 是，需创建数据库表和实现真实逻辑 |
| 监控告警部分功能 | ✅ 已修复（stub） | 是，需部署 Prometheus 和配置告警规则 |

所有页面现在都可以正常显示，不会崩溃。如需完整功能，请按上述"后续配置"步骤进行。
