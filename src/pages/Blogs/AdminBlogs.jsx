import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Drawer,
  Form,
  Grid,
  Image,
  Input,
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
  Skeleton,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const BLOG_API = "https://sirivaram-backed.onrender.com/api/blogs";
const ADMIN_BLOG_API = "https://sirivaram-backed.onrender.com/api/admin/blogs";

const emptyForm = {
  id: null,
  title: "",
  description: "",
  imageUrl: "",
  videoUrl: "",
  year: new Date().getFullYear(),
  isActive: true,
};

const safeText = (v) => (typeof v === "string" ? v : "");
const trimOrEmpty = (v) => safeText(v).trim();
const truncate = (text, max = 120) => {
  const t = safeText(text).trim();
  if (!t) return "—";
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const StatusTag = ({ active }) => (
  <Tag
    color={active ? "success" : "default"}
    icon={active ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
  >
    {active ? "Active" : "Inactive"}
  </Tag>
);

export default function AdminBlogs() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isSmall = !screens.sm;

  const [items, setItems] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ ...emptyForm });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchItems = useCallback(async () => {
    setPageLoading(true);
    setError("");
    try {
      const res = await fetch(BLOG_API, {
        headers: { ...getAuthHeaders() },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (aliveRef.current) setItems(list);
    } catch (err) {
      setError(err.message || "Failed to load blogs");
      if (aliveRef.current) setItems([]);
    } finally {
      if (aliveRef.current) {
        setPageLoading(false);
        setFirstLoad(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item?.title, item?.description].join(" ").toLowerCase().includes(q)
    );
  }, [items, debouncedSearch]);

  const openCreate = () => {
    setMode("create");
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setMode("edit");
    setForm({
      id: item.id,
      title: safeText(item.title),
      description: safeText(item.description),
      imageUrl: safeText(item.imageUrl),
      videoUrl: safeText(item.videoUrl),
      year: item.year || new Date().getFullYear(),
      isActive: Boolean(item.isActive),
    });
    setModalOpen(true);
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const validateForm = () => {
    if (!trimOrEmpty(form.title)) return "Title is required";
    if (!trimOrEmpty(form.description)) return "Description is required";
    if (form.year < 1900 || form.year > 2100)
      return "Please enter a valid year (1900–2100)";
    return "";
  };

  const saveItem = async () => {
    const err = validateForm();
    if (err) {
      message.error(err);
      return;
    }

    setSaveLoading(true);
    try {
      const isEdit = mode === "edit";
      const url = isEdit ? `${ADMIN_BLOG_API}/${form.id}` : ADMIN_BLOG_API;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        title: trimOrEmpty(form.title),
        description: trimOrEmpty(form.description),
        imageUrl: trimOrEmpty(form.imageUrl),
        videoUrl: trimOrEmpty(form.videoUrl),
        year: Number(form.year),
        isActive: Boolean(form.isActive),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed - ${res.status}${txt ? ` ${txt}` : ""}`);
      }

      message.success(isEdit ? "Blog updated" : "Blog created");
      setModalOpen(false);
      fetchItems();
    } catch (e) {
      message.error(e.message || "Operation failed");
    } finally {
      if (aliveRef.current) setSaveLoading(false);
    }
  };

  const deleteItem = (id) => {
    Modal.confirm({
      title: "Delete this blog post?",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleteLoadingId(id);
        try {
          const res = await fetch(`${ADMIN_BLOG_API}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (!res.ok) throw new Error("Delete failed");
          message.success("Deleted successfully");
          fetchItems();
        } catch {
          message.error("Could not delete");
        } finally {
          if (aliveRef.current) setDeleteLoadingId(null);
        }
      },
    });
  };

  const toggleActive = async (item, next) => {
    setToggleLoadingId(item.id);
    try {
      const res = await fetch(`${ADMIN_BLOG_API}/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...item,
          isActive: next,
        }),
      });
      if (!res.ok) throw new Error();
      message.success(next ? "Activated" : "Deactivated");
      fetchItems();
    } catch {
      message.error("Status update failed");
    } finally {
      if (aliveRef.current) setToggleLoadingId(null);
    }
  };

  const mediaCell = (item) => {
    const img = trimOrEmpty(item?.imageUrl);
    const vid = trimOrEmpty(item?.videoUrl);

    if (!img && !vid) return <Text type="secondary">—</Text>;

    return (
      <Space size={8}>
        {img && (
          <Tooltip title="Image preview">
            <Image
              src={img}
              width={64}
              height={48}
              style={{ borderRadius: 8, objectFit: "cover" }}
              preview={{ src: img }}
              fallback=""
            />
          </Tooltip>
        )}
        {vid && (
          <Tooltip title="Video link present">
            <Tag icon={<VideoCameraOutlined />} color="processing">
              Video
            </Tag>
          </Tooltip>
        )}
      </Space>
    );
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
        align:"center",
        render: (v, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{truncate(v, 55)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.id?.slice(0, 8)}...
            </Text>
          </Space>
        ),
       
      },
      {
        title: "Year",
        dataIndex: "year",
        
        align: "center",
       
      },
      {
        title: "Media",
      align:"center",
       
        render: (_, item) => mediaCell(item),
      },
      {
        title: "Status",
      
        align: "center",
      
        render: (_, item) => (
          <Space direction="vertical" size={2} align="center">
            <StatusTag active={item.isActive} />
            <Switch
              size="small"
              checked={item.isActive}
              loading={toggleLoadingId === item.id}
              onChange={(checked) => toggleActive(item, checked)}
            />
          </Space>
        ),
      },
      {
        title: "Actions",
  
        align: "center",
        
        render: (_, item) => (
          <Space size="small" wrap>
            
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(item)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoadingId === item.id}
              onClick={() => deleteItem(item.id)}
            />
          </Space>
        ),
      },
    ],
    [page, pageSize, isMobile, toggleLoadingId, deleteLoadingId]
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#008cba",
          colorSuccess: "#1ab394",
          borderRadius: 8,
          controlHeight: 36,
        },
      }}
    >
      <div style={{ padding: isMobile ? "16px 12px" : "24px", minHeight: "100vh" }}>
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {/* Header */}
       <Row gutter={[16, 16]} align="middle">
  {/* LEFT */}
  <Col xs={24} md={12}>
    <Space direction="vertical" size={4}>
      <Title level={4} style={{ margin: 0, color: "#008cba" }}>
        Blog Management
      </Title>
      <Text type="secondary">
        Manage your blog posts — create, edit, toggle visibility
      </Text>
    </Space>
  </Col>

  {/* RIGHT */}
  <Col xs={24} md={12}>
    <Row justify="end" gutter={[8, 8]}>
      <Col xs={24} sm={14} md={10} lg={8}>
        <Input
          placeholder="Search title or description..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Col>

      <Col xs={12} sm={5} md={5}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          block
        >
          {!isSmall && "New Blog"}
        </Button>
      </Col>

      <Col xs={12} sm={5} md={5}>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchItems}
          loading={pageLoading}
          block
        >
          {!isSmall && "Refresh"}
        </Button>
      </Col>
    </Row>
  </Col>
</Row>



          <Divider />

          {error && (
            <Alert
              type="error"
              message="Error loading blogs"
              description={error}
              showIcon
              action={
                <Button size="small" type="primary" onClick={fetchItems}>
                  Retry
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {firstLoad ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="id"
          
              scroll={{ x: "100%" }}
              loading={pageLoading}
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
                bordered
              locale={{ emptyText: "No blog posts found" }}
            />
          )}
        </Card>

        {/* ─── Create / Edit Modal ─── */}
        <Modal
          title={mode === "edit" ? "Edit Blog Post" : "Create New Blog"}
          open={modalOpen}
          onCancel={() => !saveLoading && setModalOpen(false)}
          onOk={saveItem}
          okText={mode === "edit" ? "Update" : "Create"}
          confirmLoading={saveLoading}
          width={isMobile ? "96%" : 720}
          centered
          destroyOnClose
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item label="Title *" required>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter blog title"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Year" required>
                  <Input
                    type="number"
                    prefix={<CalendarOutlined />}
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                    placeholder="YYYY"
                    min={1900}
                    max={2100}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Status">
                  <Switch
                    checked={form.isActive}
                    onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description *" required>
                  <TextArea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Write a short description..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Image URL">
                  <Input
                    prefix={<LinkOutlined />}
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Video URL (optional)">
                  <Input
                    prefix={<VideoCameraOutlined />}
                    value={form.videoUrl}
                    onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/... or direct link"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              {(form.imageUrl || form.videoUrl) && (
                <Col xs={24}>
                  <Divider orientation="left">Media Preview</Divider>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {form.imageUrl && (
                      <Image
                        src={trimOrEmpty(form.imageUrl)}
                        alt="preview"
                        style={{ maxHeight: 240, objectFit: "contain", borderRadius: 8 }}
                        preview
                      />
                    )}
                    {form.videoUrl && (
                      <Text type="secondary">
                        Video link added: <strong>{truncate(form.videoUrl, 60)}</strong>
                      </Text>
                    )}
                  </Space>
                </Col>
              )}
            </Row>
          </Form>
        </Modal>

      </div>
    </ConfigProvider>
  );
}