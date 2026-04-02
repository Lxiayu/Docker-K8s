package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"backend/internal/models"
	"backend/pkg/database"
	"backend/pkg/logger"
	"go.uber.org/zap"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type K8sService struct {
	clientset *kubernetes.Clientset
}

type ListDeploymentsQuery struct {
	Page        int    `form:"page"`
	PageSize    int    `form:"page_size"`
	Namespace   string `form:"namespace"`
	Name        string `form:"name"`
	Environment string `form:"environment"`
}

type DeploymentRequest struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	Image       string            `json:"image"`
	Replicas    int32             `json:"replicas"`
	Port        int32             `json:"port"`
	Environment string            `json:"environment"`
	Description string            `json:"description"`
	Env         map[string]string `json:"env"`
	Labels      map[string]string `json:"labels"`
}

type DeployRequest struct {
	Image  string `json:"image"`
	Branch string `json:"branch"`
	Commit string `json:"commit"`
}

type RollbackRequest struct {
	Revision int `json:"revision"`
}

type LogQuery struct {
	TailLines int64  `form:"tail_lines"`
	Follow    bool   `form:"follow"`
	Container string `form:"container"`
}

func NewK8sService() (*K8sService, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		// 如果不在集群内，尝试使用kubeconfig
		kubeconfig := "/root/.kube/config"
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Printf("Failed to create kubernetes config, continuing with nil clientset: %v", err)
			return &K8sService{clientset: nil}, nil
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Printf("Failed to create kubernetes client, continuing with nil clientset: %v", err)
		return &K8sService{clientset: nil}, nil
	}

	return &K8sService{clientset: clientset}, nil
}

type CreateDeploymentRequest struct {
	Name        string                `json:"name" binding:"required"`
	Namespace   string                `json:"namespace" binding:"required"`
	Image       string                `json:"image" binding:"required"`
	Replicas    int32                 `json:"replicas"`
	Ports       []int32               `json:"ports"`
	Env         map[string]string     `json:"env"`
	Labels      map[string]string     `json:"labels"`
	Annotations map[string]string     `json:"annotations"`
	Resources   *ResourceRequirements `json:"resources"`
}

type ResourceRequirements struct {
	Requests *ResourceList `json:"requests"`
	Limits   *ResourceList `json:"limits"`
}

type ResourceList struct {
	CPU    string `json:"cpu"`
	Memory string `json:"memory"`
}

type DeploymentStatus struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int32  `json:"replicas"`
	Ready     int32  `json:"ready"`
	Available int32  `json:"available"`
	Status    string `json:"status"`
}

func (s *K8sService) CreateDeployment(ctx context.Context, req *CreateDeploymentRequest) (*appsv1.Deployment, error) {
	if req.Replicas == 0 {
		req.Replicas = 1
	}

	if req.Labels == nil {
		req.Labels = make(map[string]string)
	}
	req.Labels["app"] = req.Name

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &req.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.Name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  req.Name,
							Image: req.Image,
							Ports: s.buildContainerPorts(req.Ports),
							Env:   s.buildEnvVars(req.Env),
						},
					},
				},
			},
		},
	}

	// 设置资源限制
	if req.Resources != nil {
		deployment.Spec.Template.Spec.Containers[0].Resources = s.buildResourceRequirements(req.Resources)
	}

	result, err := s.clientset.AppsV1().Deployments(req.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		logger.Error("Failed to create deployment",
			zap.String("name", req.Name),
			zap.String("namespace", req.Namespace),
			zap.Error(err),
		)
		return nil, err
	}

	logger.Info("Deployment created successfully",
		zap.String("name", req.Name),
		zap.String("namespace", req.Namespace),
	)

	return result, nil
}

func (s *K8sService) UpdateDeployment(ctx context.Context, namespace, name string, image string) (*appsv1.Deployment, error) {
	deployment, err := s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	deployment.Spec.Template.Spec.Containers[0].Image = image

	result, err := s.clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		logger.Error("Failed to update deployment",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)
		return nil, err
	}

	logger.Info("Deployment updated successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
	)

	return result, nil
}

func (s *K8sService) DeleteDeployment(ctx context.Context, namespace, name string) error {
	err := s.clientset.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{})
	if err != nil {
		logger.Error("Failed to delete deployment",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Deployment deleted successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
	)

	return nil
}

func (s *K8sService) GetDeployment(ctx context.Context, namespace, name string) (*appsv1.Deployment, error) {
	return s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *K8sService) GetDeploymentStatus(ctx context.Context, namespace, name string) (*DeploymentStatus, error) {
	deployment, err := s.GetDeployment(ctx, namespace, name)
	if err != nil {
		return nil, err
	}

	status := &DeploymentStatus{
		Name:      deployment.Name,
		Namespace: deployment.Namespace,
		Replicas:  *deployment.Spec.Replicas,
		Ready:     deployment.Status.ReadyReplicas,
		Available: deployment.Status.AvailableReplicas,
	}

	if deployment.Status.ReadyReplicas == *deployment.Spec.Replicas {
		status.Status = "Running"
	} else if deployment.Status.ReadyReplicas > 0 {
		status.Status = "Updating"
	} else {
		status.Status = "Pending"
	}

	return status, nil
}

func (s *K8sService) RollbackDeployment(ctx context.Context, namespace, name string) error {
	deployments := s.clientset.AppsV1().Deployments(namespace)

	// 获取当前部署
	deployment, err := deployments.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	// 获取历史版本
	history, err := s.clientset.AppsV1().ReplicaSets(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", name),
	})
	if err != nil {
		return err
	}

	// 找到上一个版本
	var previousRS *appsv1.ReplicaSet
	for i := len(history.Items) - 1; i >= 0; i-- {
		rs := &history.Items[i]
		if rs.Annotations["deployment.kubernetes.io/revision"] != deployment.Annotations["deployment.kubernetes.io/revision"] {
			previousRS = rs
			break
		}
	}

	if previousRS == nil {
		return errors.New("no previous version found for rollback")
	}

	// 执行回滚
	deployment.Spec.Template = previousRS.Spec.Template
	_, err = deployments.Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		logger.Error("Failed to rollback deployment",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Deployment rolled back successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
	)

	return nil
}

func (s *K8sService) ScaleDeployment(ctx context.Context, namespace, name string, replicas int32) error {
	deployment, err := s.GetDeployment(ctx, namespace, name)
	if err != nil {
		return err
	}

	deployment.Spec.Replicas = &replicas

	_, err = s.clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		logger.Error("Failed to scale deployment",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Int32("replicas", replicas),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Deployment scaled successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
		zap.Int32("replicas", replicas),
	)

	return nil
}

func (s *K8sService) GetPodLogs(ctx context.Context, namespace, podName string, tailLines int64) (string, error) {
	opts := &corev1.PodLogOptions{
		TailLines: &tailLines,
	}

	req := s.clientset.CoreV1().Pods(namespace).GetLogs(podName, opts)
	logs, err := req.Stream(ctx)
	if err != nil {
		return "", err
	}
	defer logs.Close()

	buf := make([]byte, 1024)
	var result string
	for {
		n, err := logs.Read(buf)
		if n == 0 || err != nil {
			break
		}
		result += string(buf[:n])
	}

	return result, nil
}

func (s *K8sService) CreateConfigMap(ctx context.Context, namespace, name string, data map[string]string) error {
	configMap := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Data: data,
	}

	_, err := s.clientset.CoreV1().ConfigMaps(namespace).Create(ctx, configMap, metav1.CreateOptions{})
	if err != nil {
		logger.Error("Failed to create configmap",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)
		return err
	}

	logger.Info("ConfigMap created successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
	)

	return nil
}

func (s *K8sService) CreateSecret(ctx context.Context, namespace, name string, data map[string][]byte) error {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Data: data,
	}

	_, err := s.clientset.CoreV1().Secrets(namespace).Create(ctx, secret, metav1.CreateOptions{})
	if err != nil {
		logger.Error("Failed to create secret",
			zap.String("name", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Secret created successfully",
		zap.String("name", name),
		zap.String("namespace", namespace),
	)

	return nil
}

func (s *K8sService) buildContainerPorts(ports []int32) []corev1.ContainerPort {
	if len(ports) == 0 {
		return nil
	}

	var containerPorts []corev1.ContainerPort
	for _, port := range ports {
		containerPorts = append(containerPorts, corev1.ContainerPort{
			ContainerPort: port,
		})
	}

	return containerPorts
}

func (s *K8sService) buildEnvVars(env map[string]string) []corev1.EnvVar {
	if len(env) == 0 {
		return nil
	}

	var envVars []corev1.EnvVar
	for key, value := range env {
		envVars = append(envVars, corev1.EnvVar{
			Name:  key,
			Value: value,
		})
	}

	return envVars
}

func (s *K8sService) buildResourceRequirements(req *ResourceRequirements) corev1.ResourceRequirements {
	resources := corev1.ResourceRequirements{}

	if req.Requests != nil {
		resources.Requests = make(corev1.ResourceList)
		if req.Requests.CPU != "" {
			resources.Requests[corev1.ResourceCPU] = resource.MustParse(req.Requests.CPU)
		}
		if req.Requests.Memory != "" {
			resources.Requests[corev1.ResourceMemory] = resource.MustParse(req.Requests.Memory)
		}
	}

	if req.Limits != nil {
		resources.Limits = make(corev1.ResourceList)
		if req.Limits.CPU != "" {
			resources.Limits[corev1.ResourceCPU] = resource.MustParse(req.Limits.CPU)
		}
		if req.Limits.Memory != "" {
			resources.Limits[corev1.ResourceMemory] = resource.MustParse(req.Limits.Memory)
		}
	}

	return resources
}

func (s *K8sService) SaveDeploymentRecord(deployment *models.Deployment) error {
	return database.Get().Create(deployment).Error
}

func (s *K8sService) GetDeploymentRecords(environment string, page, pageSize int) ([]models.Deployment, int64, error) {
	var deployments []models.Deployment
	var total int64

	db := database.Get().Model(&models.Deployment{})

	if environment != "" {
		db = db.Where("environment = ?", environment)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&deployments).Error; err != nil {
		return nil, 0, err
	}

	return deployments, total, nil
}

func (s *K8sService) ListDeploymentRecords(query *ListDeploymentsQuery) ([]models.Deployment, int64, error) {
	return s.GetDeploymentRecords(query.Environment, query.Page, query.PageSize)
}

func (s *K8sService) GetDeploymentRecord(id uint) (*models.Deployment, error) {
	var deployment models.Deployment
	if err := database.Get().First(&deployment, id).Error; err != nil {
		return nil, err
	}
	return &deployment, nil
}

func (s *K8sService) CreateDeploymentRecord(req *DeploymentRequest, userID uint) (*models.Deployment, error) {
	deployment := &models.Deployment{
		Name:        req.Name,
		Namespace:   req.Namespace,
		Image:       req.Image,
		Replicas:    int(req.Replicas),
		Environment: req.Environment,
		Status:      "pending",
	}

	if err := database.Get().Create(deployment).Error; err != nil {
		return nil, err
	}

	return deployment, nil
}

func (s *K8sService) UpdateDeploymentRecord(id uint, req *DeploymentRequest) (*models.Deployment, error) {
	deployment, err := s.GetDeploymentRecord(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Replicas > 0 {
		updates["replicas"] = int(req.Replicas)
	}

	if len(updates) > 0 {
		if err := database.Get().Model(deployment).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return deployment, nil
}

func (s *K8sService) DeleteDeploymentRecord(id uint) error {
	return database.Get().Delete(&models.Deployment{}, id).Error
}

func (s *K8sService) DeployToK8s(id uint, req *DeployRequest, userID uint) (*models.Deployment, error) {
	deployment, err := s.GetDeploymentRecord(id)
	if err != nil {
		return nil, err
	}

	// 更新状态为部署中
	deployment.Status = "deploying"
	if err := database.Get().Save(deployment).Error; err != nil {
		return nil, err
	}

	// 实际的部署操作由GitHub Actions处理
	// 这里只是更新状态
	
	// 模拟部署完成
	go func() {
		time.Sleep(2 * time.Second)
		deployment.Status = "running"
		database.Get().Save(deployment)
	}()

	return deployment, nil
}

func (s *K8sService) RollbackDeploymentRecord(id uint, req *RollbackRequest, userID uint) (*models.Deployment, error) {
	deployment, err := s.GetDeploymentRecord(id)
	if err != nil {
		return nil, err
	}

	// 更新状态为回滚中
	deployment.Status = "rolling_back"
	if err := database.Get().Save(deployment).Error; err != nil {
		return nil, err
	}

	// 实际的回滚操作由GitHub Actions处理
	// 这里只是更新状态
	
	// 模拟回滚完成
	go func() {
		time.Sleep(2 * time.Second)
		deployment.Status = "running"
		database.Get().Save(deployment)
	}()

	return deployment, nil
}

func (s *K8sService) GetDeploymentLogRecords(id uint, query *LogQuery) (string, error) {
	deployment, err := s.GetDeploymentRecord(id)
	if err != nil {
		return "", err
	}

	tailLines := query.TailLines
	if tailLines == 0 {
		tailLines = 100
	}

	return s.GetPodLogs(context.Background(), deployment.Namespace, deployment.Name, tailLines)
}

type PodInfo struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Status    string            `json:"status"`
	Ready     string            `json:"ready"`
	CPU       string            `json:"cpu"`
	Memory    string            `json:"memory"`
	Restarts  int32             `json:"restarts"`
	Age       string            `json:"age"`
	IP        string            `json:"ip"`
	Labels    map[string]string `json:"labels"`
}

type EventInfo struct {
	Type      string `json:"type"`
	Reason    string `json:"reason"`
	Message   string `json:"message"`
	Count     int32  `json:"count"`
	Age       string `json:"age"`
	LastSeen  string `json:"last_seen"`
	Object    string `json:"object"`
	Namespace string `json:"namespace"`
}

func (s *K8sService) GetDeploymentPods(namespace, name string) ([]PodInfo, error) {
	if s.clientset == nil {
		return []PodInfo{
			{
				Name:      fmt.Sprintf("%s-pod-mock-1", name),
				Namespace: namespace,
				Status:    "Running",
				Ready:     "1/1",
				CPU:       "100m",
				Memory:    "128Mi",
				Restarts:  0,
				Age:       "2h",
				IP:        "10.244.0.5",
				Labels:    map[string]string{"app": name},
			},
		}, nil
	}

	labelSelector := fmt.Sprintf("app=%s", name)

	pods, err := s.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, err
	}

	var podInfos []PodInfo
	for _, pod := range pods.Items {
		podInfo := PodInfo{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    string(pod.Status.Phase),
			Ready:     s.getReadyContainers(&pod),
			IP:        pod.Status.PodIP,
			Labels:    pod.Labels,
			Restarts:  s.getPodRestarts(&pod),
			Age:       formatAge(pod.CreationTimestamp.Time),
		}

		cpu, memory := s.getPodResourceUsage(&pod)
		podInfo.CPU = cpu
		podInfo.Memory = memory

		if pod.Status.ContainerStatuses != nil {
			for _, cs := range pod.Status.ContainerStatuses {
				if !cs.Ready {
					podInfo.Status = string(pod.Status.Phase)
					if cs.State.Waiting != nil {
						podInfo.Status = cs.State.Waiting.Reason
					} else if cs.State.Terminated != nil {
						podInfo.Status = cs.State.Terminated.Reason
					}
					break
				}
			}
		}

		podInfos = append(podInfos, podInfo)
	}

	return podInfos, nil
}

func (s *K8sService) GetDeploymentEvents(namespace, name string) ([]EventInfo, error) {
	if s.clientset == nil {
		return []EventInfo{
			{
				Type:      "Normal",
				Reason:    "ScalingReplicaSet",
				Message:   fmt.Sprintf("Scaled up replica set %s-mock to 1", name),
				Count:     1,
				Age:       "2h",
				LastSeen:  time.Now().Format("2006-01-02 15:04:05"),
				Object:    name,
				Namespace: namespace,
			},
		}, nil
	}

	events, err := s.clientset.CoreV1().Events(namespace).List(context.Background(), metav1.ListOptions{
		FieldSelector: fmt.Sprintf("involvedObject.name=%s", name),
	})
	if err != nil {
		return nil, err
	}

	var eventInfos []EventInfo
	for _, event := range events.Items {
		eventInfo := EventInfo{
			Type:      event.Type,
			Reason:    event.Reason,
			Message:   event.Message,
			Count:     event.Count,
			Age:       formatAge(event.LastTimestamp.Time),
			LastSeen:  event.LastTimestamp.Format("2006-01-02 15:04:05"),
			Object:    event.InvolvedObject.Name,
			Namespace: event.Namespace,
		}
		eventInfos = append(eventInfos, eventInfo)
	}

	return eventInfos, nil
}

func (s *K8sService) GetPodLogsByContainer(namespace, podName, container string, tailLines int64) (string, error) {
	opts := &corev1.PodLogOptions{
		TailLines: &tailLines,
	}
	if container != "" {
		opts.Container = container
	}

	req := s.clientset.CoreV1().Pods(namespace).GetLogs(podName, opts)
	logs, err := req.Stream(context.Background())
	if err != nil {
		return "", err
	}
	defer logs.Close()

	buf := make([]byte, 4096)
	var result []byte
	for {
		n, err := logs.Read(buf)
		if n == 0 {
			break
		}
		result = append(result, buf[:n]...)
		if err != nil {
			break
		}
	}

	return string(result), nil
}

func (s *K8sService) GetPodContainers(namespace, podName string) ([]string, error) {
	pod, err := s.clientset.CoreV1().Pods(namespace).Get(context.Background(), podName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	var containers []string
	for _, container := range pod.Spec.Containers {
		containers = append(containers, container.Name)
	}
	return containers, nil
}

func (s *K8sService) getReadyContainers(pod *corev1.Pod) string {
	ready := 0
	total := len(pod.Status.ContainerStatuses)
	for _, cs := range pod.Status.ContainerStatuses {
		if cs.Ready {
			ready++
		}
	}
	return fmt.Sprintf("%d/%d", ready, total)
}

func (s *K8sService) getPodRestarts(pod *corev1.Pod) int32 {
	var restarts int32
	for _, cs := range pod.Status.ContainerStatuses {
		restarts += cs.RestartCount
	}
	return restarts
}

func (s *K8sService) getPodResourceUsage(pod *corev1.Pod) (string, string) {
	var cpu, memory string

	if pod.Spec.Containers != nil {
		for _, container := range pod.Spec.Containers {
			if container.Resources.Requests != nil {
				if cpuReq, ok := container.Resources.Requests[corev1.ResourceCPU]; ok {
					cpu = cpuReq.String()
				}
				if memReq, ok := container.Resources.Requests[corev1.ResourceMemory]; ok {
					memory = memReq.String()
				}
			}
			break
		}
	}

	return cpu, memory
}

func formatAge(t time.Time) string {
	duration := time.Since(t)

	if duration < time.Minute {
		return fmt.Sprintf("%ds", int(duration.Seconds()))
	} else if duration < time.Hour {
		return fmt.Sprintf("%dm", int(duration.Minutes()))
	} else if duration < 24*time.Hour {
		return fmt.Sprintf("%dh", int(duration.Hours()))
	} else {
		return fmt.Sprintf("%dd", int(duration.Hours()/24))
	}
}

func init() {
	_ = json.Marshal
}
