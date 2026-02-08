import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  Skeleton,
  Divider,
  message,
  ConfigProvider,
  Table,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DASHBOARD_API = "https://sirivaram-backed.onrender.com/api/admin/dashboard/summary";
const USERS_API = "https://sirivaram-backed.onrender.com/api/users";

const fmtNumber = (num) => (Number(num) || 0).toLocaleString("en-IN");

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

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

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

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(USERS_API, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });

      const list = Array.isArray(response.data) ? response.data : [];
      if (aliveRef.current) {
        setUsers(list);
      }
    } catch (err) {
      const msg =
        err?.name === "CanceledError"
          ? "Request cancelled"
          : err?.name === "AbortError"
            ? "Request timed out. Please try again."
            : err?.response?.data?.message ||
              "Failed to load users. Please try again.";

      if (aliveRef.current) {
        setUsers([]);
        message.error(msg);
      }
    } finally {
      clearTimeout(timeout);
      if (aliveRef.current) {
        setUsersLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchUsers();
  }, [fetchSummary, fetchUsers]);

  const handleNavigate = useCallback((path) => navigate(path), [navigate]);

  const mainCards = useMemo(() => [
    {
      title: "Total Users",
      value: data?.totalUsers || 0,
      icon: <UserOutlined />,
      color: "#1677ff",
      bgColor: "#e6f7ff",
      path: "/users",
    },
    {
      title: "Approved Users",
      value: data?.approvedUsers || 0,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
      bgColor: "#f6ffed",
      path: "/users",
    },
    {
      title: "Total Payments",
      value: data?.totalPayments || 0,
      icon: <DollarOutlined />,
      color: "#1677ff",
      bgColor: "#e6f7ff",
      path: "/payments",
    },
    {
      title: "Total Events",
      value: data?.totalEvents || 0,
      icon: <CalendarOutlined />,
      color: "#722ed1",
      bgColor: "#f9f0ff",
      path: "/events",
    },
  ], [data]);

  const userColumns = useMemo(
    () => [
      {
        title: "S.No",
        align: "center",
        width: 70,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "Name",
        dataIndex: "name",
        align: "center",
        render: (v) => <Text strong>{v || "—"}</Text>,
      },
      {
        title: "Email",
        dataIndex: "email",
        align: "center",
        responsive: ["md"],
      },
      {
        title: "Mobile",
        dataIndex: "mobile",
        align: "center",
        responsive: ["lg"],
      },
      {
        title: "Status",
        dataIndex: "status",
        align: "center",
        render: (status) => {
          const colors = {
            APPROVED: "success",
            PENDING: "warning",
            REJECTED: "error",
          };
          return <Tag color={colors[status] || "default"}>{status || "UNKNOWN"}</Tag>;
        },
      },
    ],
    []
  );

  const userStats = useMemo(() => {
    const total = users.length;
    const approved = users.filter(u => u.status === "APPROVED").length;
    const pending = users.filter(u => u.status === "PENDING").length;
    const rejected = users.filter(u => u.status === "REJECTED").length;
    return { total, approved, pending, rejected };
  }, [users]);

  const chartData = useMemo(() => ({
    labels: ["Total", "Approved", "Pending", "Rejected"],
    datasets: [
      {
        label: "Users Count",
        data: [userStats.total, userStats.approved, userStats.pending, userStats.rejected],
        borderColor: "#1677ff",
        backgroundColor: "rgba(22, 119, 255, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }), [userStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "User Statistics Overview",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

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
      <div style={{ padding: isMobile ? "12px" : isTablet ? "16px" : "20px", maxWidth: "100%", background: "#f5f5f5", minHeight: "100vh" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card bordered={false} style={{ marginBottom: 16, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Row gutter={[12, 12]} align="middle" justify="space-between">
              <Col xs={24} md={16}>
                <Space direction="vertical" size={4}>
                  <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontWeight: 700, color: "#008cba" }}>
                    Dashboard Overview
                  </Title>
                  <Space size={6} wrap>
                    <Tag icon={<ClockCircleOutlined />} color="blue" style={{ borderRadius: 6, fontSize: 11 }}>
                      {lastUpdatedText}
                    </Tag>
                    <Tag color="success" style={{ borderRadius: 6, fontSize: 11 }}>Live</Tag>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: isMobile ? "left" : "right" }}>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={fetchSummary}
                  size="middle"
                  style={{ borderRadius: 8, backgroundColor: "#008cba", color: "#ffffff", fontWeight: 600 }}
                >
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card>
        </motion.div>

        {/* Error */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Error"
            description={error}
            action={<Button size="small" danger onClick={fetchSummary}>Retry</Button>}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {/* Loading / Skeleton */}
        {firstLoad ? (
          <Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 8 }} /></Card>
        ) : loading && !firstLoad ? (
          <Card style={{ textAlign: "center", padding: 30, borderRadius: 12 }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}><Text>Refreshing...</Text></div>
          </Card>
        ) : data ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Main Stats Cards */}
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
              {mainCards.map((card, idx) => (
                <Col xs={12} sm={12} md={6} lg={6} key={idx}>
                  <motion.div whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Card
                      hoverable
                      onClick={() => handleNavigate(card.path)}
                      style={{
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.bgColor}dd 100%)`,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        border: `1.5px solid ${card.color}25`,
                        cursor: "pointer",
                      }}
                      bodyStyle={{ padding: isMobile ? 10 : 14 }}
                    >
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                          <span style={{ fontSize: isMobile ? 22 : 26, color: card.color }}>{card.icon}</span>
                          <RightOutlined style={{ color: "rgba(0,0,0,0.2)", fontSize: 10 }} />
                        </Space>
                        <Statistic
                          value={fmtNumber(card.value)}
                          valueStyle={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: card.color }}
                        />
                        <Text strong style={{ fontSize: isMobile ? 10 : 11, color: "rgba(0,0,0,0.6)" }}>
                          {card.title}
                        </Text>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* Users Overview Section */}
            <Card style={{ borderRadius: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space direction="vertical" size={0}>
                      <Title level={5} style={{ margin: 0, fontWeight: 700, color: "#1677ff" }}>
                        Users Overview
                      </Title>
                      <Text type="secondary" style={{ fontSize: 11 }}>Monitor registrations</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Button size="small" type="primary" onClick={() => handleNavigate("/users")} style={{ borderRadius: 6 }}>
                      View All
                    </Button>
                  </Col>
                </Row>

                {/* User Stats */}
                <Row gutter={[8, 8]}>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: "center", borderRadius: 8, background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)", border: "1px solid #1677ff20" }}>
                      <Statistic title="Total" value={userStats.total} valueStyle={{ color: "#1677ff", fontSize: isMobile ? 16 : 20, fontWeight: 700 }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: "center", borderRadius: 8, background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)", border: "1px solid #52c41a20" }}>
                      <Statistic title="Approved" value={userStats.approved} valueStyle={{ color: "#52c41a", fontSize: isMobile ? 16 : 20, fontWeight: 700 }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: "center", borderRadius: 8, background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)", border: "1px solid #faad1420" }}>
                      <Statistic title="Pending" value={userStats.pending} valueStyle={{ color: "#faad14", fontSize: isMobile ? 16 : 20, fontWeight: 700 }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: "center", borderRadius: 8, background: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)", border: "1px solid #ff4d4f20" }}>
                      <Statistic title="Rejected" value={userStats.rejected} valueStyle={{ color: "#ff4d4f", fontSize: isMobile ? 16 : 20, fontWeight: 700 }} />
                    </Card>
                  </Col>
                </Row>

                {/* Users Chart */}
                <Card size="small" style={{ borderRadius: 8, background: "#fafafa", border: "1px solid #e8e8e8" }}>
                  <div style={{ height: isMobile ? 180 : 240 }}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </Card>

                {/* Users Table */}
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  loading={usersLoading}
                  scroll={{ x: "100%" }}
                  pagination={{
                    pageSize: 8,
                    showSizeChanger: true,
                    pageSizeOptions: ["8", "16", "24"],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    size: "small",
                  }}
                  size={isMobile ? "small" : "middle"}
                  bordered
                  locale={{ emptyText: "No users found" }}
                />
              </Space>
            </Card>
          </motion.div>
        ) : (
          !loading && !firstLoad && (
            <Card style={{ textAlign: "center", padding: 30, borderRadius: 10 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>No data available</Text>
              <br />
              <Button type="primary" onClick={fetchSummary} icon={<ReloadOutlined />} style={{ marginTop: 12 }}>Load Data</Button>
            </Card>
          )
        )}
      </div>
    </ConfigProvider>
  );
}
