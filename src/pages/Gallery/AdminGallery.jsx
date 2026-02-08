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
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Divider,
  Upload,
} from "antd";
import axios from "axios";
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
  UploadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const API_PUBLIC = "https://sirivaram-backed.onrender.com/api/gallery";
const API_ADMIN  = "https://sirivaram-backed.onrender.com/api/admin/gallery";

const safeText = (v) => (typeof v === "string" ? v : "");
const trimOrEmpty = (v) => safeText(v).trim();
const toNumber = (v) => Number(v) || 0;

const truncate = (text, max = 120) => {
  const t = trimOrEmpty(text);
  return t.length > max ? t.slice(0, max) + "…" : t || "—";
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "—";

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
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
  const isSmall  = !screens.sm;

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteId, setDeleteId]       = useState(null);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);


  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem,] = useState(null);

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_PUBLIC, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (alive.current) setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message || "Could not load gallery items");
      if (alive.current) setItems([]);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const availableYears = useMemo(() => {
    const years = [...new Set(items.map(item => item.year).filter(Boolean))];
    return years.sort((a, b) => b - a);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let result = items;
    
    if (q) {
      result = result.filter(item =>
        [item.title, item.description, String(item.year || "")]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    
    if (yearFilter) {
      result = result.filter(item => item.year === yearFilter);
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
      year: toNumber(item.year),
    });
    setModalOpen(true);
  };

  // const openPreview = (item) => {
  //   setPreviewItem(item);
  //   setPreviewOpen(true);
  // };

  const validate = () => {
    if (!trimOrEmpty(form.title))       return "Title is required";
    if (!trimOrEmpty(form.imageUrl) && !trimOrEmpty(form.videoUrl))
      return "At least one media (image or video) is required";
    if (form.year < 1900 || form.year > 2100)
      return "Year should be between 1900–2100";
    return "";
  };

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
        setForm(p => ({ ...p, imageUrl: url }));
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
        imageUrl: trimOrEmpty(form.imageUrl),
        videoUrl: trimOrEmpty(form.videoUrl),
        year: toNumber(form.year),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status})${txt ? ` – ${txt}` : ""}`);
      }

      message.success(isEdit ? "Item updated" : "Item created");
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      message.error(err.message || "Operation failed");
    } finally {
      if (alive.current) setSaveLoading(false);
    }
  };

  const remove = (id) => {
    Modal.confirm({
      title: "Delete this gallery item?",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleteId(id);
        try {
          const res = await fetch(`${API_ADMIN}/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
          });
          if (!res.ok) throw new Error();
          message.success("Deleted successfully");
          fetchItems();
        } catch {
          message.error("Delete failed");
        } finally {
          if (alive.current) setDeleteId(null);
        }
      },
    });
  };

  const columns = useMemo(() => [
    {
      title: "S.No",
     
      align: "center",
    
      render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: "Title",
       align: "center",
      dataIndex: "title",
      render: (v, r) => (
        <Space direction="vertical" size={2}>
          <Text strong>{truncate(v, 60)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {r.id?.slice(0,8) || "—"}
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
     align: "center",
     
      render: (_, item) => {
        const hasImg = !!trimOrEmpty(item.imageUrl);
        const hasVid = !!trimOrEmpty(item.videoUrl);
        if (!hasImg && !hasVid) return <Text type="secondary">—</Text>;

        return (
          <Space size={8}>
            {hasImg && (
              <Image
                src={item.imageUrl}
                width={64}
                height={48}
                style={{ borderRadius: 8, objectFit: "cover" }}
                preview={{ src: item.imageUrl }}
                fallback=""
              />
            )}
            {hasVid && <Tag icon={<VideoCameraOutlined />} color="#1ab394">Video</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      align: "center",
    
      render: (v) => <Text type="secondary">{formatDate(v)}</Text>,
    },
    {
      title: "Actions",
    
      align: "center",
     
      render: (_, item) => (
        <Space size="small">
        
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(item)} ></Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteId === item.id}
              onClick={() => remove(item.id)}
            >
              </Button>
          </Tooltip>
        </Space>
      ),
    },
  ], [page, pageSize, isMobile, deleteId]);

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
        <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {/* Header */}
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24}>
              <Space direction="vertical" size={4}>
                <Title level={4} style={{ margin: 0, color: "#008cba" }}>
                  Gallery Management
                </Title>
                <Text type="secondary">
                  Add, edit and organize images & videos by year
                </Text>
              </Space>
            </Col>
          </Row>

          {/* Filters & Actions Row */}
          <Row gutter={[12, 12]} style={{ marginTop: 16 }} align="middle">
            <Col xs={24} sm={12} md={10} lg={8}>
              <Input
                placeholder="Search title, description, year..."
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
                    {!isSmall ? "New Item" : "New"}
                  </Button>
                </Col>
                <Col>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={fetchItems}
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
            dataSource={filteredItems}
            rowKey={r => r.id || `${r.title}-${r.year}`}
            loading={loading}
         
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
            bordered
            locale={{ emptyText: "No gallery items found" }}
          />
        </Card>

        {/* ─── Modal ─── */}
        <Modal
          title={mode === "edit" ? "Edit Gallery Item" : "Add New Gallery Item"}
          open={modalOpen}
          onCancel={() => !saveLoading && setModalOpen(false)}
          onOk={save}
          okText={mode === "edit" ? "Update" : "Create"}
          confirmLoading={saveLoading}
          width={isMobile ? "96%" : 680}
          centered
          destroyOnClose
        >
          <Form layout="vertical" size="middle">
            <Row gutter={[12, 8]}>
              <Col xs={24} sm={16}>
                <Form.Item label="Title" required style={{ marginBottom: 12 }}>
                  <Input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Gallery title"
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item label="Year" required style={{ marginBottom: 12 }}>
                  <InputNumber
                    prefix={<CalendarOutlined />}
                    min={1900}
                    max={2100}
                    value={form.year}
                    onChange={v => setForm(p => ({ ...p, year: toNumber(v) }))}
                    style={{ width: "100%" }}
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description" style={{ marginBottom: 12 }}>
                  <TextArea
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Short description..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Image" required={!trimOrEmpty(form.videoUrl)} style={{ marginBottom: 8 }}>
                  <Upload
                    beforeUpload={handleImageUpload}
                    maxCount={1}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} block size="small">
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </Upload>
                </Form.Item>
                {trimOrEmpty(form.imageUrl) && (
                  <Image
                    src={trimOrEmpty(form.imageUrl)}
                    alt="preview"
                    style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 6 }}
                    preview
                  />
                )}
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Video URL" style={{ marginBottom: 8 }}>
                  <Input
                    prefix={<VideoCameraOutlined />}
                    value={form.videoUrl}
                    onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://..."
                    disabled={saveLoading}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* ─── Preview Drawer ─── */}
        <Drawer
          title="Gallery Item Preview"
          width={isMobile ? "100%" : 760}
          placement="right"
          onClose={() => setPreviewOpen(false)}
          open={previewOpen}
          destroyOnClose
        >
          {previewItem && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Title level={4} style={{ margin: "0 0 8px" }}>
                  {previewItem.title}
                </Title>
                <Space wrap size="middle">
                  <Tag color="blue">Year {previewItem.year}</Tag>
                  <Text type="secondary">Added {formatDate(previewItem.createdAt)}</Text>
                </Space>
              </div>

              {previewItem.description && (
                <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {previewItem.description}
                </Text>
              )}

              {previewItem.imageUrl && (
                <Image
                  src={previewItem.imageUrl}
                  style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 10 }}
                  preview
                />
              )}

              {previewItem.videoUrl && (
                <Card size="small">
                  <Space direction="vertical" size={4}>
                    <Text strong>Video:</Text>
                    <a href={previewItem.videoUrl} target="_blank" rel="noopener noreferrer">
                      {truncate(previewItem.videoUrl, 80)}
                    </a>
                  </Space>
                </Card>
              )}
            </Space>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}