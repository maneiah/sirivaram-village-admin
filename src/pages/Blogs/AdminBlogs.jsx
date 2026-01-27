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
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
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
  isActive: true,
};

const safeText = (v) => (typeof v === "string" ? v : "");
const trimOrEmpty = (v) => safeText(v).trim();

const truncate = (text, max = 120) => {
  const t = safeText(text).trim();
  if (!t) return "-";
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const useDebouncedValue = (value, delay = 250) => {
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

  const [items, setItems] = useState([]);

  const [pageLoading, setPageLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  // Pagination state (for correct S.No)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [form, setForm] = useState({ ...emptyForm });

  // Preview drawer
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // avoid state updates after unmount
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // ✅ Admin listing should ideally use ADMIN_BLOG_API
      // If your backend only allows public listing, switch to BLOG_API.
      const res = await fetch(BLOG_API, {
        headers: { ...getAuthHeaders() },
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Load failed (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
        );
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      if (aliveRef.current) setItems(list);
    } catch (e) {
      const msg =
        e?.name === "AbortError"
          ? "Request timed out. Please try again."
          : e?.message || "Failed to load blog posts.";
      setError(msg);
      if (aliveRef.current) setItems([]);
    } finally {
      clearTimeout(timeout);
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
      [item?.title, item?.description].join(" ").toLowerCase().includes(q),
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
      const url = isEdit ? `${ADMIN_BLOG_API}/${form.id}` : BLOG_API;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        title: trimOrEmpty(form.title),
        description: trimOrEmpty(form.description),
        imageUrl: trimOrEmpty(form.imageUrl),
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
        throw new Error(
          `${method} failed (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
        );
      }

      message.success(
        isEdit ? "Blog updated successfully" : "Blog created successfully",
      );
      setModalOpen(false);
      setForm({ ...emptyForm });

      // Keep current page after update
      fetchItems();
    } catch (e) {
      message.error(e?.message || "Save failed");
    } finally {
      if (aliveRef.current) setSaveLoading(false);
    }
  };

  const deleteItem = async (id) => {
    Modal.confirm({
      title: "Delete blog post?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        setDeleteLoadingId(id);
        try {
          const res = await fetch(`${ADMIN_BLOG_API}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `Delete failed (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
            );
          }
          message.success("Blog deleted successfully");
          fetchItems();
        } catch (e) {
          message.error(e?.message || "Delete failed");
        } finally {
          if (aliveRef.current) setDeleteLoadingId(null);
        }
      },
    });
  };

  // ✅ Quick activate/deactivate (user friendly)
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
          title: safeText(item.title),
          description: safeText(item.description),
          imageUrl: safeText(item.imageUrl),
          isActive: Boolean(next),
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Update failed (HTTP ${res.status})${txt ? ` - ${txt}` : ""}`,
        );
      }

      message.success(next ? "Blog activated" : "Blog deactivated");
      fetchItems();
    } catch (e) {
      message.error(e?.message || "Status update failed");
    } finally {
      if (aliveRef.current) setToggleLoadingId(null);
    }
  };

  const mediaCell = (item) => {
    const url = trimOrEmpty(item?.imageUrl);
    if (!url) return <Text type="secondary">-</Text>;

    return (
      <Space size={8}>
        <Tooltip title="Click to preview image">
          <Image
            src={url}
            width={72}
            height={46}
            style={{ objectFit: "cover", borderRadius: 10 }}
            preview={{ src: url }}
            fallback=""
            placeholder={
              <div
                style={{
                  width: 72,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.04)",
                }}
              >
                <PictureOutlined />
              </div>
            }
          />
        </Tooltip>
      </Space>
    );
  };

  const columns = useMemo(() => {
    return [
      {
        title: "S No",
        align: "center",
        width: 70,
        render: (_, __, idx) => (page - 1) * pageSize + idx + 1, // ✅ correct numbering
        fixed: isMobile ? undefined : "left",
      },
      {
        title: "Title",
        dataIndex: "title",
        render: (v, item) => (
          <Space direction="vertical" size={0}>
            <Text strong title={safeText(v)}>
              {truncate(v, 60)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {item?.id}
            </Text>
          </Space>
        ),
        ellipsis: true,
      },
      {
        title: "Description",
        dataIndex: "description",
        render: (v) => (
          <Tooltip title={safeText(v)}>
            <Text>{truncate(v, 140)}</Text>
          </Tooltip>
        ),
        responsive: ["md"],
      },
      {
        title: "Media",
        render: (_, item) => mediaCell(item),
        responsive: ["sm"],
      },
      {
        title: "Status",
        dataIndex: "isActive",
        align: "center",
        render: (v, item) => (
          <Space direction="vertical" size={4} align="center">
            <StatusTag active={Boolean(v)} />
            <Switch
              size="small"
              checked={Boolean(v)}
              loading={toggleLoadingId === item.id}
              onChange={(checked) => toggleActive(item, checked)}
            />
          </Space>
        ),
        responsive: ["md"],
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        render: (v) => <Text type="secondary">{formatDate(v)}</Text>,
        responsive: ["lg"],
      },
      {
        title: "Actions",
        align: "center",
        render: (_, item) => (
          <Space wrap size={8} style={{ justifyContent: "center" }}>
            <Tooltip title="View">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openPreview(item)}
              />
            </Tooltip>

            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(item)}
              >
                {isMobile ? "" : "Edit"}
              </Button>
            </Tooltip>

            <Tooltip title="Delete">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleteLoadingId === item.id}
                onClick={() => deleteItem(item.id)}
              >
                {isMobile ? "" : "Delete"}
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ];
  }, [deleteLoadingId, isMobile, page, pageSize, toggleLoadingId]);

  return (
    <ConfigProvider
      theme={{
        token: {
          // ✅ AntD vibe: let primary follow your system theme; don’t force blue
          borderRadius: 10,
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
          {/* Header */}
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={2}>
                <Title level={4} style={{ margin: 0 }}>
                  Blogs Admin
                </Title>
                <Text type="secondary">
                  Create, update, delete blog posts. Toggle status instantly.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={24} sm={14}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Col>

                <Col xs={12} sm={5}>
                  <Button
                   style={{backgroundColor:"#008cba",color:"white"}}
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
                    onClick={fetchItems}
                    loading={pageLoading}
                    block
                  >
                    {isMobile ? "" : "Refresh"}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          {/* Error */}
          {error ? (
            <Alert
              type="error"
              showIcon
              message="Couldn’t load blog posts"
              description={
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Text>{error}</Text>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchItems}
                  >
                    Try Again
                  </Button>
                </Space>
              }
              style={{ marginBottom: 12, borderRadius: 12 }}
            />
          ) : null}

          {/* First load skeleton */}
          {firstLoad ? (
            <Card bordered style={{ borderRadius: 12 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey={(r) => r.id}
              size={isMobile ? "small" : "middle"}
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
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0", color: "rgba(0,0,0,0.45)" }}>
                    No blog posts found.
                  </div>
                ),
              }}
            />
          )}
        </Card>

        {/* ===== Create/Edit Modal ===== */}
        <Modal
          title={mode === "edit" ? "Edit Blog" : "Create Blog"}
          open={modalOpen}
          onCancel={() => (!saveLoading ? setModalOpen(false) : null)}
          onOk={saveItem}
          okText={mode === "edit" ? "Update Blog" : "Create Blog"}
          confirmLoading={saveLoading}
          destroyOnClose
          width={isMobile ? "100%" : 640}
          style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
          
          bodyStyle={{ padding: "18px 18px 10px" }}
        >
   
          <Form layout="vertical" size="middle">
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                <Form.Item label="Title *" required>
                  <Input
                    value={form.title}
                    placeholder="Enter blog title"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description *" required>
                  <TextArea
                    rows={5}
                    value={form.description}
                    placeholder="Write blog description..."
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={14}>
                <Form.Item label="Image URL">
                  <Input
                    prefix={<LinkOutlined />}
                    value={form.imageUrl}
                    placeholder="https://..."
                    onChange={(e) =>
                      setForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={10}>
                <Form.Item label="Status">
                  <Space>
                    <Switch
                      checked={form.isActive}
                      onChange={(checked) =>
                        setForm((p) => ({ ...p, isActive: checked }))
                      }
                      disabled={saveLoading}
                    />
                    <Text>{form.isActive ? "Active" : "Inactive"}</Text>
                  </Space>
                </Form.Item>
              </Col>

              {trimOrEmpty(form.imageUrl) ? (
                <Col xs={24}>
                  <Card size="small" style={{ borderRadius: 12 }} bordered>
                    <Space align="center">
                      <PictureOutlined />
                      <Text strong>Image Preview</Text>
                    </Space>
                    <div style={{ height: 10 }} />
                    <Image
                      src={trimOrEmpty(form.imageUrl)}
                      width="100%"
                      style={{
                        maxHeight: 220,
                        objectFit: "cover",
                        borderRadius: 10,
                      }}
                      fallback=""
                      preview
                    />
                  </Card>
                </Col>
              ) : null}
            </Row>
          </Form>
        </Modal>

        {/* ===== Preview Drawer ===== */}
        <Drawer
          title="Blog Preview"
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          width={isMobile ? "100%" : 760}
          destroyOnClose
        >
          {previewItem ? (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Title level={4} style={{ margin: 0 }}>
                {safeText(previewItem.title)}
              </Title>

              <Space wrap size={8}>
                <Text type="secondary">
                  Created: {formatDate(previewItem.createdAt)}
                </Text>
                <StatusTag active={Boolean(previewItem.isActive)} />
              </Space>

              {trimOrEmpty(previewItem.imageUrl) ? (
                <Image
                  src={trimOrEmpty(previewItem.imageUrl)}
                  width="100%"
                  style={{
                    maxHeight: 360,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                  fallback=""
                  preview
                />
              ) : null}

              <Card bordered style={{ borderRadius: 12 }}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {safeText(previewItem.description) || "-"}
                </Text>
              </Card>
            </Space>
          ) : (
            <Text type="secondary">No preview available.</Text>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
