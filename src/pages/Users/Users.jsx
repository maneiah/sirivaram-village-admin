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
  Spin,
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
  EyeOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined, // ✅ FIX: missing in your code
} from "@ant-design/icons";

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
      <Tag icon={<CheckCircleOutlined />} color="success">
        APPROVED
      </Tag>
    );
  if (status === "PENDING")
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        PENDING
      </Tag>
    );
  if (status === "REJECTED")
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        REJECTED
      </Tag>
    );
  return <Tag color="default">UNKNOWN</Tag>;
};

const roleTag = (role) =>
  role === "ADMIN" ? (
    <Tag icon={<UserOutlined />} color="blue">
      ADMIN
    </Tag>
  ) : (
    <Tag icon={<UserOutlined />} color="cyan">
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
  const [selectedUser] = useState(null);

  // Pagination state for correct S No
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(isMobile ? 8 : 10);

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
        u?.address,
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
          <Space>
            <Avatar icon={<UserOutlined />} />
            <Space direction="vertical" size={0}>
              <Text strong ellipsis={{ tooltip: safeText(v) }}>
                {safeText(v)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {safeText(u?.id)}
              </Text>
            </Space>
          </Space>
        ),
        ellipsis: true,
      },
      {
        title: "Mobile",
        dataIndex: "mobile",
        align: "center",
        render: (v) => (
          <Text ellipsis={{ tooltip: safeText(v) }}>{safeText(v)}</Text>
        ),
        responsive: ["md"],
      },
      {
        title: "Village",
        dataIndex: "village",
        align: "center",
        render: (v) => (
          <Text ellipsis={{ tooltip: safeText(v) }}>{safeText(v)}</Text>
        ),
        responsive: ["lg"],
      },
      {
        title: "Address",
        dataIndex: "address",
        render: (v) => (
          <Tooltip title={safeText(v) !== "-" ? safeText(v) : ""}>
            <Text type="secondary" ellipsis={{ tooltip: true }}>
              {truncateText(v, isMobile ? 20 : 40)}
            </Text>
          </Tooltip>
        ),
        responsive: ["lg"],
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
            <Space wrap size={6} style={{ justifyContent: "center" }}>
             
              <Tooltip
                title={
                  isPending ? "Approve User" : "Only PENDING can be approved"
                }
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={approving}
                  disabled={!isPending}
                  onClick={() => confirmApprove(user)}
                />
              </Tooltip>

              <Tooltip
                title={
                  isPending ? "Reject User" : "Only PENDING can be rejected"
                }
              >
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  loading={rejecting}
                  disabled={!isPending}
                  onClick={() => confirmReject(user)}
                />
              </Tooltip>

              <Tooltip title="Edit User">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() =>
                    Modal.info({
                      title: "Coming soon",
                      content: "Edit feature coming soon!",
                    })
                  }
                />
              </Tooltip>

              <Tooltip title="Delete User">
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  onClick={() => confirmDelete(user)}
                />
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
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={16} align="middle">
        <Col span={8} style={{ textAlign: "center" }}>
          <Avatar size={80} icon={<UserOutlined />} />
        </Col>
        <Col span={16}>
          <Title level={4} style={{ margin: 0 }}>
            {safeText(selectedUser.name)}
          </Title>
          <Space wrap>
            {roleTag(selectedUser.role)}
            {statusTag(selectedUser.status)}
          </Space>
        </Col>
      </Row>

      <Card size="small" style={{ borderRadius: 12 }} bordered>
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Mobile</Text>
            <div>
              <Text strong>{safeText(selectedUser.mobile)}</Text>
            </div>
          </div>

          <div>
            <Text type="secondary">Village</Text>
            <div>
              <Text strong>{safeText(selectedUser.village)}</Text>
            </div>
          </div>

          <div>
            <Text type="secondary">Address</Text>
            <div>
              <Text>{safeText(selectedUser.address)}</Text>
            </div>
          </div>
        </Space>
      </Card>
    </Space>
  ) : null;

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
        },
      }}
    >
      <div
        style={{
          width: "100%",
          padding: isMobile ? 12 : 24,
         
          minHeight: "100vh",
        }}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
          }}
          bodyStyle={{ padding: isMobile ? 12 : 20 }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={2}>
                <Title level={4} style={{ margin: 0 }}>
                  Users Management
                </Title>
                <Text type="secondary">
                  Approve / reject users, view details, and search quickly.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={24} sm={16}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Search by name, mobile, village, role, status..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </Col>

                <Col xs={24} sm={8}>
                  <Tooltip title="Refresh users list">
                    <Button
                     
                      icon={<ReloadOutlined />}
                      onClick={fetchUsers}
                      loading={loading}
                      block
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          {error ? (
            <Alert
              type="error"
              showIcon
              message="Couldn’t load users"
              description={
                <Space direction="vertical" size={8}>
                  <Text>{error}</Text>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchUsers}
                  >
                    Try Again
                  </Button>
                </Space>
              }
              style={{ marginBottom: 12, borderRadius: 12 }}
            />
          ) : null}

          {firstLoad ? (
            <Card bordered style={{ borderRadius: 12 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" style={{ textAlign: "center" }}>
                  <Text>No users found</Text>
                  {debouncedSearch ? (
                    <Text type="secondary">Try adjusting your search.</Text>
                  ) : null}
                  <Button  style={{backgroundColor:"#008cba",color:"white"}} onClick={fetchUsers}>
                    Refresh
                  </Button>
                </Space>
              }
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey={(r) => r.id}
              bordered
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
                showTotal: (total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} users`,
              }}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: "100%" }}
              locale={{ emptyText: "No data" }}
            />
          )}
        </Card>

        <Drawer
          title={
            <Space>
              <UserOutlined />
              <span>User Details</span>
            </Space>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={isMobile ? "100%" : 480}
          destroyOnClose
          footer={
            <Button
              onClick={() => setDrawerOpen(false)}
              type="primary"
              block={isMobile}
            >
              Close
            </Button>
          }
        >
          {drawerContent}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
