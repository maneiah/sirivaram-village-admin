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
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Grid,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Typography,
  message,
  Skeleton,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const GET_FOOTER_URL = "https://sirivaram-backed.onrender.com/api/footer";
const ADMIN_PUT_URL = "https://sirivaram-backed.onrender.com/api/admin/footer";

const safeStr = (v) => (typeof v === "string" ? v : "");

const normalize = (data) => ({
  address: safeStr(data?.address),
  contactNo: safeStr(data?.contactNo),
  email: safeStr(data?.email),
  facebook: safeStr(data?.facebook),
  instagram: safeStr(data?.instagram),
  youtube: safeStr(data?.youtube),
});

export default function FooterSettings() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [saving, setSaving] = useState(false);

  const [apiError, setApiError] = useState("");

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadFooter = useCallback(async () => {
    setLoading(true);
    setApiError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await axios.get(GET_FOOTER_URL, {
        headers: { ...authHeaders },
        signal: controller.signal,
      });

      const data = normalize(res.data || {});
      if (aliveRef.current) {
        form.setFieldsValue(data);
      }
    } catch (e) {
      const msg =
        e?.name === "CanceledError"
          ? "Request cancelled"
          : e?.name === "AbortError"
            ? "Request timed out. Please try again."
            : e?.response?.data?.message ||
              e?.message ||
              "Failed to load footer details.";

      if (aliveRef.current) {
        setApiError(msg);
        form.setFieldsValue(normalize({}));
      }
    } finally {
      clearTimeout(timeout);
      if (aliveRef.current) {
        setLoading(false);
        setFirstLoad(false);
      }
    }
  }, [authHeaders, form]);

  useEffect(() => {
    loadFooter();
  }, [loadFooter]);

  const validateUrlOptional = (_, value) => {
    const v = safeStr(value).trim();
    if (!v) return Promise.resolve();
    try {
      const u = new URL(v);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return Promise.reject(new Error("URL must start with http/https"));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Enter a valid URL"));
    }
  };

  const doSave = async () => {
    try {
      setSaving(true);
      setApiError("");

      const values = await form.validateFields();

      // ✅ Payload exactly as backend expects
      const payload = {
        address: safeStr(values.address).trim(),
        contactNo: safeStr(values.contactNo).trim(),
        email: safeStr(values.email).trim(),
        facebook: safeStr(values.facebook).trim(),
        instagram: safeStr(values.instagram).trim(),
        youtube: safeStr(values.youtube).trim(),
      };

      await axios.put(ADMIN_PUT_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      message.success("Footer details saved successfully");
      await loadFooter();
    } catch (e) {
      const msg =
        e?.errorFields?.[0]?.errors?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Save failed";

      if (aliveRef.current) setApiError(String(msg));
      message.error(String(msg));
    } finally {
      if (aliveRef.current) setSaving(false);
    }
  };

  const onSave = async () => {
    // Optional: confirm before saving (prevents wrong update)
    Modal.confirm({
      title: "Save footer changes?",
      icon: <ExclamationCircleOutlined />,
      content: "This will update footer details for the website.",
      okText: "Save",
      okButtonProps: { type: "primary" },
      cancelText: "Cancel",
      onOk: doSave,
    });
  };

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
                  Footer Settings
                </Title>
                <Text type="secondary">
                  Update address, contact, and social links shown in the footer.
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={12} sm={10}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadFooter}
                    loading={loading}
                    block
                  >
                    {isMobile ? "" : "Refresh"}
                  </Button>
                </Col>
                <Col xs={12} sm={14}>
                  <Button
                   style={{backgroundColor:"#008cba",color:"white"}}
                    icon={<SaveOutlined />}
                    onClick={onSave}
                    loading={saving}
                    block
                  >
                    {isMobile ? "" : "Save Changes"}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          {apiError ? (
            <Alert
              type="error"
              showIcon
              message={apiError}
              style={{ marginBottom: 16, borderRadius: 12 }}
            />
          ) : null}

          {firstLoad ? (
            <Card bordered style={{ borderRadius: 12 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 10 }}>
                <Text type="secondary">Loading footer details...</Text>
              </div>
            </div>
          ) : (
            <Form form={form} layout="vertical" requiredMark="optional">
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="Address"
                    name="address"
                    rules={[
                      { required: true, message: "Address is required" },
                      { max: 500, message: "Max 500 characters" },
                    ]}
                  >
                    <Input.TextArea
                      rows={isMobile ? 3 : 2}
                      placeholder="Enter address shown in footer"
                      allowClear
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Contact Number"
                    name="contactNo"
                    rules={[
                      { required: true, message: "Contact number is required" },
                      { max: 30, message: "Max 30 characters" },
                    ]}
                  >
                    <Input placeholder="e.g., +91 98765 43210" allowClear />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Enter a valid email" },
                      { max: 120, message: "Max 120 characters" },
                    ]}
                  >
                    <Input placeholder="e.g., support@example.com" allowClear />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Facebook URL"
                    name="facebook"
                    rules={[{ validator: validateUrlOptional }]}
                  >
                    <Input placeholder="https://facebook.com/..." allowClear />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Instagram URL"
                    name="instagram"
                    rules={[{ validator: validateUrlOptional }]}
                  >
                    <Input placeholder="https://instagram.com/..." allowClear />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="YouTube URL"
                    name="youtube"
                    rules={[{ validator: validateUrlOptional }]}
                  >
                    <Input placeholder="https://youtube.com/..." allowClear />
                  </Form.Item>
                </Col>
              </Row>

             
            </Form>
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
}
