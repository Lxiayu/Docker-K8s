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

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_kubernetes() {
    log_info "检查 Kubernetes 集群..."
    
    echo "=== 节点状态 ==="
    kubectl get nodes -o wide
    echo ""
    
    echo "=== 系统组件状态 ==="
    kubectl get pods -n kube-system
    echo ""
    
    local ready_nodes=$(kubectl get nodes | grep -c "Ready")
    if [ "$ready_nodes" -gt 0 ]; then
        log_success "Kubernetes 集群正常 ($ready_nodes 个节点就绪)"
    else
        log_error "Kubernetes 集群异常"
        return 1
    fi
}

check_harbor() {
    log_info "检查 Harbor 镜像仓库..."
    
    echo "=== Harbor 组件状态 ==="
    kubectl get pods -n harbor-system
    echo ""
    
    local ready_pods=$(kubectl get pods -n harbor-system | grep -c "Running")
    if [ "$ready_pods" -ge 5 ]; then
        log_success "Harbor 运行正常"
    else
        log_warning "Harbor 可能未完全启动"
    fi
}

check_monitoring() {
    log_info "检查监控系统..."
    
    echo "=== Prometheus 状态 ==="
    kubectl get pods -n monitoring | grep prometheus
    echo ""
    
    echo "=== Grafana 状态 ==="
    kubectl get pods -n monitoring | grep grafana
    echo ""
    
    local prometheus_ready=$(kubectl get pods -n monitoring | grep prometheus | grep -c "Running")
    local grafana_ready=$(kubectl get pods -n monitoring | grep grafana | grep -c "Running")
    
    if [ "$prometheus_ready" -gt 0 ] && [ "$grafana_ready" -gt 0 ]; then
        log_success "监控系统运行正常"
    else
        log_warning "监控系统可能未完全启动"
    fi
}

check_logging() {
    log_info "检查日志系统..."
    
    echo "=== Elasticsearch 状态 ==="
    kubectl get pods -n logging | grep elasticsearch
    echo ""
    
    echo "=== Kibana 状态 ==="
    kubectl get pods -n logging | grep kibana
    echo ""
    
    echo "=== Fluent Bit 状态 ==="
    kubectl get pods -n logging | grep fluent-bit
    echo ""
    
    local es_ready=$(kubectl get pods -n logging | grep elasticsearch | grep -c "Running")
    local kibana_ready=$(kubectl get pods -n logging | grep kibana | grep -c "Running")
    
    if [ "$es_ready" -gt 0 ] && [ "$kibana_ready" -gt 0 ]; then
        log_success "日志系统运行正常"
    else
        log_warning "日志系统可能未完全启动"
    fi
}

check_database() {
    log_info "检查数据库..."
    
    echo "=== PostgreSQL 状态 ==="
    kubectl get pods -n database
    echo ""
    
    local db_ready=$(kubectl get pods -n database | grep postgres | grep -c "Running")
    
    if [ "$db_ready" -gt 0 ]; then
        log_success "数据库运行正常"
    else
        log_error "数据库未运行"
        return 1
    fi
}

check_applications() {
    log_info "检查应用服务..."
    
    echo "=== 后端服务状态 ==="
    kubectl get pods -n cicd-system | grep backend
    echo ""
    
    echo "=== 前端应用状态 ==="
    kubectl get pods -n cicd-system | grep frontend
    echo ""
    
    local backend_ready=$(kubectl get pods -n cicd-system | grep backend | grep -c "Running")
    local frontend_ready=$(kubectl get pods -n cicd-system | grep frontend | grep -c "Running")
    
    if [ "$backend_ready" -gt 0 ] && [ "$frontend_ready" -gt 0 ]; then
        log_success "应用服务运行正常"
    else
        log_warning "应用服务可能未完全启动"
    fi
}

check_ingress() {
    log_info "检查 Ingress 配置..."
    
    echo "=== Ingress Controller 状态 ==="
    kubectl get pods -n ingress-nginx
    echo ""
    
    echo "=== Ingress 资源 ==="
    kubectl get ingress --all-namespaces
    echo ""
    
    log_success "Ingress 配置检查完成"
}

check_storage() {
    log_info "检查存储配置..."
    
    echo "=== StorageClass ==="
    kubectl get storageclass
    echo ""
    
    echo "=== PersistentVolumes ==="
    kubectl get pv
    echo ""
    
    echo "=== PersistentVolumeClaims ==="
    kubectl get pvc --all-namespaces
    echo ""
    
    log_success "存储配置检查完成"
}

test_api_health() {
    log_info "测试 API 健康检查..."
    
    local backend_service=$(kubectl get svc backend -n cicd-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -n "$backend_service" ]; then
        if curl -f -s "http://$backend_service:8080/health" > /dev/null; then
            log_success "后端 API 健康检查通过"
        else
            log_warning "后端 API 健康检查失败"
        fi
    else
        log_warning "无法获取后端服务地址，跳过健康检查"
    fi
}

print_summary() {
    echo ""
    log_info "======================================"
    log_info "  系统检查摘要"
    log_info "======================================"
    echo ""
    
    kubectl get pods --all-namespaces | grep -E "Running|Error|CrashLoopBackOff"
    echo ""
    
    log_success "系统检查完成！"
}

main() {
    log_info "开始系统全面检查..."
    
    check_kubernetes
    check_harbor
    check_monitoring
    check_logging
    check_database
    check_applications
    check_ingress
    check_storage
    test_api_health
    print_summary
}

main "$@"
