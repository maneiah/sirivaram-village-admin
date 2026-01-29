import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import dayjs from "dayjs"; // ← fixed: missing import
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Divider,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const API_PUBLIC = "https://sirivaram-backed.onrender.com/api/events";
const API_ADMIN = "https://sirivaram-backed.onrender.com/api/admin/events";

const emptyForm = {
  id: null,
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  venue: "",
  ticketPrice: 0,
  year: new Date().getFullYear(),
  income: 0,
  expense: 0,
  qrImageUrl: "",
  isPublic: true,
};

// Helper functions
const safeText = (v) => (typeof v === "string" ? v : "");
const trimOrEmpty = (v) => safeText(v).trim();
const toNumber = (v) => Number(v) || 0;

const fmtINR = (num) => `₹ ${toNumber(num).toLocaleString("en-IN")}`;

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// Missing truncate function – now added
const truncate = (str, maxLength) => {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function AdminEvents() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isSmall = !screens.sm;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ ...emptyForm });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_PUBLIC, { headers: getHeaders() });
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Failed to load events");
      setEvents([]);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter((ev) =>
      [ev.title, ev.description, ev.venue, ev.startDate, ev.endDate, String(ev.year || "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [events, debouncedSearch]);

  const openCreate = () => {
    setMode("create");
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setMode("edit");
    setForm({
      id: ev.id,
      title: safeText(ev.title),
      description: safeText(ev.description),
      startDate: ev.startDate ? dayjs(ev.startDate) : null,
      endDate: ev.endDate ? dayjs(ev.endDate) : null,
      venue: safeText(ev.venue),
      ticketPrice: toNumber(ev.ticketPrice),
      year: toNumber(ev.year),
      income: toNumber(ev.income),
      expense: toNumber(ev.expense),
      qrImageUrl: safeText(ev.qrImageUrl),
      isPublic: !!ev.isPublic,
    });
    setModalOpen(true);
  };

  const openPreview = (ev) => {
    setPreviewItem(ev);
    setPreviewOpen(true);
  };

  const validate = () => {
    if (!trimOrEmpty(form.title)) return "Title is required";
    if (!form.startDate) return "Start date is required";
    if (!form.endDate) return "End date is required";
    if (form.endDate && form.startDate && form.endDate.isBefore(form.startDate))
      return "End date cannot be before start date";
    return "";
  };

  const save = async () => {
    const err = validate();
    if (err) return message.error(err);

    setSaveLoading(true);
    try {
      const isEdit = mode === "edit";
      const url = isEdit ? `${API_ADMIN}/${form.id}` : API_ADMIN;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        title: trimOrEmpty(form.title),
        description: trimOrEmpty(form.description),
        startDate: form.startDate ? form.startDate.format("YYYY-MM-DD") : "",
        endDate: form.endDate ? form.endDate.format("YYYY-MM-DD") : "",
        venue: trimOrEmpty(form.venue),
        ticketPrice: toNumber(form.ticketPrice),
        year: toNumber(form.year),
        income: toNumber(form.income),
        expense: toNumber(form.expense),
        qrImageUrl: trimOrEmpty(form.qrImageUrl),
        isPublic: !!form.isPublic,
      };

      await axios({ url, method, data: payload, headers: getHeaders() });

      message.success(isEdit ? "Event updated" : "Event created");
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      if (alive.current) setSaveLoading(false);
    }
  };

  const remove = (id) => {
    Modal.confirm({
      title: "Delete this event?",
      icon: <ExclamationCircleOutlined />,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleteId(id);
        try {
          await axios.delete(`${API_ADMIN}/${id}`, { headers: getHeaders() });
          message.success("Event deleted");
          fetchEvents();
        } catch {
          message.error("Delete failed");
        } finally {
          if (alive.current) setDeleteId(null);
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "S.No",
        align: "center",
        render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
      },
      {
        title: "Title",
        dataIndex: "title",
        align: "center",
        render: (v, r) => (
          <Space direction="vertical" size={2}>
            <Text strong>{truncate(v, 55)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {r.id?.slice(0, 8) || "—"}
            </Text>
          </Space>
        ),
      
      },
      {
        title: "Dates",
        align: "center",
        render: (_, ev) => (
          <Space direction="vertical" size={0}>
            <Text type="secondary">
              <CalendarOutlined /> {fmtDate(ev.startDate)}
            </Text>
            <Text type="secondary">→ {fmtDate(ev.endDate)}</Text>
          </Space>
        ),
      },
      {
        title: "Venue",
        dataIndex: "venue",
        align: "center",
        render: (v) =>
          v ? (
            <Tooltip title={v}>
              <Text>
                <EnvironmentOutlined /> {truncate(v, 30)}
              </Text>
            </Tooltip>
          ) : (
            "—"
          ),
      },
      {
        title: "Ticket",
        align: "center",
        render: (_, ev) => <Text strong>{fmtINR(ev.ticketPrice)}</Text>,
      },
      {
        title: "Visibility",
        align: "center",
        render: (_, ev) =>
          ev.isPublic ? (
            <Tag color="#1ab394">Public</Tag>
          ) : (
            <Tag>Private</Tag>
          ),
      },
      {
        title: "Actions",
        align: "center",
        render: (_, ev) => (
          <Space size="small">
        
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(ev)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleteId === ev.id}
                onClick={() => remove(ev.id)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [page, pageSize, deleteId]
  );

 

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#008cba",
          colorSuccess: "#1ab394",
          borderRadius: 8,
        },
      }}
    >
      <div style={{ padding: isMobile ? "16px 12px" : "24px", minHeight: "100vh" }}>
        <Card
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
         <Row gutter={[16, 16]} align="middle">
  {/* LEFT */}
  <Col xs={24} md={12}>
    <Space direction="vertical" size={4}>
      <Title level={4} style={{ margin: 0, color: "#008cba" }}>
        Event Management
      </Title>
      <Text type="secondary">
        Manage upcoming & past events, tickets, finances
      </Text>
    </Space>
  </Col>

  {/* RIGHT */}
  <Col xs={24} md={12}>
    <Row justify={isSmall ? "start" : "end"} gutter={[8, 8]}>
      <Col xs={24} sm={14} md={10} lg={8}>
        <Input
          placeholder="Search title, venue, date..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Col>

      <Col xs={12} sm={5} md={5}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          block
        >
          {!isSmall && "New Event"}
        </Button>
      </Col>

      <Col xs={12} sm={5} md={5}>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchEvents}
          block
        >
          {!isSmall && "Refresh"}
        </Button>
      </Col>
    </Row>
  </Col>
</Row>


          <Divider style={{ margin: "16px 0" }} />

          <Table
            columns={columns}
            dataSource={filteredEvents}
            rowKey={(r) => r.id || `${r.title}-${r.startDate}`}
            loading={loading}
            bordered
            scroll={{ x: "100%" }}
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
            onRow={(record) => ({
              onDoubleClick: () => openPreview(record),
            })}
            locale={{ emptyText: "No events found" }}
          />
        </Card>

        {/* ─── Create/Edit Modal ─── */}
        <Modal
          title={mode === "edit" ? "Edit Event" : "Create New Event"}
          open={modalOpen}
          onCancel={() => !saveLoading && setModalOpen(false)}
          onOk={save}
          okText={mode === "edit" ? "Update" : "Create"}
          confirmLoading={saveLoading}
          width={isMobile ? "96%" : 900}
          centered
          destroyOnClose
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item label="Title *" required>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Annual Sports Meet 2025"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Year">
                  <InputNumber
                    min={2000}
                    max={2100}
                    value={form.year}
                    onChange={(v) => setForm((p) => ({ ...p, year: toNumber(v) }))}
                    style={{ width: "100%" }}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Start Date *" required>
                  <DatePicker
                    style={{ width: "100%" }}
                    value={form.startDate}
                    onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
                    disabledDate={(d) => d && form.endDate && d.isAfter(form.endDate)}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="End Date *" required>
                  <DatePicker
                    style={{ width: "100%" }}
                    value={form.endDate}
                    onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
                    disabledDate={(d) => d && form.startDate && d.isBefore(form.startDate)}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Venue">
                  <Input
                    prefix={<EnvironmentOutlined />}
                    value={form.venue}
                    onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                    placeholder="e.g. School Ground, Hyderabad"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Ticket Price (₹)">
                  <InputNumber
                    prefix={<DollarOutlined />}
                    min={0}
                    value={form.ticketPrice}
                    onChange={(v) => setForm((p) => ({ ...p, ticketPrice: toNumber(v) }))}
                    style={{ width: "100%" }}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Total Income (₹)">
                  <InputNumber
                    min={0}
                    value={form.income}
                    onChange={(v) => setForm((p) => ({ ...p, income: toNumber(v) }))}
                    style={{ width: "100%" }}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Total Expense (₹)">
                  <InputNumber
                    min={0}
                    value={form.expense}
                    onChange={(v) => setForm((p) => ({ ...p, expense: toNumber(v) }))}
                    style={{ width: "100%" }}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Visibility">
                  <Switch
                    checked={form.isPublic}
                    onChange={(v) => setForm((p) => ({ ...p, isPublic: v }))}
                    checkedChildren="Public"
                    unCheckedChildren="Private"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="QR Code / Payment Link">
                  <Input
                    prefix={<QrcodeOutlined />}
                    value={form.qrImageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, qrImageUrl: e.target.value }))}
                    placeholder="https://..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description">
                  <TextArea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Event details, highlights, instructions..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

       
      </div>
    </ConfigProvider>
  );
}