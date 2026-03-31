#!/bin/bash

# CI/CD Platform 状态查看脚本

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
echo -e "${BLUE}   CI/CD Platform 服务状态${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查服务状态
check_service() {
    local name=$1
    local pid_file="$PID_DIR/${name}.pid"
    local port=$2
    
    echo -e "${YELLOW}[$name 服务]${NC}"
    
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "  状态: ${GREEN}运行中${NC}"
            echo -e "  PID: $PID"
            echo -e "  端口: $port"
            
            # 检查端口是否监听
            if lsof -i :${port#*:} &>/dev/null; then
                echo -e "  端口状态: ${GREEN}监听中${NC}"
            else
                echo -e "  端口状态: ${YELLOW}未监听${NC}"
            fi
        else
            echo -e "  状态: ${RED}已停止${NC}"
        fi
    else
        echo -e "  状态: ${RED}未启动${NC}"
    fi
    echo ""
}

# 检查数据库
check_database() {
    echo -e "${YELLOW}[PostgreSQL 数据库]${NC}"
    
    if docker ps | grep -q cicd-postgres; then
        echo -e "  状态: ${GREEN}运行中${NC}"
        echo -e "  端口: localhost:5432"
        docker ps --filter name=cicd-postgres --format "  容器ID: {{.ID}}"
    else
        echo -e "  状态: ${RED}未运行${NC}"
    fi
    echo ""
}

# 检查端口占用
check_ports() {
    echo -e "${YELLOW}[端口占用情况]${NC}"
    
    echo -e "  ${BLUE}后端端口 (8080):${NC}"
    lsof -i :8080 2>/dev/null | head -5 || echo -e "    未占用"
    
    echo ""
    echo -e "  ${BLUE}前端端口 (3000):${NC}"
    lsof -i :3000 2>/dev/null | head -5 || echo -e "    未占用"
    
    echo ""
    echo -e "  ${BLUE}数据库端口 (5432):${NC}"
    lsof -i :5432 2>/dev/null | head -5 || echo -e "    未占用"
    
    echo ""
}

# 显示访问地址
show_urls() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   访问地址${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  ${BLUE}前端:${NC} http://localhost:3000"
    echo -e "  ${BLUE}后端:${NC} http://localhost:8080"
    echo -e "  ${BLUE}API 文档:${NC} http://localhost:8080/swagger/index.html"
    echo ""
}

# 主流程
main() {
    check_service "backend" "8080"
    check_service "frontend" "3001"
    check_database
    check_ports
    show_urls
}

main
