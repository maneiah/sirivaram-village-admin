import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Drawer,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
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
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const API_BASE = "https://sirivaram-backed.onrender.com/api/admin/events";
const API_BASE1 = "https://sirivaram-backed.onrender.com/api/events";
const emptyForm = {
  id: null,
  title: "",
  description: "",
  startDate: null, // DatePicker value
  endDate: null, // DatePicker value
  venue: "",
  ticketPrice: 0,
  year: new Date().getFullYear(),
  income: 0,
  expense: 0,
  qrImageUrl: "",
  isPublic: true,
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeText = (v) => (typeof v === "string" ? v : "");

const truncate = (text, max = 120) => {
  const t = safeText(text).trim();
  if (!t) return "-";
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const fmtINR = (num) => {
  const v = toNumber(num);
  return `₹ ${v.toLocaleString("en-IN")}`;
};

const fmtDateShort = (iso) => (iso ? String(iso) : "-");

const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// convert ISO yyyy-mm-dd from API to DatePicker value (dayjs is built-in in antd v5)
const toDayjs = (d) => {
  if (!d) return null;
  // AntD v5 uses dayjs internally; DatePicker accepts dayjs value
  // If your project has dayjs, this works. If not, add: import dayjs from "dayjs";
  // But usually antd already bundles dayjs.
  // eslint-disable-next-line no-undef
  return window.dayjs ? window.dayjs(d) : null;
};

// convert dayjs -> yyyy-mm-dd
const fromDayjs = (dj) => {
  if (!dj) return "";
  return dj.format("YYYY-MM-DD");
};

export default function AdminEvents() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [events, setEvents] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ ...emptyForm });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // pagination (for correct S No)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = useCallback(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchEvents = useCallback(async () => {
    setPageLoading(true);
    let list = [];
    try {
      const res = await axios.get(API_BASE1, { headers: { ...authHeaders() } });
      list = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to load events");
      list = [];
    } finally {
      if (aliveRef.current) {
        setEvents(list);
        setPageLoading(false);
      }
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return events;

    return events.filter((ev) =>
      [
        ev?.title,
        ev?.description,
        ev?.venue,
        ev?.startDate,
        ev?.endDate,
        ev?.year,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
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
      startDate: toDayjs(ev.startDate),
      endDate: toDayjs(ev.endDate),
      venue: safeText(ev.venue),
      ticketPrice: toNumber(ev.ticketPrice),
      year: toNumber(ev.year || new Date().getFullYear()),
      income: toNumber(ev.income),
      expense: toNumber(ev.expense),
      qrImageUrl: safeText(ev.qrImageUrl),
      isPublic: !!ev.isPublic,
    });
    setModalOpen(true);
  };

  const openView = (ev) => {
    setViewItem(ev);
    setViewOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.startDate) return "Start Date is required";
    if (!form.endDate) return "End Date is required";
    if (
      form.startDate &&
      form.endDate &&
      form.endDate.isBefore(form.startDate)
    ) {
      return "End Date cannot be before Start Date";
    }
    return "";
  };

  const saveEvent = async () => {
    const err = validateForm();
    if (err) {
      message.error(err);
      return;
    }

    setSaveLoading(true);
    try {
      const isEdit = mode === "edit";
      const url = isEdit ? `${API_BASE}/${form.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        title: form.title.trim(),
        description: safeText(form.description).trim(),
        startDate: fromDayjs(form.startDate),
        endDate: fromDayjs(form.endDate),
        venue: safeText(form.venue).trim(),
        ticketPrice: toNumber(form.ticketPrice),
        year: toNumber(form.year || new Date().getFullYear()),
        income: toNumber(form.income),
        expense: toNumber(form.expense),
        qrImageUrl: safeText(form.qrImageUrl).trim(),
        isPublic: !!form.isPublic,
      };

      if (isEdit) payload.id = form.id;

      await axios({
        url,
        method,
        data: payload,
        headers: { ...authHeaders() },
      });

      message.success(
        isEdit ? "Event updated successfully" : "Event created successfully",
      );
      setModalOpen(false);
      setForm({ ...emptyForm });
      fetchEvents();
    } catch (e) {
      message.error(e?.response?.data?.message || "Save failed");
    } finally {
      if (aliveRef.current) setSaveLoading(false);
    }
  };

  const deleteEvent = (id) => {
    if (!id) return;

    Modal.confirm({
      title: "Delete event?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        setDeleteLoadingId(id);
        try {
          await axios.delete(`${API_BASE}/${id}`, {
            headers: { ...authHeaders() },
          });
          message.success("Event deleted successfully");
          fetchEvents();
        } catch (e) {
          message.error(e?.response?.data?.message || "Delete failed");
        } finally {
          if (aliveRef.current) setDeleteLoadingId(null);
        }
      },
    });
  };

  const publicTag = (v) =>
    v ? <Tag color="success">Public</Tag> : <Tag color="default">Private</Tag>;

  const columns = useMemo(
    () => [
      {
        title: "S No",
        key: "index",
        align: "center",
        width: 80,
        render: (_, __, idx) => (page - 1) * pageSize + idx + 1, // ✅ correct with pagination
      },
      {
        title: "Title",
        dataIndex: "title",
        render: (v, ev) => (
          <Space direction="vertical" size={0}>
            <Text strong title={safeText(v)}>
              {truncate(v, 60)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {ev?.id || "-"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Dates",
        render: (_, ev) => (
          <Space direction="vertical" size={2}>
            <Text type="secondary">
              <CalendarOutlined /> Start: {fmtDateShort(ev.startDate)}
            </Text>
            <Text type="secondary">
              <CalendarOutlined /> End: {fmtDateShort(ev.endDate)}
            </Text>
          </Space>
        ),
      },
      {
        title: "Venue",
        dataIndex: "venue",
        render: (v) => (
          <Tooltip title={safeText(v)}>
            <Text>
              <EnvironmentOutlined /> {truncate(v, 35)}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: "Ticket",
        dataIndex: "ticketPrice",
        align: "right",
        render: (v) => <Text strong>{fmtINR(v || 0)}</Text>,
      },
      {
        title: "Public",
        dataIndex: "isPublic",
        align: "center",
        render: (v) => publicTag(!!v),
      },
      {
        title: "Actions",
        align: "center",
        render: (_, ev) => (
          <Space wrap size={8} style={{ justifyContent: "center" }}>
            <Tooltip title="View">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openView(ev)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(ev)}
              >
                {isMobile ? "" : "Edit"}
              </Button>
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleteLoadingId === ev.id}
                onClick={() => deleteEvent(ev.id)}
              >
                {isMobile ? "" : "Delete"}
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [deleteLoadingId, isMobile, page, pageSize],
  );

  return (
    <ConfigProvider theme={{ token: { borderRadius: 12 } }}>
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
                  Events Admin
                </Title>
                <Text type="secondary">
                  Create, edit, and manage events with dates, venue, and
                  finances.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={24} sm={14}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Search title / venue / date / year..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </Col>

                <Col xs={12} sm={5}>
                  <Button
                   style={{backgroundColor: '#008cba', color: 'white', border: 'none'}}
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    block
                  >
                    {isMobile ? "" : "Add"}
                  </Button>
                </Col>

                <Col xs={12} sm={5}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchEvents}
                    loading={pageLoading}
                    block
                  >
                    {isMobile ? "" : "Refresh"}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          <div style={{ height: 16 }} />

          {pageLoading ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 10 }}>
                <Text type="secondary">Loading events...</Text>
              </div>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey={(r) => r.id || `${r.title}-${r.startDate}`}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: "100%" }}
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
                    No events found.
                  </div>
                ),
              }}
              onRow={(record) => ({
                onDoubleClick: () => openView(record),
              })}
            />
          )}
        </Card>

        {/* ===== Compact Create/Edit Modal (Side-by-side) ===== */}
        <Modal
          title={mode === "edit" ? "Edit Event" : "Create Event"}
          open={modalOpen}
          onCancel={() => (!saveLoading ? setModalOpen(false) : null)}
          onOk={saveEvent}
          okText={mode === "edit" ? "Update Event" : "Create Event"}
          confirmLoading={saveLoading}
          destroyOnClose
          width={isMobile ? "100%" : 860}
          style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
        >
          <Form layout="vertical">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Form.Item label="Title *" required>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Event title"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Venue">
                  <Input
                    value={form.venue}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, venue: e.target.value }))
                    }
                    placeholder="Venue / Location"
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
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Ticket Price">
                  <InputNumber
                    value={toNumber(form.ticketPrice)}
                    min={0}
                    style={{ width: "100%" }}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, ticketPrice: toNumber(v) }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Income">
                  <InputNumber
                    value={toNumber(form.income)}
                    min={0}
                    style={{ width: "100%" }}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, income: toNumber(v) }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Expense">
                  <InputNumber
                    value={toNumber(form.expense)}
                    min={0}
                    style={{ width: "100%" }}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, expense: toNumber(v) }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Year">
                  <InputNumber
                    value={toNumber(form.year)}
                    min={2000}
                    max={2100}
                    style={{ width: "100%" }}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, year: toNumber(v) }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Public Event">
                  <Space>
                    <Switch
                      checked={!!form.isPublic}
                      onChange={(checked) =>
                        setForm((p) => ({ ...p, isPublic: checked }))
                      }
                      disabled={saveLoading}
                    />
                    <Text>{form.isPublic ? "Public" : "Private"}</Text>
                  </Space>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="QR Image URL">
                  <Input
                    prefix={<QrcodeOutlined />}
                    value={form.qrImageUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, qrImageUrl: e.target.value }))
                    }
                    placeholder="https://... (optional)"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description">
                  <TextArea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Short description (optional)"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* ===== View Drawer ===== */}
        <Drawer
          title="Event Details"
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          width={isMobile ? "100%" : 640}
          destroyOnClose
        >
          {viewItem ? (
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Title level={4} style={{ margin: 0 }}>
                {safeText(viewItem.title)}
              </Title>
              <Text type="secondary">ID: {viewItem.id || "-"}</Text>

              {safeText(viewItem.description) ? (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  <Text>{safeText(viewItem.description)}</Text>
                </div>
              ) : (
                <Text type="secondary">No description.</Text>
              )}

              <Card size="small" style={{ borderRadius: 12 }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Start Date</Text>
                    <div>
                      <Text strong>{fmtDateShort(viewItem.startDate)}</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">End Date</Text>
                    <div>
                      <Text strong>{fmtDateShort(viewItem.endDate)}</Text>
                    </div>
                  </Col>

                  <Col xs={24} md={12}>
                    <Text type="secondary">Venue</Text>
                    <div>
                      <Text strong>
                        <EnvironmentOutlined /> {viewItem.venue || "-"}
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} md={12}>
                    <Text type="secondary">Ticket Price</Text>
                    <div>
                      <Text strong>{fmtINR(viewItem.ticketPrice || 0)}</Text>
                    </div>
                  </Col>

                  <Col xs={24} md={8}>
                    <Text type="secondary">Year</Text>
                    <div>
                      <Text strong>{viewItem.year ?? "-"}</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Text type="secondary">Income</Text>
                    <div>
                      <Text strong>{fmtINR(viewItem.income || 0)}</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Text type="secondary">Expense</Text>
                    <div>
                      <Text strong>{fmtINR(viewItem.expense || 0)}</Text>
                    </div>
                  </Col>

                  <Col xs={24}>
                    <Text type="secondary">Visibility</Text>
                    <div>
                      {viewItem.isPublic ? (
                        <Tag color="success">Public</Tag>
                      ) : (
                        <Tag>Private</Tag>
                      )}
                    </div>
                  </Col>

                  {viewItem.qrImageUrl ? (
                    <Col xs={24}>
                      <Text type="secondary">QR Image URL</Text>
                      <div>
                        <a
                          href={viewItem.qrImageUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {viewItem.qrImageUrl}
                        </a>
                      </div>
                    </Col>
                  ) : null}
                </Row>
              </Card>
            </Space>
          ) : (
            <Text type="secondary">No details available.</Text>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
