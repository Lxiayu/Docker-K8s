#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

confirm() {
    read -p "$(echo -e ${RED}$1${NC} [y/N]: )" response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            true
            ;;
        *)
            false
            ;;
    esac
}

uninstall_applications() {
    log_info "卸载应用..."
    kubectl delete -f frontend/k8s/ --ignore-not-found
    kubectl delete -f backend/k8s/ --ignore-not-found
}

uninstall_database() {
    log_info "卸载数据库..."
    kubectl delete -f database/ --ignore-not-found
}

uninstall_logging() {
    log_info "卸载日志系统..."
    cd logging
    ./undeploy.sh
    cd ..
}

uninstall_monitoring() {
    log_info "卸载监控系统..."
    cd monitoring
    ./uninstall.sh
    cd ..
}

uninstall_harbor() {
    log_info "卸载 Harbor..."
    cd harbor
    ./uninstall.sh
    cd ..
}

uninstall_kubernetes() {
    log_info "卸载 Kubernetes 集群..."
    cd kubernetes
    ./scripts/cleanup.sh
    cd ..
}

remove_images() {
    log_info "删除本地镜像..."
    docker images | grep cicd-platform | awk '{print $3}' | xargs -r docker rmi -f
}

clean_volumes() {
    log_info "清理持久化数据..."
    kubectl delete pvc --all --all-namespaces
}

main() {
    log_warning "======================================"
    log_warning "  即将卸载 CI/CD Platform"
    log_warning "======================================"
    log_warning "此操作将删除所有组件和数据，不可恢复！"
    echo ""
    
    if ! confirm "确定要卸载吗？"; then
        log_info "取消卸载"
        exit 0
    fi
    
    if ! confirm "再次确认要删除所有数据吗？"; then
        log_info "取消卸载"
        exit 0
    fi
    
    log_info "开始卸载..."
    
    uninstall_applications
    uninstall_database
    uninstall_logging
    uninstall_monitoring
    uninstall_harbor
    uninstall_kubernetes
    remove_images
    clean_volumes
    
    log_info "卸载完成"
}

main "$@"
