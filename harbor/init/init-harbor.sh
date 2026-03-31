#!/bin/bash

set -e

HARBOR_URL="${HARBOR_URL:-https://harbor.local}"
HARBOR_USER="${HARBOR_USER:-admin}"
HARBOR_PASSWORD="${HARBOR_PASSWORD:-Harbor12345}"
INIT_CONFIG="/Users/xia/program/Docker-K8s/harbor/init/harbor-init.json"

echo "=== Harbor 初始化脚本 ==="
echo "Harbor URL: $HARBOR_URL"

wait_for_harbor() {
    echo "等待 Harbor 服务就绪..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -s -o /dev/null -w "%{http_code}" "$HARBOR_URL/api/v2.0/systeminfo" | grep -q "200"; then
            echo "Harbor 服务已就绪"
            return 0
        fi
        echo "等待中... ($attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "错误: Harbor 服务未在规定时间内就绪"
    return 1
}

harbor_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -n "$data" ]; then
        curl -k -s -X "$method" \
            -u "$HARBOR_USER:$HARBOR_PASSWORD" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$HARBOR_URL/api/v2.0$endpoint"
    else
        curl -k -s -X "$method" \
            -u "$HARBOR_USER:$HARBOR_PASSWORD" \
            -H "Content-Type: application/json" \
            "$HARBOR_URL/api/v2.0$endpoint"
    fi
}

create_project() {
    local project="$1"
    local public="$2"
    local metadata="$3"
    
    echo "创建项目: $project"
    
    local data=$(cat <<EOF
{
    "project_name": "$project",
    "public": $public,
    "metadata": $metadata
}
EOF
)
    
    local response=$(harbor_api "POST" "/projects" "$data")
    
    if echo "$response" | grep -q "conflict"; then
        echo "项目 $project 已存在"
    else
        echo "项目 $project 创建成功"
    fi
}

create_user() {
    local username="$1"
    local email="$2"
    local realname="$3"
    local password="$4"
    local comment="$5"
    
    echo "创建用户: $username"
    
    local data=$(cat <<EOF
{
    "username": "$username",
    "email": "$email",
    "realname": "$realname",
    "password": "$password",
    "comment": "$comment"
}
EOF
)
    
    local response=$(harbor_api "POST" "/users" "$data")
    
    if echo "$response" | grep -q "conflict"; then
        echo "用户 $username 已存在"
    else
        echo "用户 $username 创建成功"
    fi
}

add_project_member() {
    local project="$1"
    local username="$2"
    local role="$3"
    
    echo "添加用户 $username 到项目 $project (角色: $role)"
    
    local role_id=3
    case "$role" in
        "admin") role_id=1 ;;
        "developer") role_id=2 ;;
        "guest") role_id=3 ;;
        "limited_guest") role_id=4 ;;
    esac
    
    local data=$(cat <<EOF
{
    "role_id": $role_id,
    "member_user": {
        "username": "$username"
    }
}
EOF
)
    
    harbor_api "POST" "/projects/$project/members" "$data" > /dev/null
    echo "成员添加成功"
}

create_robot_account() {
    local name="$1"
    local description="$2"
    local projects="$3"
    
    echo "创建机器人账户: $name"
    
    local data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "permissions": $projects,
    "duration": -1
}
EOF
)
    
    local response=$(harbor_api "POST" "/robots" "$data")
    
    if echo "$response" | grep -q "name"; then
        echo "机器人账户 $name 创建成功"
        echo "$response" | jq -r '.secret'
    else
        echo "机器人账户创建失败: $response"
    fi
}

create_webhook() {
    local project="$1"
    local name="$2"
    local url="$3"
    local events="$4"
    
    echo "创建 Webhook: $name (项目: $project)"
    
    local data=$(cat <<EOF
{
    "targets": [
        {
            "type": "http",
            "address": "$url",
            "auth_header": "",
            "skip_cert_verify": true
        }
    ],
    "event_types": $events,
    "name": "$name",
    "enabled": true
}
EOF
)
    
    harbor_api "POST" "/projects/$project/webhook/policies" "$data" > /dev/null
    echo "Webhook 创建成功"
}

echo ""
echo "=== 步骤 1: 等待 Harbor 服务就绪 ==="
wait_for_harbor

echo ""
echo "=== 步骤 2: 创建项目 ==="
create_project "production" false '{"public":"false","enable_content_trust":"true","prevent_vul":"true","severity":"high","auto_scan":"true"}'
create_project "staging" false '{"public":"false","enable_content_trust":"false","prevent_vul":"true","severity":"critical","auto_scan":"true"}'
create_project "development" false '{"public":"false","enable_content_trust":"false","prevent_vul":"false","severity":"critical","auto_scan":"true"}'

echo ""
echo "=== 步骤 3: 创建用户 ==="
create_user "devops" "devops@harbor.local" "DevOps Team" "DevOps@123" "DevOps team account"
create_user "developer" "developer@harbor.local" "Developer" "Developer@123" "Developer account"
create_user "viewer" "viewer@harbor.local" "Viewer" "Viewer@123" "Read-only viewer account"

echo ""
echo "=== 步骤 4: 配置项目成员 ==="
add_project_member "production" "devops" "admin"
add_project_member "production" "developer" "developer"
add_project_member "staging" "devops" "admin"
add_project_member "staging" "developer" "developer"
add_project_member "development" "devops" "admin"
add_project_member "development" "developer" "admin"

echo ""
echo "=== 步骤 5: 创建机器人账户 ==="
echo "创建 CI/CD 机器人账户..."
create_robot_account "robot-cicd" "CI/CD pipeline robot account" '[
    {
        "kind": "project",
        "namespace": "production",
        "access": [
            {"action": "push", "resource": "repository"},
            {"action": "pull", "resource": "repository"}
        ]
    },
    {
        "kind": "project",
        "namespace": "staging",
        "access": [
            {"action": "push", "resource": "repository"},
            {"action": "pull", "resource": "repository"}
        ]
    },
    {
        "kind": "project",
        "namespace": "development",
        "access": [
            {"action": "push", "resource": "repository"},
            {"action": "pull", "resource": "repository"}
        ]
    }
]'

echo ""
echo "=== 步骤 6: 配置 Webhooks ==="
create_webhook "production" "production-webhook" "https://cicd-platform.local/api/webhooks/harbor" '["PUSH_ARTIFACT","DELETE_ARTIFACT","SCANNING_COMPLETED","SCANNING_FAILED"]'

echo ""
echo "=== 初始化完成 ==="
echo ""
echo "项目列表:"
harbor_api "GET" "/projects" | jq -r '.[].name'
echo ""
echo "用户列表:"
harbor_api "GET" "/users" | jq -r '.[].username'
