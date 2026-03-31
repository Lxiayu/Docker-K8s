#!/bin/bash

set -e

CERT_DIR="/Users/xia/program/Docker-K8s/harbor/certs"
HARBOR_DOMAIN="${1:-harbor.local}"
NAMESPACE="harbor-system"

mkdir -p "$CERT_DIR"

echo "=== 生成 Harbor 自签名证书 ==="
echo "域名: $HARBOR_DOMAIN"

cd "$CERT_DIR"

echo "1. 生成 CA 私钥..."
openssl genrsa -out ca.key 4096

echo "2. 生成 CA 证书..."
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
    -out ca.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=CICD Platform/OU=Harbor CA/CN=Harbor CA"

echo "3. 生成 Harbor 服务器私钥..."
openssl genrsa -out harbor.key 4096

echo "4. 创建证书签名请求配置..."
cat > harbor.cnf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = CN
ST = Beijing
L = Beijing
O = CICD Platform
OU = Harbor
CN = $HARBOR_DOMAIN

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $HARBOR_DOMAIN
DNS.2 = notary.$HARBOR_DOMAIN
DNS.3 = harbor.harbor-system.svc.cluster.local
DNS.4 = harbor.harbor-system.svc
DNS.5 = localhost
IP.1 = 127.0.0.1
EOF

echo "5. 生成证书签名请求..."
openssl req -new -key harbor.key -out harbor.csr -config harbor.cnf

echo "6. 创建扩展配置文件..."
cat > harbor-ext.cnf << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $HARBOR_DOMAIN
DNS.2 = notary.$HARBOR_DOMAIN
DNS.3 = harbor.harbor-system.svc.cluster.local
DNS.4 = harbor.harbor-system.svc
DNS.5 = localhost
IP.1 = 127.0.0.1
EOF

echo "7. 使用 CA 签发 Harbor 证书..."
openssl x509 -req -in harbor.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out harbor.crt -days 3650 -sha256 -extfile harbor-ext.cnf

echo "8. 验证证书..."
openssl x509 -in harbor.crt -text -noout | grep -A 1 "Subject Alternative Name"

echo "9. 创建 Kubernetes TLS Secret..."
kubectl create secret generic harbor-tls \
    --from-file=tls.crt=harbor.crt \
    --from-file=tls.key=harbor.key \
    --from-file=ca.crt=ca.crt \
    -n $NAMESPACE \
    --dry-run=client -o yaml > harbor-tls-secret.yaml

echo ""
echo "=== 证书生成完成 ==="
echo "证书文件位置: $CERT_DIR"
echo "  - ca.crt: CA 证书"
echo "  - ca.key: CA 私钥"
echo "  - harbor.crt: Harbor 服务器证书"
echo "  - harbor.key: Harbor 服务器私钥"
echo "  - harbor-tls-secret.yaml: Kubernetes Secret 配置"
echo ""
echo "下一步操作:"
echo "1. kubectl apply -f harbor-tls-secret.yaml"
echo "2. 将 ca.crt 复制到 Docker 信任目录:"
echo "   sudo mkdir -p /etc/docker/certs.d/$HARBOR_DOMAIN"
echo "   sudo cp ca.crt /etc/docker/certs.d/$HARBOR_DOMAIN/"
echo "3. 重启 Docker: sudo systemctl restart docker"
