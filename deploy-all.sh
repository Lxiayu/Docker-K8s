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

check_prerequisites() {
    log_info "检查前置条件..."
    
    command -v kubectl >/dev/null 2>&1 || { log_error "需要 kubectl 但未安装"; exit 1; }
    command -v helm >/dev/null 2>&1 || { log_error "需要 helm 但未安装"; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "需要 docker 但未安装"; exit 1; }
    
    log_success "前置条件检查通过"
}

deploy_kubernetes() {
    log_info "部署 Kubernetes 集群..."
    cd kubernetes
    ./scripts/setup-cluster.sh
    cd ..
    log_success "Kubernetes 集群部署完成"
}

deploy_harbor() {
    log_info "部署 Harbor 镜像仓库..."
    cd harbor
    ./deploy.sh
    cd ..
    log_success "Harbor 部署完成"
}

deploy_monitoring() {
    log_info "部署监控系统..."
    cd monitoring
    ./deploy.sh
    cd ..
    log_success "监控系统部署完成"
}

deploy_logging() {
    log_info "部署日志系统..."
    cd logging
    ./deploy.sh
    cd ..
    log_success "日志系统部署完成"
}

deploy_database() {
    log_info "部署数据库..."
    cd database
    ./scripts/deploy.sh
    cd ..
    log_success "数据库部署完成"
}

build_and_push_images() {
    log_info "构建并推送应用镜像..."
    
    log_info "构建后端镜像..."
    cd backend
    make docker
    docker tag cicd-platform:latest harbor.local/cicd-platform/backend:latest
    docker push harbor.local/cicd-platform/backend:latest
    cd ..
    
    log_info "构建前端镜像..."
    cd frontend
    npm install
    npm run build
    docker build -t cicd-platform-frontend:latest .
    docker tag cicd-platform-frontend:latest harbor.local/cicd-platform/frontend:latest
    docker push harbor.local/cicd-platform/frontend:latest
    cd ..
    
    log_success "应用镜像构建完成"
}

deploy_applications() {
    log_info "部署应用..."
    
    log_info "部署后端服务..."
    kubectl apply -f backend/k8s/
    
    log_info "部署前端应用..."
    kubectl apply -f frontend/k8s/
    
    log_success "应用部署完成"
}

verify_deployment() {
    log_info "验证部署..."
    
    log_info "等待 Pod 就绪..."
    kubectl wait --for=condition=ready pod -l app=backend -n cicd-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=frontend -n cicd-system --timeout=300s
    
    log_info "检查服务状态..."
    kubectl get pods -n cicd-system
    kubectl get svc -n cicd-system
    kubectl get ingress -n cicd-system
    
    log_success "部署验证完成"
}

print_access_info() {
    echo ""
    log_success "======================================"
    log_success "  CI/CD Platform 部署成功！"
    log_success "======================================"
    echo ""
    log_info "访问地址："
    echo "  - 前端界面: http://cicd-platform.local"
    echo "  - 后端API: http://api.cicd-platform.local"
    echo "  - Grafana: http://grafana.local"
    echo "  - Harbor: http://harbor.local"
    echo "  - Kibana: http://kibana.local"
    echo ""
    log_info "默认账号："
    echo "  - Grafana: admin / (see monitoring/prometheus-operator/values.yaml)"
    echo "  - Harbor: admin / (see harbor/config/values.yaml)"
    echo ""
    log_warning "请及时修改默认密码！"
    echo ""
}

main() {
    log_info "开始部署 CI/CD Platform..."
    
    check_prerequisites
    deploy_kubernetes
    deploy_harbor
    deploy_monitoring
    deploy_logging
    deploy_database
    build_and_push_images
    deploy_applications
    verify_deployment
    print_access_info
    
    log_success "CI/CD Platform 部署完成！"
}

main "$@"
