-- CI/CD Platform Database Initialization Script
-- Version: 1.0.0
-- Date: 2026-03-11

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建枚举类型
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE build_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
CREATE TYPE deployment_strategy AS ENUM ('rolling', 'canary', 'blue-green');
CREATE TYPE environment_type AS ENUM ('dev', 'test', 'prod');

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_deleted_at ON roles(deleted_at);

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at);

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Git仓库表
CREATE TABLE IF NOT EXISTS git_repositories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    branch VARCHAR(50) DEFAULT 'main',
    credential TEXT,
    webhook_url VARCHAR(255),
    webhook_key VARCHAR(100),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_git_repositories_name ON git_repositories(name);
CREATE INDEX idx_git_repositories_type ON git_repositories(type);
CREATE INDEX idx_git_repositories_deleted_at ON git_repositories(deleted_at);

CREATE TRIGGER update_git_repositories_updated_at BEFORE UPDATE ON git_repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 流水线表
CREATE TABLE IF NOT EXISTS pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    repo_id INTEGER REFERENCES git_repositories(id) ON DELETE SET NULL,
    config TEXT,
    status VARCHAR(20) DEFAULT 'idle',
    last_build_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pipelines_name ON pipelines(name);
CREATE INDEX idx_pipelines_repo_id ON pipelines(repo_id);
CREATE INDEX idx_pipelines_status ON pipelines(status);
CREATE INDEX idx_pipelines_deleted_at ON pipelines(deleted_at);

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 构建记录表
CREATE TABLE IF NOT EXISTS builds (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    commit_hash VARCHAR(40),
    branch VARCHAR(50),
    status build_status DEFAULT 'pending',
    log TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_builds_pipeline_id ON builds(pipeline_id);
CREATE INDEX idx_builds_status ON builds(status);
CREATE INDEX idx_builds_created_at ON builds(created_at);
CREATE INDEX idx_builds_deleted_at ON builds(deleted_at);

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON builds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 部署表
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    namespace VARCHAR(50) NOT NULL,
    image VARCHAR(255) NOT NULL,
    replicas INTEGER DEFAULT 1,
    strategy deployment_strategy DEFAULT 'rolling',
    status VARCHAR(20) DEFAULT 'pending',
    environment environment_type NOT NULL,
    config TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_deployments_name ON deployments(name);
CREATE INDEX idx_deployments_namespace ON deployments(namespace);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_deleted_at ON deployments(deleted_at);

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    method VARCHAR(10),
    path VARCHAR(255),
    ip VARCHAR(50),
    user_agent VARCHAR(255),
    status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 插入默认角色
INSERT INTO roles (name, description) VALUES
    ('admin', '系统管理员，拥有所有权限'),
    ('devops', 'DevOps工程师，管理流水线和部署'),
    ('developer', '开发人员，查看和管理自己的项目'),
    ('viewer', '只读用户，只能查看信息')
ON CONFLICT (name) DO NOTHING;

-- 插入默认权限
INSERT INTO permissions (name, resource, action, description) VALUES
    ('user_create', 'users', 'create', '创建用户'),
    ('user_read', 'users', 'read', '查看用户'),
    ('user_update', 'users', 'update', '更新用户'),
    ('user_delete', 'users', 'delete', '删除用户'),
    ('pipeline_create', 'pipelines', 'create', '创建流水线'),
    ('pipeline_read', 'pipelines', 'read', '查看流水线'),
    ('pipeline_update', 'pipelines', 'update', '更新流水线'),
    ('pipeline_delete', 'pipelines', 'delete', '删除流水线'),
    ('pipeline_trigger', 'pipelines', 'trigger', '触发流水线'),
    ('deployment_create', 'deployments', 'create', '创建部署'),
    ('deployment_read', 'deployments', 'read', '查看部署'),
    ('deployment_update', 'deployments', 'update', '更新部署'),
    ('deployment_delete', 'deployments', 'delete', '删除部署'),
    ('deployment_execute', 'deployments', 'execute', '执行部署'),
    ('repository_create', 'repositories', 'create', '创建仓库'),
    ('repository_read', 'repositories', 'read', '查看仓库'),
    ('repository_update', 'repositories', 'update', '更新仓库'),
    ('repository_delete', 'repositories', 'delete', '删除仓库'),
    ('monitoring_read', 'monitoring', 'read', '查看监控'),
    ('monitoring_update', 'monitoring', 'update', '更新监控配置')
ON CONFLICT (name) DO NOTHING;

-- 分配权限给角色
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'devops' AND p.resource IN ('pipelines', 'deployments', 'repositories', 'monitoring')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'developer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'viewer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (username, email, password, role, status) VALUES
    ('admin', 'admin@cicd-platform.local', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqJ3wYVl5jXlGzYlJZJZJZJZJZJZJZ', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- 创建视图：用户权限视图
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id AS user_id,
    u.username,
    r.name AS role_name,
    p.name AS permission_name,
    p.resource,
    p.action
FROM users u
LEFT JOIN roles r ON r.name = u.role
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.deleted_at IS NULL;

-- 创建视图：流水线统计视图
CREATE OR REPLACE VIEW pipeline_statistics AS
SELECT 
    p.id AS pipeline_id,
    p.name AS pipeline_name,
    COUNT(b.id) AS total_builds,
    COUNT(CASE WHEN b.status = 'success' THEN 1 END) AS successful_builds,
    COUNT(CASE WHEN b.status = 'failed' THEN 1 END) AS failed_builds,
    AVG(b.duration) AS avg_duration,
    MAX(b.created_at) AS last_build_time
FROM pipelines p
LEFT JOIN builds b ON b.pipeline_id = p.id AND b.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name;

-- 创建函数：清理过期审计日志
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务：每天清理过期审计日志
-- 注意：需要安装 pg_cron 扩展
-- SELECT cron.schedule('cleanup_audit_logs', '0 2 * * *', 
--     $$SELECT cleanup_old_audit_logs(90)$$);

-- 授权
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cicd;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cicd;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cicd;
