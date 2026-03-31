#!/bin/bash

set -e

echo "=========================================="
echo "  CI/CD 平台快速启动脚本"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

echo ">>> 检查环境依赖..."

if check_command go; then
    GO_VERSION=$(go version | awk '{print $3}')
    print_success "Go 已安装: $GO_VERSION"
else
    print_error "Go 未安装，请先安装 Go 1.21+"
    exit 1
fi

if check_command node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js 已安装: $NODE_VERSION"
else
    print_error "Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

if check_command psql; then
    print_success "PostgreSQL 客户端已安装"
else
    print_warning "PostgreSQL 客户端未安装，如果使用本地数据库请安装"
fi

echo ""
echo ">>> 检查数据库连接..."

cd backend

if [ -f "configs/config.yaml" ]; then
    print_success "配置文件存在: configs/config.yaml"
else
    print_warning "配置文件不存在，创建默认配置..."
    mkdir -p configs
    cat > configs/config.yaml << 'EOF'
server:
  port: 8080
  mode: debug

database:
  host: localhost
  port: 5432
  user: cicd
  password: cicd123
  dbname: cicd_platform
  sslmode: disable
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 1h

jwt:
  secret: your-super-secret-key-change-in-production
  expire: 24h

log:
  level: debug
  format: console
EOF
    print_success "已创建默认配置文件"
fi

echo ""
echo ">>> 检查数据库..."

DB_HOST=$(grep "host:" configs/config.yaml | awk '{print $2}')
DB_PORT=$(grep "port:" configs/config.yaml | head -1 | awk '{print $2}')
DB_USER=$(grep "user:" configs/config.yaml | awk '{print $2}')
DB_NAME=$(grep "dbname:" configs/config.yaml | awk '{print $2}')

if PGPASSWORD=$(grep "password:" configs/config.yaml | head -1 | awk '{print $2}') psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" &> /dev/null; then
    print_success "数据库连接成功"
else
    print_warning "无法连接到数据库，尝试创建数据库..."
    
    print_warning "请确保 PostgreSQL 服务已启动，并且用户有创建数据库的权限"
    echo ""
    echo "手动创建数据库的命令："
    echo "  sudo -u postgres psql -c \"CREATE USER cicd WITH PASSWORD 'cicd123';\""
    echo "  sudo -u postgres psql -c \"CREATE DATABASE cicd_platform OWNER cicd;\""
    echo "  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE cicd_platform TO cicd;\""
    echo ""
    
    read -p "数据库是否已准备好？(y/n): " db_ready
    if [ "$db_ready" != "y" ]; then
        print_error "请先准备好数据库后再运行此脚本"
        exit 1
    fi
fi

echo ""
echo ">>> 安装后端依赖..."

if [ -f "go.mod" ]; then
    go mod download
    print_success "后端依赖安装完成"
else
    print_error "go.mod 文件不存在"
    exit 1
fi

echo ""
echo ">>> 初始化数据库表结构和种子数据..."

go run cmd/seed/main.go
print_success "数据库初始化完成"

echo ""
echo ">>> 安装前端依赖..."

cd ../frontend

if [ -f "package.json" ]; then
    npm install
    print_success "前端依赖安装完成"
else
    print_error "package.json 文件不存在"
    exit 1
fi

echo ""
echo ">>> 复制配置文档到前端..."

mkdir -p public
cp ../CONFIGURATION_GUIDE.md public/
cp ../test_program/README.md public/TEST_DATA_README.md
print_success "配置文档已复制"

cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}  初始化完成！${NC}"
echo "=========================================="
echo ""
echo "接下来请运行："
echo ""
echo "  1. 启动后端服务："
echo "     cd backend && go run cmd/server/main.go"
echo ""
echo "  2. 启动前端服务（新终端）："
echo "     cd frontend && npm run dev"
echo ""
echo "  3. 访问系统："
echo "     http://localhost:5173"
echo ""
echo "  4. 使用以下账号登录："
echo "     用户名: admin"
echo "     密码: password123"
echo ""
echo "=========================================="
