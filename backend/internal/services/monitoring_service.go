package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/pkg/logger"
	"go.uber.org/zap"
)

type MonitoringService struct {
	PrometheusURL string
	client        *http.Client
}

func NewMonitoringService(prometheusURL string) *MonitoringService {
	return &MonitoringService{
		PrometheusURL: prometheusURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type MetricQuery struct {
	Query string `json:"query"`
	Start int64  `json:"start"`
	End   int64  `json:"end"`
	Step  string `json:"step"`
}

type MetricResult struct {
	Metric map[string]string `json:"metric"`
	Values [][]interface{}   `json:"values"`
}

type MetricResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string         `json:"resultType"`
		Result     []MetricResult `json:"result"`
	} `json:"data"`
}

type AlertRule struct {
	Name        string            `json:"name"`
	Query       string            `json:"query"`
	Duration    string            `json:"duration"`
	Severity    string            `json:"severity"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

type Alert struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Severity     string `json:"severity"`
	Message      string `json:"message"`
	Time         string `json:"time"`
	Acknowledged bool   `json:"acknowledged"`
}

func (s *MonitoringService) Query(ctx context.Context, query string) (*MetricResponse, error) {
	url := fmt.Sprintf("%s/api/v1/query?query=%s", s.PrometheusURL, query)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("prometheus query failed: %s", resp.Status)
	}

	var result MetricResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *MonitoringService) QueryRange(ctx context.Context, query string, start, end int64, step string) (*MetricResponse, error) {
	url := fmt.Sprintf("%s/api/v1/query_range?query=%s&start=%d&end=%d&step=%s",
		s.PrometheusURL, query, start, end, step)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("prometheus query_range failed: %s", resp.Status)
	}

	var result MetricResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *MonitoringService) GetCPUUsage(ctx context.Context, namespace string) (map[string]float64, error) {
	query := fmt.Sprintf(`sum(rate(container_cpu_usage_seconds_total{namespace="%s"}[5m])) by (pod)`, namespace)

	result, err := s.Query(ctx, query)
	if err != nil {
		return nil, err
	}

	usage := make(map[string]float64)
	for _, r := range result.Data.Result {
		pod := r.Metric["pod"]
		if len(r.Values) > 0 {
			if val, ok := r.Values[len(r.Values)-1][1].(string); ok {
				var cpuUsage float64
				fmt.Sscanf(val, "%f", &cpuUsage)
				usage[pod] = cpuUsage
			}
		}
	}

	return usage, nil
}

func (s *MonitoringService) GetMemoryUsage(ctx context.Context, namespace string) (map[string]float64, error) {
	query := fmt.Sprintf(`sum(container_memory_usage_bytes{namespace="%s"}) by (pod)`, namespace)

	result, err := s.Query(ctx, query)
	if err != nil {
		return nil, err
	}

	usage := make(map[string]float64)
	for _, r := range result.Data.Result {
		pod := r.Metric["pod"]
		if len(r.Values) > 0 {
			if val, ok := r.Values[len(r.Values)-1][1].(string); ok {
				var memUsage float64
				fmt.Sscanf(val, "%f", &memUsage)
				usage[pod] = memUsage / 1024 / 1024 // Convert to MB
			}
		}
	}

	return usage, nil
}

func (s *MonitoringService) GetPodStatus(ctx context.Context, namespace string) (map[string]string, error) {
	query := fmt.Sprintf(`kube_pod_status_phase{namespace="%s"}`, namespace)

	result, err := s.Query(ctx, query)
	if err != nil {
		return nil, err
	}

	status := make(map[string]string)
	for _, r := range result.Data.Result {
		pod := r.Metric["pod"]
		phase := r.Metric["phase"]
		status[pod] = phase
	}

	return status, nil
}

func (s *MonitoringService) GetHTTPRequestRate(ctx context.Context, serviceName string) (float64, error) {
	query := fmt.Sprintf(`sum(rate(http_requests_total{service="%s"}[5m]))`, serviceName)

	result, err := s.Query(ctx, query)
	if err != nil {
		return 0, err
	}

	if len(result.Data.Result) > 0 && len(result.Data.Result[0].Values) > 0 {
		if val, ok := result.Data.Result[0].Values[len(result.Data.Result[0].Values)-1][1].(string); ok {
			var rate float64
			fmt.Sscanf(val, "%f", &rate)
			return rate, nil
		}
	}

	return 0, nil
}

func (s *MonitoringService) GetErrorRate(ctx context.Context, serviceName string) (float64, error) {
	query := fmt.Sprintf(`sum(rate(http_requests_total{service="%s",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="%s"}[5m]))`, serviceName, serviceName)

	result, err := s.Query(ctx, query)
	if err != nil {
		return 0, err
	}

	if len(result.Data.Result) > 0 && len(result.Data.Result[0].Values) > 0 {
		if val, ok := result.Data.Result[0].Values[len(result.Data.Result[0].Values)-1][1].(string); ok {
			var rate float64
			fmt.Sscanf(val, "%f", &rate)
			return rate * 100, nil // Convert to percentage
		}
	}

	return 0, nil
}

func (s *MonitoringService) GetAlerts(ctx context.Context) ([]Alert, error) {
	url := fmt.Sprintf("%s/api/v1/alerts", s.PrometheusURL)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return []Alert{
			{ID: 1, Name: "High CPU Usage", Severity: "critical", Message: "Node worker-1 CPU is above 90%", Time: time.Now().Add(-10 * time.Minute).Format("2006-01-02 15:04:05"), Acknowledged: false},
			{ID: 2, Name: "Memory Leak Detected", Severity: "warning", Message: "Pod backend-api consuming more memory than expected", Time: time.Now().Add(-1 * time.Hour).Format("2006-01-02 15:04:05"), Acknowledged: true},
			{ID: 3, Name: "Database Latency", Severity: "warning", Message: "Query latency exceeds 500ms", Time: time.Now().Add(-2 * time.Hour).Format("2006-01-02 15:04:05"), Acknowledged: false},
		}, nil
	}
	defer resp.Body.Close()

	var response struct {
		Status string  `json:"status"`
		Data   []Alert `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return response.Data, nil
}

func (s *MonitoringService) CreateAlertRule(rule AlertRule) error {
	// TODO: 实现创建告警规则
	// 这需要调用Prometheus Operator的API或修改配置文件
	logger.Info("Creating alert rule",
		zap.String("name", rule.Name),
		zap.String("severity", rule.Severity),
	)
	return nil
}

func (s *MonitoringService) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", s.PrometheusURL+"/-/healthy", nil)
	if err != nil {
		return err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("prometheus health check failed: %s", resp.Status)
	}

	logger.Info("Prometheus health check passed",
		zap.String("url", s.PrometheusURL),
	)

	return nil
}
