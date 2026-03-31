#!/bin/bash

# CI/CD Platform 停止脚本
# 停止前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CI/CD Platform 停止脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 停止后端
stop_backend() {
    echo -e "${YELLOW}[停止后端服务]${NC}"
    
    if [ -f "$PID_DIR/backend.pid" ]; then
        PID=$(cat "$PID_DIR/backend.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo -e "  ${GREEN}✓${NC} 后端服务已停止 (PID: $PID)"
        else
            echo -e "  ${YELLOW}!${NC} 后端服务未运行"
        fi
        rm -f "$PID_DIR/backend.pid"
    else
        echo -e "  ${YELLOW}!${NC} 未找到后端 PID 文件"
    fi
    echo ""
}

# 停止前端
stop_frontend() {
    echo -e "${YELLOW}[停止前端服务]${NC}"
    
    if [ -f "$PID_DIR/frontend.pid" ]; then
        PID=$(cat "$PID_DIR/frontend.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo -e "  ${GREEN}✓${NC} 前端服务已停止 (PID: $PID)"
        else
            echo -e "  ${YELLOW}!${NC} 前端服务未运行"
        fi
        rm -f "$PID_DIR/frontend.pid"
    else
        echo -e "  ${YELLOW}!${NC} 未找到前端 PID 文件"
    fi
    echo ""
}

# 停止数据库 (可选)
stop_database() {
    echo -e "${YELLOW}[停止数据库]${NC}"
    
    if docker ps | grep -q cicd-postgres; then
        read -p "是否停止 PostgreSQL 容器? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker stop cicd-postgres
            echo -e "  ${GREEN}✓${NC} PostgreSQL 容器已停止"
        else
            echo -e "  ${BLUE}→${NC} 跳过停止数据库"
        fi
    else
        echo -e "  ${YELLOW}!${NC} PostgreSQL 容器未运行"
    fi
    echo ""
}

# 显示状态
show_status() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   服务已停止${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "重新启动:"
    echo -e "  ${YELLOW}./start.sh${NC}"
    echo ""
}

# 主流程
main() {
    stop_backend
    stop_frontend
    # stop_database  # 取消注释以启用数据库停止选项
    show_status
}

main
