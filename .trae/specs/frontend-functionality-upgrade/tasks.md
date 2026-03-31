# Tasks

- [x] Task 1: 创建个人信息页面（Profile）
  - [x] SubTask 1.1: 创建 Profile.tsx 页面组件，使用 shadcn/ui 组件
  - [x] SubTask 1.2: 实现用户信息展示（用户名、邮箱、角色、创建时间等）
  - [x] SubTask 1.3: 实现用户信息编辑表单
  - [x] SubTask 1.4: 添加修改密码功能
  - [x] SubTask 1.5: 添加头像上传功能（占位功能）
  - [x] SubTask 1.6: 在 App.tsx 中添加 /profile 路由

- [x] Task 2: 实现 Layout 下拉菜单导航功能
  - [x] SubTask 2.1: 为"个人信息"菜单项添加点击导航到 /profile
  - [x] SubTask 2.2: 为"设置"菜单项添加点击导航到 /settings
  - [x] SubTask 2.3: 确认"退出登录"功能正常工作

- [x] Task 3: 完善 Settings 页面功能
  - [x] SubTask 3.1: 创建 settings API 服务（frontend/src/services/settings.ts）
  - [x] SubTask 3.2: 实现基本设置的保存和加载
  - [x] SubTask 3.3: 实现 Kubernetes 配置的保存和加载
  - [x] SubTask 3.4: 实现镜像仓库配置的保存和加载
  - [x] SubTask 3.5: 实现通知配置的保存和加载
  - [x] SubTask 3.6: 实现安全设置的保存和加载
  - [x] SubTask 3.7: 添加配置测试功能（如测试邮件发送）

- [x] Task 4: 后端 API 支持（如需要）
  - [x] SubTask 4.1: 创建 settings_handler.go
  - [x] SubTask 4.2: 添加获取/更新用户信息 API
  - [x] SubTask 4.3: 添加修改密码 API
  - [ ] SubTask 4.4: 添加头像上传 API（占位）
  - [x] SubTask 4.5: 添加系统设置 API

- [x] Task 5: 组件迁移到 shadcn/ui
  - [x] SubTask 5.1: 安装所需 shadcn/ui 组件（Tabs, Avatar, Form, Dialog, Switch 等）
  - [x] SubTask 5.2: 将 Settings 页面从 Ant Design 迁移到 shadcn/ui
  - [x] SubTask 5.3: 将 Profile 页面使用 shadcn/ui 构建
  - [x] SubTask 5.4: 优化 Layout 组件中的下拉菜单样式

- [x] Task 6: 表单验证增强
  - [x] SubTask 6.1: 添加 react-hook-form 和 zod 验证
  - [x] SubTask 6.2: 实现个人信息表单验证
  - [x] SubTask 6.3: 实现密码修改表单验证（密码强度检查）
  - [x] SubTask 6.4: 实现设置表单验证

- [x] Task 7: 用户体验优化
  - [x] SubTask 7.1: 添加加载状态指示器
  - [x] SubTask 7.2: 添加操作成功/失败的 Toast 提示
  - [x] SubTask 7.3: 添加确认对话框（如删除、退出等操作）
  - [x] SubTask 7.4: 优化表单响应式布局

# Task Dependencies
- Task 1 depends on Task 5（Profile 页面需要 shadcn/ui 组件）
- Task 3 depends on Task 4（Settings 需要后端 API 支持）
- Task 6 should be done together with Task 1, Task 3
- Task 7 should be done after Task 1, Task 2, Task 3
