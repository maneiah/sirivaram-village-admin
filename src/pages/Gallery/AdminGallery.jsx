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
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
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
  LinkOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const API_BASE = "https://sirivaram-backed.onrender.com/api/admin/gallery";
const API_BASE1 = "https://sirivaram-backed.onrender.com/api/gallery";

const safeText = (v) => (typeof v === "string" ? v : "");

const truncate = (text, max = 120) => {
  const t = safeText(text).trim();
  if (!t) return "-";
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

const emptyForm = {
  id: null,
  title: "",
  description: "",
  imageUrl: "",
  videoUrl: "",
  year: new Date().getFullYear(),
};

export default function AdminGallery() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [items, setItems] = useState([]);
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

    let list = [];
    try {
      const res = await fetch(API_BASE1, { headers: { ...getAuthHeaders() } });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      list = Array.isArray(data) ? data : [];
    } catch (e) {
      message.error(e?.message || "Failed to load gallery items");
      list = [];
    } finally {
      if (aliveRef.current) {
        setItems(list);
        setPageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (q === "") return items;

    return items.filter((item) =>
      [item?.title, item?.description, item?.year]
        .join(" ")
        .toLowerCase()
        .includes(q),
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
      year: toNumber(item.year || new Date().getFullYear()),
    });
    setModalOpen(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setViewOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.imageUrl.trim() && !form.videoUrl.trim()) {
      return "Please add Image URL or Video URL (at least one)";
    }
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
      const url = isEdit ? `${API_BASE}/${form.id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        videoUrl: form.videoUrl.trim(),
        year: toNumber(form.year),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `${method} failed: ${res.status}${text ? ` - ${text}` : ""}`,
        );
      }

      message.success(isEdit ? "Gallery item updated" : "Gallery item created");
      setModalOpen(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (e) {
      message.error(e?.message || "Save failed");
    } finally {
      if (aliveRef.current) setSaveLoading(false);
    }
  };

  const deleteItem = (id) => {
    if (!id) return;

    Modal.confirm({
      title: "Delete gallery item?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        setDeleteLoadingId(id);
        try {
          const res = await fetch(`${API_BASE}/${id}`, {
            method: "DELETE",
            headers: { ...getAuthHeaders() },
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(
              `DELETE failed: ${res.status}${text ? ` - ${text}` : ""}`,
            );
          }

          message.success("Gallery item deleted");
          fetchItems();
        } catch (e) {
          message.error(e?.message || "Delete failed");
        } finally {
          if (aliveRef.current) setDeleteLoadingId(null);
        }
      },
    });
  };

  const mediaCell = (item) => {
    const hasImage = !!safeText(item?.imageUrl).trim();
    const hasVideo = !!safeText(item?.videoUrl).trim();

    if (!hasImage && !hasVideo) return <Text type="secondary">-</Text>;

    return (
      <Space size={8}>
        {hasImage ? (
          <Tooltip title="Image attached">
            <Image
              src={item.imageUrl}
              width={80}
              height={52}
              style={{ objectFit: "cover", borderRadius: 10 }}
              preview={false}
              fallback=""
            />
          </Tooltip>
        ) : (
          <Tag icon={<PictureOutlined />} color="warning">
            No Image
          </Tag>
        )}

        {hasVideo ? (
          <Tag icon={<VideoCameraOutlined />} color="success">
            Video
          </Tag>
        ) : null}
      </Space>
    );
  };

  const columns = useMemo(
    () => [
      {
        title: "S NO",
       
        align: "center",
        render: (_, __, idx) => idx + 1,
        fixed: isMobile ? undefined : "left",
      },
      {
        title: "Title",
        dataIndex: "title",
       
        render: (v, item) => (
          <Space direction="vertical" size={0}>
            <Text strong title={safeText(v)}>
              {truncate(v, 70)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {item?.id || "-"}
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
            <Text>{truncate(v, 130)}</Text>
          </Tooltip>
        ),
        responsive: ["lg"],
      },
      {
        title: "Media",
     
        render: (_, item) => mediaCell(item),
      },
      {
        title: "Year",
        dataIndex: "year",
       
        align: "center",
        render: (v) => <Text>{v ?? "-"}</Text>,
        responsive: ["md"],
      },
      {
        title: "Created",
        dataIndex: "createdAt",
       
        render: (v) => <Text type="secondary">{formatDate(v)}</Text>,
        responsive: ["md"],
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
                onClick={() => openView(item)}
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
    ],
    [deleteLoadingId, isMobile],
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#008cba",
          colorSuccess: "#1ab394",
        },
      }}
    >
      <div
        style={{
          width: "100%",
          padding: isMobile ? "12px" : "24px",
       
          minHeight: "100vh",
        }}
      >
        <Card
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
          bodyStyle={{ padding: isMobile ? 12 : 24 }}
        >
          {/* Header */}
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={2}>
                <Title level={4} style={{ margin: 0 }}>
                  Gallery Admin
                </Title>
                <Text type="secondary">
                  Manage images/videos by year with clean preview & quick
                  actions.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={24} sm={14}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Search title / description / year..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Col>

                <Col xs={12} sm={5}>
                  <Button
                    type="primary"
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

          <div style={{ height: 16 }} />

          {/* Table */}
          {pageLoading ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 10 }}>
                <Text type="secondary">Loading...</Text>
              </div>
            </div>
          ) : (
            <Table
              columns={columns}
                dataSource={filtered}
                bordered
              rowKey={(r) => r.id || `${r.title}-${r.year}`}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: "true" }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total}`,
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0", color: "rgba(0,0,0,0.45)" }}>
                    No gallery items found.
                  </div>
                ),
              }}
            />
          )}
        </Card>

        {/* ===== Create/Edit Modal ===== */}
        <Modal
          title={mode === "edit" ? "Edit Gallery Item" : "Create Gallery Item"}
          open={modalOpen}
          onCancel={() => (!saveLoading ? setModalOpen(false) : null)}
          onOk={saveItem}
          okText={mode === "edit" ? "Update Item" : "Create Item"}
          confirmLoading={saveLoading}
          destroyOnClose
          width={isMobile ? "100%" : 820}
          style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
        >
       

          <Form layout="vertical">
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                <Form.Item label="Title *" required>
                  <Input
                    value={form.title}
                    placeholder="Gallery item title"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description">
                  <TextArea
                    rows={3}
                    value={form.description}
                    placeholder="Optional description"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Image URL">
                  <Input
                    prefix={<LinkOutlined />}
                    value={form.imageUrl}
                    placeholder="https://example.com/image.jpg"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>

                {form.imageUrl.trim() ? (
                  <Card size="small" style={{ borderRadius: 12 }}>
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Text strong>Image Preview</Text>
                      <Image
                        src={form.imageUrl.trim()}
                        width="100%"
                        style={{
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 10,
                        }}
                        fallback=""
                        preview
                      />
                    </Space>
                  </Card>
                ) : null}
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Video URL">
                  <Input
                    prefix={<LinkOutlined />}
                    value={form.videoUrl}
                    placeholder="https://example.com/video or YouTube link"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, videoUrl: e.target.value }))
                    }
                    disabled={saveLoading}
                  />
                </Form.Item>

                {form.videoUrl.trim() ? (
                  <Card size="small" style={{ borderRadius: 12 }}>
                    <Space direction="vertical" size={6}>
                      <Text strong>Video Link</Text>
                      <a
                        href={form.videoUrl.trim()}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {form.videoUrl.trim()}
                      </a>
                      <Tag icon={<VideoCameraOutlined />} color="success">
                        Video link added
                      </Tag>
                    </Space>
                  </Card>
                ) : null}
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
            </Row>
          </Form>
        </Modal>

        {/* ===== View Drawer ===== */}
        <Drawer
          title="Gallery Item Preview"
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          width={isMobile ? "100%" : 720}
          destroyOnClose
        >
          {viewItem ? (
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Title level={4} style={{ margin: 0 }}>
                {safeText(viewItem.title)}
              </Title>

              <Space wrap>
                <Tag color="geekblue">Year: {viewItem.year ?? "-"}</Tag>
                <Tag>Created: {formatDate(viewItem.createdAt)}</Tag>
              </Space>

              {safeText(viewItem.description) ? (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  <Text>{safeText(viewItem.description)}</Text>
                </div>
              ) : (
                <Text type="secondary">No description.</Text>
              )}

              {safeText(viewItem.imageUrl) ? (
                <Image
                  src={viewItem.imageUrl}
                  width="100%"
                  style={{
                    maxHeight: 380,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                  fallback=""
                  preview
                />
              ) : null}

              {safeText(viewItem.videoUrl) ? (
                <Card size="small" style={{ borderRadius: 12 }}>
                  <Space direction="vertical" size={4}>
                    <Text strong>Video URL</Text>
                    <a
                      href={viewItem.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {viewItem.videoUrl}
                    </a>
                  </Space>
                </Card>
              ) : null}
            </Space>
          ) : (
            <Text type="secondary">No preview available.</Text>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
