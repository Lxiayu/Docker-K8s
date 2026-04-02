#!/bin/bash

set -e

echo "========================================="
echo "CI/CD Platform Configuration Validator"
echo "========================================="
echo ""

ERRORS=0
WARNINGS=0

check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo "✓ $description: $file"
    else
        echo "✗ $description: $file (NOT FOUND)"
        ERRORS=$((ERRORS + 1))
    fi
}

check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo "✓ $description: $dir"
    else
        echo "✗ $description: $dir (NOT FOUND)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "=== 1. Checking GitHub Actions Configuration ==="
check_file ".github/workflows/full-ci-cd.yml" "GitHub Actions workflow"
check_file ".github/SETUP_GUIDE.md" "GitHub Actions setup guide"

echo ""
echo "=== 2. Checking Kubernetes Configuration ==="
check_file "kubernetes/backend-deployment.yaml" "Backend deployment"
check_file "kubernetes/frontend-deployment.yaml" "Frontend deployment"
check_file "kubernetes/backend-service.yaml" "Backend service"
check_file "kubernetes/frontend-service.yaml" "Frontend service"
check_file "kubernetes/secrets.yaml" "Kubernetes secrets template"

echo ""
echo "=== 3. Checking Docker Configuration ==="
check_file "backend/Dockerfile" "Backend Dockerfile"
check_file "frontend/Dockerfile" "Frontend Dockerfile"
check_file "frontend/nginx.conf" "Frontend nginx config"

echo ""
echo "=== 4. Checking Database Configuration ==="
check_directory "database/postgres" "Database directory"
check_file "database/postgres/statefulset.yaml" "Database StatefulSet"
check_file "database/postgres/service.yaml" "Database service"
check_file "database/postgres/secret.yaml" "Database secret"
check_file "database/init/init.sql" "Database initialization script"

echo ""
echo "=== 5. Checking Backend Configuration ==="
check_file "backend/pkg/config/config.go" "Backend config package"
check_file "backend/cmd/server/main.go" "Backend main entry"
check_file "backend/go.mod" "Backend dependencies"

echo ""
echo "=== 6. Checking Frontend Configuration ==="
check_file "frontend/package.json" "Frontend package.json"
check_file "frontend/vite.config.ts" "Frontend vite config"
check_file "frontend/src/main.tsx" "Frontend main entry"

echo ""
echo "=== 7. Checking Documentation ==="
check_file "README.md" "Project README"
check_file "TECHNICAL_PRINCIPLES_GUIDE.md" "Technical principles guide"
check_file "GITHUB_ACTIONS_ONLY.md" "GitHub Actions guide"

echo ""
echo "=== 8. Validating Configuration Content ==="

if grep -q "postgres-service.database.svc.cluster.local" kubernetes/backend-deployment.yaml; then
    echo "✓ Backend database host is correctly configured"
else
    echo "✗ Backend database host is not correctly configured"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "cicd-backend:8080" frontend/nginx.conf; then
    echo "✓ Frontend nginx proxy is correctly configured"
else
    echo "✗ Frontend nginx proxy is not correctly configured"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "database-secret" kubernetes/backend-deployment.yaml; then
    echo "✓ Backend uses database secret"
else
    echo "✗ Backend does not use database secret"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "jwt-secret" kubernetes/backend-deployment.yaml; then
    echo "✓ Backend uses JWT secret"
else
    echo "✗ Backend does not use JWT secret"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== 9. Checking for Common Issues ==="

if grep -q "proxy_pass http://backend:8080" frontend/nginx.conf; then
    echo "⚠ Frontend nginx uses 'backend' instead of 'cicd-backend' (may cause issues in K8s)"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "value: \"postgres\"" kubernetes/backend-deployment.yaml; then
    echo "⚠ Backend uses 'postgres' instead of full service name (may cause connection issues)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✓ All critical files and configurations are present!"
    echo ""
    echo "Next steps:"
    echo "1. Set up GitHub Secrets (see .github/SETUP_GUIDE.md)"
    echo "2. Push code to GitHub repository"
    echo "3. Run the GitHub Actions workflow"
    echo ""
    echo "Required GitHub Secrets:"
    echo "  - KUBE_CONFIG: Base64 encoded kubeconfig"
    echo "  - DOCKER_USERNAME: Docker Hub username"
    echo "  - DOCKER_PASSWORD: Docker Hub password"
    echo "  - DATABASE_PASSWORD: Database password"
    echo "  - JWT_SECRET: JWT secret key"
    exit 0
else
    echo "✗ Configuration has $ERRORS error(s) that need to be fixed!"
    exit 1
fi
