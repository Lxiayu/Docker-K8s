#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

delete_cluster() {
    log_info "删除 Kubernetes 集群..."
    
    if kind get clusters | grep -q "cicd-cluster"; then
        kind delete cluster --name cicd-cluster
        log_info "集群已删除"
    else
        log_warning "集群 cicd-cluster 不存在"
    fi
}

clean_data() {
    log_info "清理数据目录..."
    
    read -p "是否清理持久化数据? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
        rm -rf "$PROJECT_ROOT/data"
        log_info "数据目录已清理"
    fi
}

main() {
    log_info "开始清理 Kubernetes 集群环境..."
    
    delete_cluster
    clean_data
    
    log_info "清理完成!"
}

main "$@"
