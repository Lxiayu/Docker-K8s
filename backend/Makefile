.PHONY: run build test clean docker help

APP_NAME=cicd-platform
VERSION=$(shell git describe --tags --always --dirty)
BUILD_TIME=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)"

run:
	@echo "Running development server..."
	@go run cmd/server/main.go

build:
	@echo "Building binary..."
	@go build $(LDFLAGS) -o bin/$(APP_NAME) cmd/server/main.go

test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.out ./...

test-coverage: test
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html

docker:
	@echo "Building Docker image..."
	@docker build -t $(APP_NAME):$(VERSION) .

docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 $(APP_NAME):$(VERSION)

deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

lint:
	@echo "Running linter..."
	@golangci-lint run ./...

fmt:
	@echo "Formatting code..."
	@go fmt ./...

vet:
	@echo "Running go vet..."
	@go vet ./...

help:
	@echo "Available targets:"
	@echo "  run           - Run development server"
	@echo "  build         - Build binary"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker        - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  deps          - Install dependencies"
	@echo "  lint          - Run linter"
	@echo "  fmt           - Format code"
	@echo "  vet           - Run go vet"
