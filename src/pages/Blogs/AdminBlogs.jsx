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
  Form,
  Grid,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Skeleton,
  Divider,
  Upload,
} from "antd";
import axios from "axios";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ ...emptyForm });

 

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

  const availableYears = useMemo(() => {
    const years = [...new Set(items.map(item => item.year).filter(Boolean))];
    return years.sort((a, b) => b - a);
  }, [items]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let result = items;
    
    if (q) {
      result = result.filter((item) =>
        [item?.title, item?.description].join(" ").toLowerCase().includes(q)
      );
    }
    
    if (yearFilter) {
      result = result.filter((item) => item.year === yearFilter);
    }
    
    return result;
  }, [items, debouncedSearch, yearFilter]);

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

  // const openPreview = (item) => {
  //   setPreviewItem(item);
  //   setPreviewOpen(true);
  // };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=f5435f6feb6a01f1128a892cd748a25c",
        formData
      );
      const url = res?.data?.data?.url || res?.data?.data?.display_url;
      if (url) {
        setForm((p) => ({ ...p, imageUrl: url }));
        message.success("Image uploaded successfully!");
      } else {
        message.error("Upload failed - no URL returned");
      }
    } catch (err) {
      message.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
    return false;
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



  const columns = useMemo(
    () => [
      {
        title: "S.No",
        align: "center",
        width: 70,
        render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
      },
      {
        title: "Title",
        dataIndex: "title",
        align: "center",
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
        width: 80,
      },
      {
        title: "Image",
        dataIndex: "imageUrl",
        align: "center",
        width: 100,
        render: (url) => url ? (
          <Image
            src={url}
            width={60}
            height={45}
            style={{ borderRadius: 6, objectFit: "cover" }}
            preview
          />
        ) : <Text type="secondary">—</Text>,
      },
      {
        title: "Video",
        dataIndex: "videoUrl",
        align: "center",
        width: 90,
        render: (url) => url ? (
          <Tag icon={<VideoCameraOutlined />} color="processing">Yes</Tag>
        ) : <Text type="secondary">—</Text>,
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        align: "center",
        width: 110,
        render: (date) => <Text type="secondary">{formatDate(date)}</Text>,
      },
      {
        title: "Status",
        align: "center",
        width: 120,
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
        width: 100,
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
    [page, pageSize, toggleLoadingId, deleteLoadingId]
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
            <Col xs={24}>
              <Space direction="vertical" size={4}>
                <Title level={4} style={{ margin: 0, color: "#008cba" }}>
                  Blog Management
                </Title>
                <Text type="secondary">
                  Manage your blog posts — create, edit, toggle visibility
                </Text>
              </Space>
            </Col>
          </Row>

          {/* Filters & Actions Row */}
          <Row gutter={[12, 12]} style={{ marginTop: 16 }} align="middle">
            <Col xs={24} sm={12} md={10} lg={8}>
              <Input
                placeholder="Search title or description..."
                prefix={<SearchOutlined />}
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>

            <Col xs={12} sm={6} md={5} lg={4}>
              <Select
                placeholder="Filter Year"
                allowClear
                value={yearFilter}
                onChange={setYearFilter}
                style={{ width: "100%" }}
              >
                {availableYears.map(year => (
                  <Select.Option key={year} value={year}>{year}</Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} sm={6} md={9} lg={12}>
              <Row justify="end" gutter={[8, 8]}>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                  >
                    {!isSmall ? "New Blog" : "New"}
                  </Button>
                </Col>
                <Col>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchItems}
                    loading={pageLoading}
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
          width={isMobile ? "96%" : 600}
          centered
          destroyOnClose
        >
          <Form layout="vertical" size="middle">
            <Row gutter={[12, 8]}>
              <Col xs={24} sm={16}>
                <Form.Item label="Title *" style={{ marginBottom: 12 }}>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter blog title"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={12} sm={4}>
                <Form.Item label="Year" style={{ marginBottom: 12 }}>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                    placeholder="YYYY"
                    min={1900}
                    max={2100}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={12} sm={4}>
                <Form.Item label="Status" style={{ marginBottom: 12 }}>
                  <Switch
                    checked={form.isActive}
                    onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                    checkedChildren="On"
                    unCheckedChildren="Off"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description *" style={{ marginBottom: 12 }}>
                  <TextArea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Write a short description..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={16}>
                <Form.Item label="Image Upload" style={{ marginBottom: 12 }}>
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                    disabled={uploading || saveLoading}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploading}
                      disabled={saveLoading}
                      block
                    >
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item label="Video URL" style={{ marginBottom: 12 }}>
                  <Input
                    prefix={<VideoCameraOutlined />}
                    value={form.videoUrl}
                    onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="Optional"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              {form.imageUrl && (
                <Col xs={24}>
                  <Image
                    src={trimOrEmpty(form.imageUrl)}
                    alt="preview"
                    style={{ maxHeight: 160, width: "100%", objectFit: "contain", borderRadius: 8 }}
                    preview
                  />
                </Col>
              )}
            </Row>
          </Form>
        </Modal>

      </div>
    </ConfigProvider>
  );
}