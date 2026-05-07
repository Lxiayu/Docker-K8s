#!/bin/bash

# CI/CD Platform 一键启动脚本
# 同时启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 日志目录
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# PID 文件目录
PID_DIR="$PROJECT_ROOT/.pids"
mkdir -p "$PID_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CI/CD Platform 启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}[检查依赖]${NC}"
    
    # 检查 Go
    if ! command -v go &> /dev/null; then
        echo -e "${RED}错误: Go 未安装，请先安装 Go${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Go $(go version | awk '{print $3}')"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js 未安装，请先安装 Node.js${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: npm 未安装，请先安装 npm${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} npm $(npm -v)"
    
    echo ""
}

# 检查数据库
check_database() {
    echo -e "${YELLOW}[检查数据库]${NC}"
    
    # 检查 PostgreSQL 容器
    if docker ps | grep -q cicd-postgres; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL 容器已运行"
    else
        echo -e "  ${YELLOW}!${NC} PostgreSQL 容器未运行，正在启动..."
        docker run -d --name cicd-postgres \
            -e POSTGRES_USER=${POSTGRES_USER:-cicd} \
            -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-changeme} \
            -e POSTGRES_DB=cicd_platform \
            -p 5432:5432 \
            postgres:15-alpine 2>/dev/null || {
            echo -e "  ${YELLOW}!${NC} PostgreSQL 容器已存在，正在启动..."
            docker start cicd-postgres
        }
        sleep 3
        echo -e "  ${GREEN}✓${NC} PostgreSQL 容器启动成功"
    fi
    echo ""
}

# 启动后端
start_backend() {
    echo -e "${YELLOW}[启动后端服务]${NC}"
    
    cd "$BACKEND_DIR"
    
    # 检查是否需要下载依赖
    if [ ! -f "go.sum" ]; then
        echo -e "  ${BLUE}→${NC} 下载 Go 依赖..."
        go mod tidy
    fi
    
    # 编译后端
    if [ ! -f "bin/server" ]; then
        echo -e "  ${BLUE}→${NC} 编译后端服务..."
        mkdir -p bin
        go build -o bin/server ./cmd/server
    fi
    
    # 检查是否已运行
    if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
        echo -e "  ${YELLOW}!${NC} 后端服务已在运行 (PID: $(cat $PID_DIR/backend.pid))"
    else
        echo -e "  ${BLUE}→${NC} 启动后端服务..."
        unset GOROOT
        GOROOT="" ./bin/server > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$PID_DIR/backend.pid"
        sleep 2
        echo -e "  ${GREEN}✓${NC} 后端服务启动成功 (PID: $(cat $PID_DIR/backend.pid))"
        echo -e "  ${BLUE}→${NC} 日志文件: $LOG_DIR/backend.log"
    fi
    
    echo -e "  ${BLUE}→${NC} 后端地址: ${GREEN}http://localhost:8080${NC}"
    echo ""
}

# 启动前端
start_frontend() {
    echo -e "${YELLOW}[启动前端服务]${NC}"
    
    cd "$FRONTEND_DIR"
    
    # 检查是否需要安装依赖
    if [ ! -d "node_modules" ]; then
        echo -e "  ${BLUE}→${NC} 安装前端依赖..."
        npm install
    fi
    
    # 检查是否已运行
    if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
        echo -e "  ${YELLOW}!${NC} 前端服务已在运行 (PID: $(cat $PID_DIR/frontend.pid))"
    else
        echo -e "  ${BLUE}→${NC} 启动前端服务..."
        npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
        echo $! > "$PID_DIR/frontend.pid"
        sleep 3
        echo -e "  ${GREEN}✓${NC} 前端服务启动成功 (PID: $(cat $PID_DIR/frontend.pid))"
        echo -e "  ${BLUE}→${NC} 日志文件: $LOG_DIR/frontend.log"
    fi
    
    echo -e "  ${BLUE}→${NC} 前端地址: ${GREEN}http://localhost:3000${NC}"
    echo ""
}

# 显示状态
show_status() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   服务启动完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "服务地址:"
    echo -e "  ${BLUE}前端:${NC} http://localhost:3000"
    echo -e "  ${BLUE}后端:${NC} http://localhost:8080"
    echo -e "  ${BLUE}数据库:${NC} localhost:5432"
    echo ""
    echo -e "日志文件:"
    echo -e "  ${BLUE}后端:${NC} $LOG_DIR/backend.log"
    echo -e "  ${BLUE}前端:${NC} $LOG_DIR/frontend.log"
    echo ""
    echo -e "停止服务:"
    echo -e "  ${YELLOW}./stop.sh${NC}"
    echo ""
    echo -e "查看日志:"
    echo -e "  ${YELLOW}tail -f $LOG_DIR/backend.log${NC}"
    echo -e "  ${YELLOW}tail -f $LOG_DIR/frontend.log${NC}"
    echo ""
}

# 主流程
main() {
    check_dependencies
    check_database
    start_backend
    start_frontend
    show_status
}

main
