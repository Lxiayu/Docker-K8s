# CI/CD Platform Frontend

基于 React + TypeScript + Ant Design 的云原生 CI/CD 平台前端应用

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **UI组件库**: Ant Design 5
- **构建工具**: Vite
- **路由**: React Router 6
- **状态管理**: Zustand
- **数据请求**: React Query + Axios
- **样式**: Less

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 资源文件
│   ├── components/     # 公共组件
│   ├── hooks/          # 自定义 Hooks
│   ├── pages/          # 页面组件
│   ├── services/       # API 服务
│   ├── store/          # 状态管理
│   ├── styles/         # 全局样式
│   ├── utils/          # 工具函数
│   ├── App.tsx         # 应用入口
│   └── main.tsx        # 渲染入口
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 功能模块

### 1. 仪表盘
- 流水线统计
- 运行状态概览
- 快速操作入口

### 2. 流水线管理
- 流水线列表
- 创建/编辑流水线
- 触发构建
- 查看构建历史和日志

### 3. 代码仓库
- Git仓库集成
- Webhook配置
- 分支管理

### 4. 部署管理
- 应用部署
- 多环境支持
- 回滚操作
- 日志查看

### 5. 镜像管理
- 镜像列表
- 构建触发
- 安全扫描

### 6. 监控告警
- 实时监控
- 告警配置
- 历史记录

### 7. 用户管理
- 用户列表
- 角色权限
- 审计日志

### 8. 系统设置
- 全局配置
- 集群管理
- 通知配置

## 环境变量

创建 `.env.local` 文件配置环境变量：

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## API 代理

开发环境下，API 请求会自动代理到后端服务：

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}
```

## 默认账号

- 用户名: admin
- 密码: admin123

## License

MIT
