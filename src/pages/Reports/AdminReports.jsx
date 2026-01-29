import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Grid,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Tooltip,
  Skeleton,
  Divider,
  message,
  ConfigProvider,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DASHBOARD_API = "https://sirivaram-backed.onrender.com/api/admin/dashboard/summary";

const toNumber = (v) => Number(v) || 0;
const fmtNumber = (num) => toNumber(num).toLocaleString("en-IN");

const statusMeta = (status = "") => {
  const s = String(status).toLowerCase();
  if (["approved", "verified"].includes(s)) return { color: "success", icon: <CheckCircleOutlined /> };
  if (s === "pending") return { color: "warning", icon: <ClockCircleOutlined /> };
  if (s === "rejected") return { color: "error", icon: <CloseCircleOutlined /> };
  return { color: "default", icon: null };
};

const StatCard = ({ title, value, icon, valueColor, hint, statusLabel, tooltip, onClick, bgColor = "#ffffff" }) => {
  const { color, icon: statusIcon } = statusMeta(statusLabel);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={6}>
      <motion.div
        whileHover={{ y: -4, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card
          bordered={false}
          hoverable={!!onClick}
          onClick={onClick}
          style={{
            height: "100%",
            borderRadius: 16,
            background: bgColor,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.04)",
            transition: "all 0.3s ease",
          }}
          bodyStyle={{ padding: isMobile ? 16 : 20 }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
              <Text strong style={{ fontSize: isMobile ? 14 : 15, color: "rgba(0,0,0,0.88)" }}>
                {title}
              </Text>
              <Tooltip title={tooltip || title}>
                <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)", fontSize: isMobile ? 14 : 16 }} />
              </Tooltip>
            </Space>

            <Statistic
              value={fmtNumber(value)}
              prefix={<span style={{ fontSize: isMobile ? 22 : 28, color: valueColor }}>{icon}</span>}
              valueStyle={{
                fontSize: isMobile ? 28 : 36,
                fontWeight: 700,
                color: valueColor,
                lineHeight: 1.1,
              }}
            />

            <Space size={8} wrap>
              {statusLabel && (
                <Tag
                  icon={statusIcon}
                  color={color}
                  style={{ borderRadius: 6, padding: "0 8px", fontSize: isMobile ? 11 : 12, border: "none" }}
                >
                  {statusLabel}
                </Tag>
              )}
              {hint && (
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                  {hint}
                </Text>
              )}
              {onClick && <RightOutlined style={{ marginLeft: "auto", color: "rgba(0,0,0,0.35)", fontSize: 12 }} />}
            </Space>
          </Space>
        </Card>
      </motion.div>
    </Col>
  );
};

export default function AdminReports() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "Not refreshed yet";
    const diffMin = Math.floor((Date.now() - lastUpdated) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    return lastUpdated.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(DASHBOARD_API, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      message.success("Dashboard refreshed");
    } catch (e) {
      setError(e.name === "AbortError" ? "Request timeout" : e.message || "Failed to load data");
      setData(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setFirstLoad(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleNavigate = useCallback((path) => navigate(path), [navigate]);

  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

  const itemVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
          colorPrimary: "#1677ff",
          colorBgContainer: "#ffffff",
        },
      }}
    >
      <div style={{ padding: isMobile ? "16px 12px" : isTablet ? "20px 16px" : "24px 32px", maxWidth: "100%" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={16}>
              <Space direction="vertical" size={8}>
                <Title
                  level={isMobile ? 3 : 2}
                  style={{ margin: 0, fontWeight: 800, color: "rgba(0,0,0,0.88)" }}
                >
                  Admin Dashboard
                </Title>
                <Space size={8} wrap>
                  <Tag icon={<ClockCircleOutlined />} color="default" style={{ borderRadius: 8 }}>
                    Last updated: <Text strong>{lastUpdatedText}</Text>
                  </Tag>
                  <Tag color="blue" style={{ borderRadius: 8 }}>Live</Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: isMobile ? "left" : "right" }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={fetchSummary}
                size={isMobile ? "middle" : "large"}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                {isMobile ? "Refresh" : "Refresh Dashboard"}
              </Button>
            </Col>
          </Row>
        </motion.div>

        <Divider style={{ margin: "20px 0" }} />

        {/* Error */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Error Loading Dashboard"
            description={error}
            action={
              <Button type="primary" danger onClick={fetchSummary} loading={loading}>
                Retry
              </Button>
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}

        {/* Loading / Skeleton */}
        {firstLoad ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : loading && !firstLoad ? (
          <Card style={{ textAlign: "center", padding: 40, borderRadius: 16 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text strong>Refreshing data...</Text>
            </div>
          </Card>
        ) : data ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Users Section */}
            <Section
              title="Users Overview"
              extra={
                <Button type="link" icon={<SettingOutlined />} onClick={() => handleNavigate("/users")}>
                  Manage Users
                </Button>
              }
            >
              <StatCard
                title="Total Users"
                value={data.totalUsers}
                icon={<UserOutlined />}
                valueColor="#1677ff"
                tooltip="Total registered users"
                onClick={() => handleNavigate("/users")}
                bgColor="#e6f7ff"
              />
              <StatCard
                title="Pending Users"
                value={data.pendingUsers}
                icon={<ExclamationCircleOutlined />}
                valueColor="#faad14"
                statusLabel="Pending"
                hint="Action required"
                onClick={() => handleNavigate("/users")}
                bgColor="#fff7e6"
              />
              <StatCard
                title="Approved Users"
                value={data.approvedUsers}
                icon={<CheckCircleOutlined />}
                valueColor="#52c41a"
                statusLabel="Approved"
                onClick={() => handleNavigate("/users")}
                bgColor="#f6ffed"
              />
              <StatCard
                title="Rejected Users"
                value={data.rejectedUsers}
                icon={<CloseCircleOutlined />}
                valueColor="#ff4d4f"
                statusLabel="Rejected"
                onClick={() => handleNavigate("/users")}
                bgColor="#fff1f0"
              />
            </Section>

            {/* Events Section */}
            <Section
              title="Events Overview"
              extra={
                <Button type="link" icon={<SettingOutlined />} onClick={() => handleNavigate("/events")}>
                  Manage Events
                </Button>
              }
            >
              <StatCard title="Total Events" value={data.totalEvents} icon={<CalendarOutlined />} valueColor="#722ed1" onClick={() => handleNavigate("/events")} bgColor="#f9f0ff" />
              <StatCard title="Active Events" value={toNumber(data.activeEvents)} icon={<CheckCircleOutlined />} valueColor="#52c41a" statusLabel="Active" onClick={() => handleNavigate("/events")} bgColor="#f6ffed" />
              <StatCard title="Completed Events" value={toNumber(data.completedEvents)} icon={<CheckCircleOutlined />} valueColor="#1677ff" onClick={() => handleNavigate("/events")} bgColor="#e6f7ff" />
              <StatCard title="Pending Events" value={toNumber(data.pendingEvents)} icon={<ExclamationCircleOutlined />} valueColor="#faad14" statusLabel="Pending" onClick={() => handleNavigate("/events")} bgColor="#fff7e6" />
            </Section>

            {/* Payments Section */}
            <Section
              title="Payments Overview"
              extra={
                <Button type="link" icon={<SettingOutlined />} onClick={() => handleNavigate("/payments")}>
                  Manage Payments
                </Button>
              }
            >
              <StatCard title="Total Payments" value={data.totalPayments} icon={<DollarOutlined />} valueColor="#1677ff" onClick={() => handleNavigate("/payments")} bgColor="#e6f7ff" />
              <StatCard title="Pending Payments" value={data.pendingPayments} icon={<ExclamationCircleOutlined />} valueColor="#faad14" statusLabel="Pending" onClick={() => handleNavigate("/payments")} bgColor="#fff7e6" />
              <StatCard title="Verified Payments" value={data.verifiedPayments} icon={<CheckCircleOutlined />} valueColor="#52c41a" statusLabel="Verified" onClick={() => handleNavigate("/payments")} bgColor="#f6ffed" />
              <StatCard title="Rejected Payments" value={data.rejectedPayments} icon={<CloseCircleOutlined />} valueColor="#ff4d4f" statusLabel="Rejected" onClick={() => handleNavigate("/payments")} bgColor="#fff1f0" />
            </Section>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <Title level={4} style={{ marginBottom: 16 }}>Quick Actions</Title>
                <Row gutter={[12, 12]}>
                  {[
                    { icon: <UserOutlined />, text: "Manage Users", path: "/users" },
                    { icon: <CalendarOutlined />, text: "Manage Events", path: "/events" },
                    { icon: <DollarOutlined />, text: "Verify Payments", path: "/payments" },
                  ].map((item, i) => (
                    <Col xs={24} sm={8} key={i}>
                      <Button
                        block
                       
                        icon={item.icon}
                        size="large"
                        onClick={() => handleNavigate(item.path)}
                        style={{ height: 52, fontWeight: 600,backgroundColor:"#008cba",color:"white", borderRadius: 10 }}
                      >
                        {item.text}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card>
            </motion.div>
          </motion.div>
        ) : (
          !loading && !firstLoad && (
            <Card style={{ textAlign: "center", padding: 40, borderRadius: 16 }}>
              <Text type="secondary" style={{ fontSize: 16, display: "block", marginBottom: 16 }}>
                No dashboard data available yet.
              </Text>
              <Button type="primary" onClick={fetchSummary} icon={<ReloadOutlined />}>
                Load Data
              </Button>
            </Card>
          )
        )}
      </div>
    </ConfigProvider>
  );
}

const Section = ({ title, children, extra }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 24,
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {title}
          </Title>
          {extra}
        </Space>
        <Row gutter={[16, 16]}>{children}</Row>
      </Space>
    </Card>
  );
};