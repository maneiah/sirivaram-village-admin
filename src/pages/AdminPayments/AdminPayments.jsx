import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Grid,
  Modal,
  Row,
  Space,
  Spin,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Skeleton,
  Divider,
  Statistic,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API_BASE = "https://sirivaram-backed.onrender.com/api/admin/payments";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusTag = (status) => {
  const s = String(status || "");
  if (s === "PENDING_VERIFICATION") {
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        PENDING
      </Tag>
    );
  }
  if (s === "VERIFIED") {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        VERIFIED
      </Tag>
    );
  }
  if (s === "REJECTED") {
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        REJECTED
      </Tag>
    );
  }
  return <Tag color="default">{s || "UNKNOWN"}</Tag>;
};

const statusOptions = [
  { value: "ALL", label: "All Payments" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminPayments() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [payments, setPayments] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [currentStatus, setCurrentStatus] = useState("ALL");

  // Pagination (for correct S No)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Event payments modal
  const [eventPaymentsModalOpen, setEventPaymentsModalOpen] = useState(false);
  const [eventPayments, setEventPayments] = useState([]);
  const [eventPaymentsLoading, setEventPaymentsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPayments = useCallback(async (status = "ALL") => {
    setPageLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      let url = API_BASE;
      if (status !== "ALL") url += `?status=${status}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Failed to load payments (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
        );
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPayments(list);
    } catch (e) {
      message.error(
        e?.name === "AbortError"
          ? "Request timed out. Please try again."
          : e?.message || "Failed to load payments",
      );
      setPayments([]);
    } finally {
      clearTimeout(timeout);
      setPageLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(currentStatus);
  }, [fetchPayments, currentStatus]);

  // Summary cards (quick UX)
  const summary = useMemo(() => {
    const total = payments.length;
    const pending = payments.filter(
      (p) => p.status === "PENDING_VERIFICATION",
    ).length;
    const verified = payments.filter((p) => p.status === "VERIFIED").length;
    const rejected = payments.filter((p) => p.status === "REJECTED").length;
    const amountTotal = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    return { total, pending, verified, rejected, amountTotal };
  }, [payments]);

  const openEventPayments = useCallback(async (item) => {
    const eventId = item.eventId;
    setSelectedEventId(eventId);
    setEventPaymentsLoading(true);
    setEventPayments([]);
    setEventPaymentsModalOpen(true);

    try {
      const res = await fetch(`${API_BASE}/by-event/${eventId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Failed to load event payments (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
        );
      }
      const data = await res.json();
      setEventPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error(e?.message || "Failed to load event payments");
      setEventPayments([]);
    } finally {
      setEventPaymentsLoading(false);
    }
  }, []);

  const verifyPayment = async (id) => {
    setActionLoading({ id, type: "verify" });
    try {
      const res = await fetch(`${API_BASE}/${id}/verify`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Verification failed");
      message.success("Payment verified successfully");
      fetchPayments(currentStatus);
    } catch (e) {
      message.error(e?.message || "Verification failed");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const rejectPayment = async (id) => {
    setActionLoading({ id, type: "reject" });
    try {
      const res = await fetch(`${API_BASE}/${id}/reject`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Reject failed");
      message.success("Payment rejected successfully");
      fetchPayments(currentStatus);
    } catch (e) {
      message.error(e?.message || "Reject failed");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const deletePayment = async (id) => {
    setActionLoading({ id, type: "delete" });
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      message.success("Payment deleted successfully");
      fetchPayments(currentStatus);
    } catch (e) {
      message.error(e?.message || "Delete failed");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const confirmVerify = (id) => {
    Modal.confirm({
      title: "Verify this payment?",
      icon: <ExclamationCircleOutlined />,
      content: "Once verified, it should not be changed.",
      okText: "Verify",
      okButtonProps: { type: "primary" },
      cancelText: "Cancel",
      onOk: () => verifyPayment(id),
    });
  };

  const confirmReject = (id) => {
    Modal.confirm({
      title: "Reject this payment?",
      icon: <ExclamationCircleOutlined />,
      content: "This will mark payment as REJECTED.",
      okText: "Reject",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => rejectPayment(id),
    });
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Delete payment record?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => deletePayment(id),
    });
  };

  const eventPaymentsColumns = useMemo(
    () => [
      {
        title: "#",
        width: 60,
        align: "center",
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "Payer Name",
        dataIndex: "payerName",
        width: 180,
        render: (v) => <Text strong>{v || "-"}</Text>,
      },
      {
        title: "Mobile",
        dataIndex: "payerMobile",
        width: 140,
        align: "center",
        render: (v) => v || "-",
      },
      {
        title: "Amount",
        dataIndex: "amount",
        width: 120,
        align: "right",
        render: (v) => (
          <Text strong>₹ {Number(v || 0).toLocaleString("en-IN")}</Text>
        ),
      },
      {
        title: "Paid On",
        dataIndex: "paidOnDate",
        width: 180,
        render: (v) => <Text type="secondary">{fmtDateTime(v)}</Text>,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 120,
        align: "center",
        render: statusTag,
      },
    ],
    [],
  );

  const columns = useMemo(
    () => [
      {
        title: "S No",
        width: 70,
        align: "center",
        render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
      },
      {
        title: "Payer Name",
        dataIndex: "payerName",
        align: "center",
        render: (v) => <Text strong>{v || "-"}</Text>,
      },
      {
        title: "Mobile",
        dataIndex: "payerMobile",
        align: "center",
        render: (v) => v || "-",
        responsive: ["md"],
      },
      {
        title: "Amount",
        dataIndex: "amount",
        align: "center",
        render: (v) => (
          <Text strong>₹ {Number(v || 0).toLocaleString("en-IN")}</Text>
        ),
      },
      {
        title: "Paid On",
        dataIndex: "paidOnDate",
        align: "center",
        render: (v) => <Text type="secondary">{fmtDateTime(v)}</Text>,
        responsive: ["lg"],
      },
      {
        title: "Status",
        dataIndex: "status",
        align: "center",
        render: statusTag,
      },
      {
        title: "Actions",
        align: "center",
        render: (_, item) => {
          const verifying =
            actionLoading.id === item.id && actionLoading.type === "verify";
          const rejecting =
            actionLoading.id === item.id && actionLoading.type === "reject";
          const deleting =
            actionLoading.id === item.id && actionLoading.type === "delete";

          const isPending = item.status === "PENDING_VERIFICATION";
          const isFinal =
            item.status === "VERIFIED" || item.status === "REJECTED";

          return (
            <Space wrap size={8} style={{ justifyContent: "center" }}>
              <Tooltip title="View all payments for this event">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => openEventPayments(item)}
                />
              </Tooltip>

              <Tooltip
                title={isPending ? "Verify" : "Only pending can be verified"}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={verifying}
                  disabled={!isPending}
                  onClick={() => confirmVerify(item.id)}
                >
                  {isMobile ? "" : "Verify"}
                </Button>
              </Tooltip>

              <Tooltip
                title={isPending ? "Reject" : "Only pending can be rejected"}
              >
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  loading={rejecting}
                  disabled={!isPending}
                  onClick={() => confirmReject(item.id)}
                >
                  {isMobile ? "" : "Reject"}
                </Button>
              </Tooltip>

              <Tooltip
                title={
                  isFinal ? "Delete record" : "Recommended after final status"
                }
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  onClick={() => confirmDelete(item.id)}
                >
                  {isMobile ? "" : "Delete"}
                </Button>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [actionLoading, isMobile, openEventPayments, page, pageSize],
  );

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
          style={{ borderRadius: 12, boxShadow: "0 1px 10px rgba(0,0,0,0.06)" }}
          bodyStyle={{ padding: isMobile ? 12 : 20 }}
        >
          {/* Header */}
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={2}>
                <Title level={4} style={{ margin: 0 }}>
                  Payments Management
                </Title>
                <Text type="secondary">
                  Verify, reject, delete and view event-wise payments.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                <Col xs={24} sm={12}>
                  <Select
                    value={currentStatus}
                    onChange={(value) => {
                      setCurrentStatus(value);
                      setPage(1);
                    }}
                    options={statusOptions}
                    style={{ width: "100%" }}
                    placeholder="Filter by status"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchPayments(currentStatus)}
                    loading={pageLoading}
                    type="default"
                    block={isMobile}
                  >
                    {isMobile ? "" : "Refresh"}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: "#f0f8ff", // Light blue bg for Total
                  border: "1px solid #1890ff",
                }}
                bordered
                hoverable
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  <Statistic title="Total" value={summary.total} />
                  <Tag color="blue" icon={<DollarOutlined />}>
                    All Records
                  </Tag>
                </Space>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: "#fffbe6", // Light yellow bg for Pending
                  border: "1px solid #faad14",
                }}
                bordered
                hoverable
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  <Statistic title="Pending" value={summary.pending} />
                  <Tag icon={<ClockCircleOutlined />} color="warning">
                    Pending Review
                  </Tag>
                </Space>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: "#f6ffed", // Light green bg for Verified
                  border: "1px solid #52c41a",
                }}
                bordered
                hoverable
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  <Statistic title="Verified" value={summary.verified} />
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Verified
                  </Tag>
                </Space>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: "#f0fff4", // Light green bg for Amount
                  border: "1px solid #52c41a",
                }}
                bordered
                hoverable
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  <Statistic
                    title="Amount (Shown)"
                    prefix={<>₹</>}
                    value={summary.amountTotal}
                    precision={0}
                  />
                  <Tag icon={<DollarOutlined />} color="green">
                    Total Value
                  </Tag>
                </Space>
              </Card>
            </Col>
          </Row>

          <div style={{ height: 12 }} />

          {/* First-load skeleton */}
          {firstLoad ? (
            <Card bordered style={{ borderRadius: 12 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="id"
              size={isMobile ? "small" : "middle"}
              scroll={{ x: "100%" }}
              loading={pageLoading}
              bordered
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
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0", color: "rgba(0,0,0,0.45)" }}>
                    No payment records found for selected status.
                  </div>
                ),
              }}
            />
          )}
        </Card>

        {/* Event Payments Modal */}
        <Modal
          title={
            <Space direction="vertical" size={2}>
              <Text strong>Event Payments</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Event ID: {selectedEventId || "-"}
              </Text>
            </Space>
          }
          open={eventPaymentsModalOpen}
          onCancel={() => setEventPaymentsModalOpen(false)}
          footer={null}
          width={isMobile ? "100%" : 1000}
          destroyOnClose
        >
          {eventPaymentsLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 10 }}>
                <Text type="secondary">Loading event payments...</Text>
              </div>
            </div>
          ) : (
            <Table
              columns={eventPaymentsColumns}
              dataSource={eventPayments}
              rowKey="id"
              bordered
              size={isMobile ? "small" : "middle"}
              scroll={{ x: "100%" }}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} payments`,
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0", color: "rgba(0,0,0,0.45)" }}>
                    No payments found for this event.
                  </div>
                ),
              }}
            />
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
