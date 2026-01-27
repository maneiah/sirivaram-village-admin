import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  ArrowLeftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion"; // Add framer-motion for subtle animations

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DASHBOARD_API =
  "https://sirivaram-backed.onrender.com/api/admin/dashboard/summary";

/* Helpers */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (num) => toNumber(num).toLocaleString("en-IN");

const statusMeta = (status = "") => {
  const s = String(status).toLowerCase();
  if (s === "approved" || s === "verified")
    return { color: "success", icon: <CheckCircleOutlined /> };
  if (s === "pending")
    return { color: "warning", icon: <ClockCircleOutlined /> };
  if (s === "rejected")
    return { color: "error", icon: <CloseCircleOutlined /> };
  return { color: "default", icon: null };
};

const StatCard = ({
  title,
  value,
  icon,
  valueColor,
  hint,
  statusLabel,
  tooltip,
  onClick, // Add click handler for interactivity
}) => {
  const { color, icon: statusIcon } = statusMeta(statusLabel);
  const screens = useBreakpoint();

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={6}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card
          bordered
          style={{
            borderRadius: 16,
            height: "100%",
            cursor: onClick ? "pointer" : "default",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            transition: "box-shadow 0.3s ease",
          }}
          bodyStyle={{ padding: screens.xs ? 12 : 16 }}
          hoverable={!!onClick}
          onClick={onClick}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space align="center" style={{ justifyContent: "space-between" }}>
              <Text strong style={{ fontSize: screens.xs ? 14 : 16 }}>
                {title}
              </Text>
              <Tooltip title={tooltip || title}>
                <InfoCircleOutlined
                  style={{ color: "rgba(0,0,0,0.45)", fontSize: 16 }}
                />
              </Tooltip>
            </Space>

            <Statistic
              value={fmtNumber(value)}
              prefix={icon}
              valueStyle={{
                fontWeight: 800,
                color: valueColor,
                fontSize: screens.xs ? 24 : 28,
                lineHeight: 1.1,
              }}
            />

            <Space size={6} wrap>
              {statusLabel ? (
                <Tag icon={statusIcon} color={color} size="small">
                  {statusLabel}
                </Tag>
              ) : null}
              {hint ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {hint}
                </Text>
              ) : null}
            </Space>
          </Space>
        </Card>
      </motion.div>
    </Col>
  );
};

export default function AdminDashboardSummary() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return lastUpdated.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(DASHBOARD_API, {
        headers: { ...getAuthHeaders() },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Unable to load dashboard summary (HTTP ${res.status})${
            text ? ` - ${text}` : ""
          }`,
        );
      }

      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      message.success("Dashboard updated successfully!");
    } catch (e) {
      setError(
        e?.name === "AbortError"
          ? "Request timed out. Please check your connection and try again."
          : e?.message || "Failed to load dashboard summary.",
      );
      setData(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Mock navigation handlers for quick actions (replace with actual routes)
  const handleNavigate = (path) => {
    message.info(`Navigating to ${path}...`); // Placeholder
    // e.g., navigate(path);
  };

  const Section = ({ title, children, extra }) => (
    <Card
      bordered
      style={{ borderRadius: 16, marginBottom: 16 }}
      bodyStyle={{ padding: isMobile ? 16 : 20 }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space align="center" justify="space-between">
          <Title level={4} style={{ margin: 0, fontSize: isMobile ? 18 : 20 }}>
            {title}
          </Title>
          {extra}
        </Space>
        <Row gutter={[12, 12]}>{children}</Row>
      </Space>
    </Card>
  );

  // Animation variants for fade-in
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
          colorPrimary: "#1677ff",
        },
      }}
    >
      <div style={{ width: "100%", padding: isMobile ? "0 8px" : "0 16px" }}>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, #ffffff 0%, #ffffff 100%)",
              marginBottom: 16,
            }}
            bodyStyle={{ padding: isMobile ? 16 : 20 }}
          >
            <Row gutter={[12, 12]} align="middle" justify="space-between">
              <Col xs={20} md={16}>
                <Space direction="vertical" size={4}>
                  <Title level={3}>Admin Dashboard Summary</Title>
                  <Space size={8} wrap>
                    {lastUpdatedText ? (
                      <Tag
                        icon={<ClockCircleOutlined />}
                        color="blue"
                        size="small"
                      >
                        Last updated: <Text strong>{lastUpdatedText}</Text>
                      </Tag>
                    ) : (
                      <Tag color="default" size="small">
                        Not refreshed yet
                      </Tag>
                    )}
                    <Tag icon={<ReloadOutlined />} color="green" size="small">
                      Live Data
                    </Tag>
                  </Space>
                </Space>
              </Col>

              <Col xs={4} md={8}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchSummary}
                    loading={loading}
                    size={isMobile ? "middle" : "large"}
                    block={isMobile}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </motion.div>

        {/* ERROR */}
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginBottom: 16 }}
          >
            <Alert
              style={{ borderRadius: 12 }}
              type="error"
              showIcon
              message="Dashboard Load Error"
              description={
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Text>{error}</Text>
                  <Button
                    onClick={fetchSummary}
                    loading={loading}
                    type="primary"
                    icon={<ReloadOutlined />}
                    size="small"
                  >
                    Retry Now
                  </Button>
                </Space>
              }
            />
          </motion.div>
        ) : null}

        {/* FIRST LOAD SKELETON */}
        {firstLoad && (
          <Card style={{ marginBottom: 16, borderRadius: 16 }} bordered={false}>
            <Skeleton active paragraph={{ rows: 8 }} avatar={false} />
          </Card>
        )}

        {/* LOADING OVERLAY (after first load) */}
        {!firstLoad && loading && (
          <Card
            style={{ marginBottom: 16, borderRadius: 16, textAlign: "center" }}
            bordered={false}
          >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Spin size="large" />
              <Text strong type="secondary">
                Refreshing dashboard...
              </Text>
              <Text type="secondary">Please wait a moment</Text>
            </Space>
          </Card>
        )}

        {/* DATA */}
        {data && !firstLoad && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ marginBottom: 16 }}
          >
            <Section
              title="Users Overview"
              extra={
                <Button
                  type="link"
                  icon={<SettingOutlined />}
                  size="small"
                  onClick={() => handleNavigate("/admin/users")}
                >
                  Manage All
                </Button>
              }
            >
              <StatCard
                title="Total Users"
                value={data.totalUsers}
                icon={<UserOutlined />}
                valueColor="#1677ff"
                tooltip="Total registered users across the platform"
                onClick={() => handleNavigate("/admin/users")}
                cardStyle={{
                  // ✅ Added: Neutral blue bg for overview
                  background: "#f0f8ff",
                  border: "1px solid #1890ff",
                }}
              />
              <StatCard
                title="Pending Users"
                value={data.pendingUsers}
                icon={<ExclamationCircleOutlined />}
                valueColor="#faad14"
                statusLabel="Pending"
                tooltip="Users awaiting approval – review soon"
                hint="Needs action"
                onClick={() => handleNavigate("/admin/users?status=pending")}
                cardStyle={{
                  // ✅ Added: Light yellow bg for pending
                  background: "#fffbe6",
                  border: "1px solid #faad14",
                }}
              />
              <StatCard
                title="Approved Users"
                value={data.approvedUsers}
                icon={<CheckCircleOutlined />}
                valueColor="#52c41a"
                statusLabel="Approved"
                tooltip="Active and verified users"
                hint="All set"
                onClick={() => handleNavigate("/admin/users?status=approved")}
                cardStyle={{
                  // ✅ Added: Light green bg for approved
                  background: "#f6ffed",
                  border: "1px solid #52c41a",
                }}
              />
              {/* ✅ ADDED: Rejected Users StatCard for complete User Overview */}
              <StatCard
                title="Rejected Users"
                value={toNumber(data.rejectedUsers || 0)} // Fallback to 0 if not in API response
                icon={<CloseCircleOutlined />}
                valueColor="#ff4d4f"
                statusLabel="Rejected"
                tooltip="Users that were declined during approval"
                hint="Review logs"
                onClick={() => handleNavigate("/admin/users?status=rejected")}
                cardStyle={{
                  // ✅ Added: Light red bg for rejected
                  background: "#fff2e8",
                  border: "1px solid #ff4d4f",
                }}
              />
            </Section>

            {/* ✅ ADDED/EXPANDED: Events Overview with additional views (assuming API fields; fallback to 0) */}
            <Section
              title="Events Overview"
              extra={
                <Button
                  type="link"
                  icon={<SettingOutlined />}
                  size="small"
                  onClick={() => handleNavigate("/admin/events")}
                >
                  Manage All
                </Button>
              }
            >
              <StatCard
                title="Total Events"
                value={data.totalEvents}
                icon={<CalendarOutlined />}
                valueColor="#722ed1"
                tooltip="All events created and managed"
                onClick={() => handleNavigate("/admin/events")}
              />
              {/* ✅ ADDED: Additional Event Stats for better overview (fallback to 0 if not in API) */}
              <StatCard
                title="Active Events"
                value={toNumber(data.activeEvents || 0)}
                icon={<CheckCircleOutlined />}
                valueColor="#52c41a"
                statusLabel="Active"
                tooltip="Ongoing or upcoming events"
                hint="Monitor closely"
                onClick={() => handleNavigate("/admin/events?status=active")}
              />
              <StatCard
                title="Completed Events"
                value={toNumber(data.completedEvents || 0)}
                icon={<CheckCircleOutlined />}
                valueColor="#1677ff"
                tooltip="Events that have finished"
                hint="Archive if needed"
                onClick={() => handleNavigate("/admin/events?status=completed")}
              />
              <StatCard
                title="Pending Events"
                value={toNumber(data.pendingEvents || 0)}
                icon={<ExclamationCircleOutlined />}
                valueColor="#faad14"
                statusLabel="Pending"
                tooltip="Events awaiting approval or setup"
                hint="Review soon"
                onClick={() => handleNavigate("/admin/events?status=pending")}
              />
            </Section>

            {/* Payments Overview remains the same as requested */}
            <Section
              title="Payments Overview"
              extra={
                <Button
                  type="link"
                  icon={<SettingOutlined />}
                  size="small"
                  onClick={() => handleNavigate("/admin/payments")}
                >
                  Manage All
                </Button>
              }
            >
              <StatCard
                title="Total Payments"
                value={data.totalPayments}
                icon={<DollarOutlined />}
                valueColor="#1677ff"
                tooltip="All payment transactions recorded"
                onClick={() => handleNavigate("/admin/payments")}
              />
              <StatCard
                title="Pending Payments"
                value={data.pendingPayments}
                icon={<ExclamationCircleOutlined />}
                valueColor="#faad14"
                statusLabel="Pending"
                tooltip="Payments requiring verification"
                hint="Prioritize these"
                onClick={() => handleNavigate("/admin/payments?status=pending")}
              />
              <StatCard
                title="Verified Payments"
                value={data.verifiedPayments}
                icon={<CheckCircleOutlined />}
                valueColor="#52c41a"
                statusLabel="Verified"
                tooltip="Successfully processed payments"
                hint="Confirmed"
                onClick={() =>
                  handleNavigate("/admin/payments?status=verified")
                }
              />
              <StatCard
                title="Rejected Payments"
                value={data.rejectedPayments}
                icon={<CloseCircleOutlined />}
                valueColor="#ff4d4f"
                statusLabel="Rejected"
                tooltip="Payments that were declined"
                hint="Review logs"
                onClick={() =>
                  handleNavigate("/admin/payments?status=rejected")
                }
              />
            </Section>

            <motion.div variants={itemVariants}>
              <Card bordered style={{ borderRadius: 16 }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Space align="center">
                    <Title
                      level={4}
                      style={{ margin: 0, fontSize: isMobile ? 18 : 20 }}
                    >
                      Quick Actions
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      Jumpstart your workflow with these shortcuts
                    </Text>
                  </Space>
                  <Divider style={{ margin: "12px 0" }} />
                  <Row gutter={[8, 8]}>
                    <Col xs={24} sm={12} md={8}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          block
                          type="primary"
                          ghost
                          icon={<UserOutlined />}
                          size="large"
                          onClick={() => handleNavigate("/admin/users")}
                          style={{ borderRadius: 12, height: 48 }}
                        >
                          Manage Users
                        </Button>
                      </motion.div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          block
                          type="primary"
                          ghost
                          icon={<CalendarOutlined />}
                          size="large"
                          onClick={() => handleNavigate("/admin/events")}
                          style={{ borderRadius: 12, height: 48 }}
                        >
                          Manage Events
                        </Button>
                      </motion.div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          block
                          type="primary"
                          ghost
                          icon={<DollarOutlined />}
                          size="large"
                          onClick={() => handleNavigate("/admin/payments")}
                          style={{ borderRadius: 12, height: 48 }}
                        >
                          Verify Payments
                        </Button>
                      </motion.div>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* EMPTY */}
        {!loading && !data && !error && !firstLoad && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", marginTop: 32 }}
          >
            <Card
              style={{ borderRadius: 16, maxWidth: 400, margin: "0 auto" }}
              bordered={false}
            >
              <Space direction="vertical" size={16}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  No data available yet.
                </Text>
                <Button
                  type="primary"
                  size="large"
                  onClick={fetchSummary}
                  icon={<ReloadOutlined />}
                  style={{ borderRadius: 12 }}
                >
                  Load Dashboard
                </Button>
              </Space>
            </Card>
          </motion.div>
        )}
      </div>
    </ConfigProvider>
  );
}
