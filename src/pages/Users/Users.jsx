import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Drawer,
  Empty,
  Grid,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
  Skeleton,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API_BASE = "https://sirivaram-backed.onrender.com/api/users";

const safeText = (v) =>
  v === null || v === undefined || v === "" ? "-" : String(v);

const truncateText = (v, max = 40) => {
  const s = safeText(v);
  if (s === "-" || s.length <= max) return s;
  return s.slice(0, max) + "…";
};

const statusTag = (status) => {
  if (status === "APPROVED")
    return (
      <Tag
        icon={<CheckCircleOutlined />}
        color="success"
        style={{
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 600,
          border: "none",
        }}
      >
        APPROVED
      </Tag>
    );
  if (status === "PENDING")
    return (
      <Tag
        icon={<ClockCircleOutlined />}
        color="warning"
        style={{
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 600,
          border: "none",
        }}
      >
        PENDING
      </Tag>
    );
  if (status === "REJECTED")
    return (
      <Tag
        icon={<CloseCircleOutlined />}
        color="error"
        style={{
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 600,
          border: "none",
        }}
      >
        REJECTED
      </Tag>
    );
  return (
    <Tag
      color="default"
      style={{
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      UNKNOWN
    </Tag>
  );
};

const roleTag = (role) =>
  role === "ADMIN" ? (
    <Tag
      icon={<UserOutlined />}
      color="blue"
      style={{
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        border: "none",
      }}
    >
      ADMIN
    </Tag>
  ) : (
    <Tag
      icon={<UserOutlined />}
      color="cyan"
      style={{
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        border: "none",
      }}
    >
      USER
    </Tag>
  );

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function Users() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState({
    id: null,
    action: null,
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination state for correct S No
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const getToken = () => localStorage.getItem("token");

  const showNotification = (type, msg, description) => {
    notification[type]({
      message: msg,
      description,
      duration: 3,
      placement: "topRight",
    });
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const token = getToken();
      const response = await axios.get(API_BASE, {
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
        setError(msg);
        showNotification("error", "Failed to Load Users", msg);
      }
    } finally {
      clearTimeout(timeout);
      if (aliveRef.current) {
        setLoading(false);
        setFirstLoad(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const blob = [
        u?.name,
        u?.mobile,
        u?.village,
        u?.role,
        u?.status,
      ]
        .map((x) => (x === null || x === undefined ? "" : String(x)))
        .join(" ")
        .toLowerCase();

      return blob.includes(q);
    });
  }, [users, debouncedSearch]);

  const updateUserStatus = useCallback(
    async (userId, action) => {
      setActionLoading({ id: userId, action });
      try {
        const token = getToken();

        const res = await axios.put(
          `${API_BASE}/${userId}/${action}`,
          {},
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );

        const ok = res.data?.success !== false;
        if (ok) {
          const msg = res.data?.message || `User ${action}d successfully`;
          showNotification("success", "User Updated", msg);
          await fetchUsers();
        } else {
          const msg = res.data?.message || `${action.toUpperCase()} failed`;
          showNotification("error", "Update Failed", msg);
        }
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          `Something went wrong while ${action}ing user`;
        showNotification("error", "Action Failed", msg);
      } finally {
        if (aliveRef.current) {
          setActionLoading({ id: null, action: null });
        }
      }
    },
    [fetchUsers],
  );

  const deleteUser = useCallback(
    async (userId) => {
      setActionLoading({ id: userId, action: "delete" });
      try {
        const token = getToken();
        const res = await axios.delete(`${API_BASE}/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const ok = res.data?.success !== false;
        if (ok) {
          const msg = res.data?.message || "User deleted successfully";
          showNotification("success", "User Deleted", msg);
          await fetchUsers();
        } else {
          const msg = res.data?.message || "Delete failed";
          showNotification("error", "Delete Failed", msg);
        }
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          "Something went wrong while deleting user";
        showNotification("error", "Delete Failed", msg);
      } finally {
        if (aliveRef.current) {
          setActionLoading({ id: null, action: null });
        }
      }
    },
    [fetchUsers],
  );

  const confirmApprove = (user) => {
    Modal.confirm({
      title: `Approve ${safeText(user?.name)}?`,
      icon: <ExclamationCircleOutlined />,
      content: "User will be marked as APPROVED.",
      okText: "Approve",
      okButtonProps: { type: "primary" },
      cancelText: "Cancel",
      onOk: () => updateUserStatus(user.id, "approve"),
    });
  };

  const confirmReject = (user) => {
    Modal.confirm({
      title: `Reject ${safeText(user?.name)}?`,
      icon: <ExclamationCircleOutlined />,
      content: "User will be marked as REJECTED.",
      okText: "Reject",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => updateUserStatus(user.id, "reject"),
    });
  };

  const confirmDelete = (user) => {
    Modal.confirm({
      title: `Delete ${safeText(user?.name)}?`,
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => deleteUser(user.id),
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "S No",
        align: "center",
        width: 80,
        render: (_, __, index) => (page - 1) * pageSize + index + 1, // ✅ correct
      },
      {
        title: "Name",
        dataIndex: "name",
        render: (v, u) => (
          <Space size={12}>
            <Avatar
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#008cba",
                boxShadow: "0 2px 8px rgba(22, 119, 255, 0.3)",
              }}
            />
            <Space direction="vertical" size={2}>
              <Text
                strong
                ellipsis={{ tooltip: safeText(v) }}
                style={{ fontSize: isMobile ? 13 : 14 }}
              >
                {safeText(v)}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                ID: {safeText(u?.id)}
              </Text>
            </Space>
          </Space>
        ),
       
      },
      {
        title: "Mobile",
        dataIndex: "mobile",
        align: "center",
        render: (v) => (
          <Text
            ellipsis={{ tooltip: safeText(v) }}
            style={{ fontWeight: 500, fontFamily: "monospace" }}
          >
            {safeText(v)}
          </Text>
        ),
        responsive: ["sm"],
      },
      {
        title: "Village",
        dataIndex: "village",
        align: "center",
        render: (v) => (
          <Text
            ellipsis={{ tooltip: safeText(v) }}
            style={{ fontWeight: 500 }}
          >
            {safeText(v)}
          </Text>
        ),
        responsive: ["sm"],
      },
      {
        title: "Role",
        dataIndex: "role",
        align: "center",
        render: (v) => roleTag(v),
        responsive: ["md"],
      },
      {
        title: "Status",
        dataIndex: "status",
        align: "center",
        render: (v) => statusTag(v),
      },
      {
        title: "Actions",
        align: "center",
        render: (_, user) => {
          const approving =
            actionLoading.id === user.id && actionLoading.action === "approve";
          const rejecting =
            actionLoading.id === user.id && actionLoading.action === "reject";
          const deleting =
            actionLoading.id === user.id && actionLoading.action === "delete";

          const isPending = user.status === "PENDING";

          return (
            <Space
              wrap
              size={isMobile ? 4 : 6}
              style={{ justifyContent: "center", width: "100%" }}
            >
              <Tooltip
                title={
                  isPending ? "Approve User" : "Only PENDING can be approved"
                }
              >
                <Button
                  type="primary"
                  size={isMobile ? "small" : "middle"}
                  icon={<CheckCircleOutlined />}
                  loading={approving}
                  disabled={!isPending}
                  onClick={() => confirmApprove(user)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    boxShadow: isPending
                      ? "0 2px 8px rgba(22, 119, 255, 0.3)"
                      : "none",
                  }}
                >
                  {!isMobile && "Approve"}
                </Button>
              </Tooltip>

              <Tooltip
                title={
                  isPending ? "Reject User" : "Only PENDING can be rejected"
                }
              >
                <Button
                  danger
                  size={isMobile ? "small" : "middle"}
                  icon={<CloseCircleOutlined />}
                  loading={rejecting}
                  disabled={!isPending}
                  onClick={() => confirmReject(user)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    boxShadow: isPending
                      ? "0 2px 8px rgba(255, 77, 79, 0.3)"
                      : "none",
                  }}
                >
                  {!isMobile && "Reject"}
                </Button>
              </Tooltip>

          

              <Tooltip title="Delete User">
                <Button
                  danger
                  size={isMobile ? "small" : "middle"}
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  onClick={() => confirmDelete(user)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(255, 77, 79, 0.2)",
                  }}
                >
                  {!isMobile && "Delete"}
                </Button>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [
      actionLoading,
      confirmApprove,
      confirmReject,
      confirmDelete,
      isMobile,
      page,
      pageSize,
    ],
  );

  const drawerContent = selectedUser ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Row gutter={16} align="middle">
          <Col span={8} style={{ textAlign: "center" }}>
            <Avatar
              size={80}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#1677ff",
                boxShadow: "0 4px 16px rgba(22, 119, 255, 0.3)",
              }}
            />
          </Col>
          <Col span={16}>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              {safeText(selectedUser.name)}
            </Title>
            <Space wrap style={{ marginTop: 8 }}>
              {roleTag(selectedUser.role)}
              {statusTag(selectedUser.status)}
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0" }} />

        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            background: "#fafafa",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}
              >
                Mobile
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16, fontFamily: "monospace" }}>
                  {safeText(selectedUser.mobile)}
                </Text>
              </div>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div>
              <Text
                type="secondary"
                style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}
              >
                Village
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {safeText(selectedUser.village)}
                </Text>
              </div>
            </div>

            {selectedUser.address && safeText(selectedUser.address) !== "-" && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Address
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {safeText(selectedUser.address)}
                    </Text>
                  </div>
                </div>
              </>
            )}
          </Space>
        </Card>
      </Space>
    </motion.div>
  ) : (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <Text type="secondary">No user selected</Text>
    </div>
  );

return (
  <ConfigProvider
    theme={{
      token: {
        borderRadius: 12,
        colorPrimary: "#1677ff",
      },
    }}
  >
    <div
      style={{
        width: "100%",
        padding: isMobile ? "0" : isTablet ? "0 12px" : "0 20px",
        minHeight: "100vh",
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
         
        }}
        bodyStyle={{ padding: isMobile ? 16 : isTablet ? 20 : 24 }}
      >
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            {/* LEFT: TITLE */}
            <Col xs={24} md={10}>
              <Space direction="vertical" size={6}>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 22 : isTablet ? 26 : 30,
                    fontWeight: 800,
                  }}
                >
                  Users Management
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Approve / reject users, view details, and search quickly.
                </Text>
              </Space>
            </Col>

            {/* RIGHT: SEARCH + REFRESH */}
            <Col xs={24} md={14}>
              <Space
                size={12}
                style={{
                  width: "100%",
                  justifyContent: isMobile ? "flex-start" : "flex-end",
                }}
              >
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Search by name, mobile, village, role, status..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  size="large"
                  style={{
                    width: isMobile ? "100%" : 320,
                    borderRadius: 12,
                  }}
                />

                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  loading={loading}
                
                 
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    height: 44,
                  }}
                >
                  {isMobile ? "Refresh" : "Refresh Data"}
                </Button>
              </Space>
            </Col>
          </Row>
        </motion.div>

        <Divider style={{ margin: "20px 0" }} />

        {/* REST OF YOUR CODE — UNCHANGED */}
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Couldn't load users"
            description={error}
          />
        ) : firstLoad ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
             pagination={{
                current: page,
                pageSize,
                showSizeChanger: true,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total}`,
              }}
            scroll={{ x: "100%" }}
            className="users-table"
            bordered
          />
        )}
      </Card>
    </div>
  </ConfigProvider>
);

}
