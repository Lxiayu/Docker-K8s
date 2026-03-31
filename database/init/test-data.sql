-- CI/CD Platform Test Data
-- Version: 1.0.0

-- 插入测试用户
INSERT INTO users (username, email, password, role, status) VALUES
    ('devops', 'devops@cicd-platform.local', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqJ3wYVl5jXlGzYlJZJZJZJZJZJZJZ', 'devops', 'active'),
    ('developer', 'developer@cicd-platform.local', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqJ3wYVl5jXlGzYlJZJZJZJZJZJZJZ', 'developer', 'active'),
    ('viewer', 'viewer@cicd-platform.local', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqJ3wYVl5jXlGzYlJZJZJZJZJZJZJZ', 'viewer', 'active')
ON CONFLICT (username) DO NOTHING;

-- 插入测试Git仓库
INSERT INTO git_repositories (name, url, type, branch, status) VALUES
    ('frontend-app', 'https://github.com/example/frontend-app.git', 'github', 'main', 1),
    ('backend-api', 'https://github.com/example/backend-api.git', 'github', 'main', 1),
    ('microservice-user', 'https://gitlab.com/example/microservice-user.git', 'gitlab', 'develop', 1)
ON CONFLICT DO NOTHING;

-- 插入测试流水线
INSERT INTO pipelines (name, repo_id, config, status) VALUES
    ('frontend-app-pipeline', 1, 'stages:
  - build
  - test
  - deploy
build:
  script:
    - npm install
    - npm run build
test:
  script:
    - npm run test
deploy:
  script:
    - docker build -t frontend-app:latest .
    - kubectl apply -f k8s/', 'idle'),
    ('backend-api-pipeline', 2, 'stages:
  - build
  - test
  - deploy
build:
  script:
    - go mod download
    - go build -o backend-api
test:
  script:
    - go test ./...
deploy:
  script:
    - docker build -t backend-api:latest .
    - kubectl apply -f k8s/', 'idle')
ON CONFLICT DO NOTHING;

-- 插入测试构建记录
INSERT INTO builds (pipeline_id, commit_hash, branch, status, duration) VALUES
    (1, 'abc123def456', 'main', 'success', 120),
    (1, 'def456abc123', 'main', 'success', 115),
    (2, '123abc456def', 'main', 'failed', 60)
ON CONFLICT DO NOTHING;

-- 插入测试部署
INSERT INTO deployments (name, namespace, image, replicas, strategy, status, environment) VALUES
    ('frontend-app', 'prod', 'harbor.local/production/frontend-app:v1.0.0', 3, 'rolling', 'running', 'prod'),
    ('backend-api', 'prod', 'harbor.local/production/backend-api:v1.0.0', 2, 'rolling', 'running', 'prod'),
    ('frontend-app', 'test', 'harbor.local/staging/frontend-app:latest', 1, 'rolling', 'running', 'test')
ON CONFLICT DO NOTHING;

-- 插入测试审计日志
INSERT INTO audit_logs (user_id, username, action, resource, method, path, ip, status) VALUES
    (1, 'admin', 'login', 'auth', 'POST', '/api/v1/auth/login', '192.168.1.100', 200),
    (1, 'admin', 'create_pipeline', 'pipelines', 'POST', '/api/v1/pipelines', '192.168.1.100', 201),
    (2, 'devops', 'trigger_pipeline', 'pipelines', 'POST', '/api/v1/pipelines/1/trigger', '192.168.1.101', 200)
ON CONFLICT DO NOTHING;
