package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"backend/pkg/logger"
	"go.uber.org/zap"
)

type NotificationService struct {
	smtpHost     string
	smtpPort     int
	smtpUser     string
	smtpPassword string
}

func NewNotificationService(smtpHost string, smtpPort int, smtpUser, smtpPassword string) *NotificationService {
	return &NotificationService{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		smtpUser:     smtpUser,
		smtpPassword: smtpPassword,
	}
}

type NotificationMessage struct {
	Title   string                 `json:"title"`
	Content string                 `json:"content"`
	Level   string                 `json:"level"` // info, warning, error
	Data    map[string]interface{} `json:"data"`
}

type EmailConfig struct {
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Body    string   `json:"body"`
	HTML    bool     `json:"html"`
}

type DingTalkConfig struct {
	Webhook string            `json:"webhook"`
	Secret  string            `json:"secret"`
	AtMobiles []string        `json:"at_mobiles"`
	AtAll   bool              `json:"at_all"`
}

type WeChatConfig struct {
	Webhook string `json:"webhook"`
}

func (s *NotificationService) SendEmail(config *EmailConfig) error {
	if len(config.To) == 0 {
		return errors.New("no recipients specified")
	}

	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)

	msg := s.buildEmailMessage(config)

	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.smtpUser, config.To, msg)
	if err != nil {
		logger.Error("Failed to send email",
			zap.Strings("to", config.To),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Email sent successfully",
		zap.Strings("to", config.To),
		zap.String("subject", config.Subject),
	)

	return nil
}

func (s *NotificationService) buildEmailMessage(config *EmailConfig) []byte {
	contentType := "text/plain"
	if config.HTML {
		contentType = "text/html"
	}

	msg := fmt.Sprintf("From: %s\r\n", s.smtpUser)
	msg += fmt.Sprintf("To: %s\r\n", strings.Join(config.To, ";"))
	msg += fmt.Sprintf("Subject: %s\r\n", config.Subject)
	msg += fmt.Sprintf("Content-Type: %s; charset=UTF-8\r\n", contentType)
	msg += "\r\n"
	msg += config.Body

	return []byte(msg)
}

func (s *NotificationService) SendDingTalk(config *DingTalkConfig, message *NotificationMessage) error {
	if config.Webhook == "" {
		return errors.New("dingtalk webhook is required")
	}

	payload := map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]interface{}{
			"title": message.Title,
			"text":  message.Content,
		},
		"at": map[string]interface{}{
			"atMobiles": config.AtMobiles,
			"isAtAll":   config.AtAll,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(config.Webhook, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		logger.Error("Failed to send dingtalk notification",
			zap.Error(err),
		)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("dingtalk API error: %s", resp.Status)
	}

	logger.Info("DingTalk notification sent successfully",
		zap.String("title", message.Title),
	)

	return nil
}

func (s *NotificationService) SendWeChat(config *WeChatConfig, message *NotificationMessage) error {
	if config.Webhook == "" {
		return errors.New("wechat webhook is required")
	}

	payload := map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]interface{}{
			"content": fmt.Sprintf("## %s\n\n%s", message.Title, message.Content),
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(config.Webhook, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		logger.Error("Failed to send wechat notification",
			zap.Error(err),
		)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("wechat API error: %s", resp.Status)
	}

	logger.Info("WeChat notification sent successfully",
		zap.String("title", message.Title),
	)

	return nil
}

func (s *NotificationService) SendSMS(phone, content string) error {
	// TODO: 实现短信发送
	// 需要集成短信服务商API（如阿里云短信、腾讯云短信等）
	logger.Info("SMS sent",
		zap.String("phone", phone),
		zap.String("content", content),
	)
	return nil
}

func (s *NotificationService) SendBuildNotification(buildID string, status string, recipients []string) error {
	title := fmt.Sprintf("构建%s", status)
	content := fmt.Sprintf("构建ID: %s\n状态: %s\n时间: %s", buildID, status, time.Now().Format("2006-01-02 15:04:05"))

	// 发送邮件
	if len(recipients) > 0 {
		emailConfig := &EmailConfig{
			To:      recipients,
			Subject: title,
			Body:    content,
		}
		s.SendEmail(emailConfig)
	}

	return nil
}

func (s *NotificationService) SendDeploymentNotification(appName, namespace, status string, recipients []string) error {
	title := fmt.Sprintf("部署%s - %s", status, appName)
	content := fmt.Sprintf("应用: %s\n命名空间: %s\n状态: %s\n时间: %s",
		appName, namespace, status, time.Now().Format("2006-01-02 15:04:05"))

	// 发送邮件
	if len(recipients) > 0 {
		emailConfig := &EmailConfig{
			To:      recipients,
			Subject: title,
			Body:    content,
		}
		s.SendEmail(emailConfig)
	}

	return nil
}

func (s *NotificationService) SendAlertNotification(alertName, severity, message string, recipients []string) error {
	title := fmt.Sprintf("[%s] %s", severity, alertName)
	content := fmt.Sprintf("告警: %s\n级别: %s\n内容: %s\n时间: %s",
		alertName, severity, message, time.Now().Format("2006-01-02 15:04:05"))

	// 发送邮件
	if len(recipients) > 0 {
		emailConfig := &EmailConfig{
			To:      recipients,
			Subject: title,
			Body:    content,
		}
		s.SendEmail(emailConfig)
	}

	return nil
}

func (s *NotificationService) getLevelFromStatus(status string) string {
	switch status {
	case "success":
		return "info"
	case "failed", "error":
		return "error"
	case "running", "pending":
		return "info"
	default:
		return "warning"
	}
}

func (s *NotificationService) RenderTemplate(templateStr string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("notification").Parse(templateStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}
