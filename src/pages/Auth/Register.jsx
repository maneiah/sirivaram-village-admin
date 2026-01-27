import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  LockOutlined,
  HomeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        "https://sirivaram-backed.onrender.com/api/auth/register",
        {
          ...values,
          role: "ADMIN",
        },
      );

      setSuccess("Registration successful! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#008cba",
        },
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
        }}
      >
        <Card
          style={{
            width: 460,
            maxWidth: "95%",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Header */}
            <div style={{ textAlign: "center" }}>
              <Title level={3} style={{ margin: 0 }}>
                Admin Registration
              </Title>
              <Text type="secondary">Create Sirivaram Admin Account</Text>
            </div>

            {/* Alerts */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ borderRadius: 8 }}
              />
            )}

            {success && (
              <Alert
                message={success}
                type="success"
                showIcon
                style={{ borderRadius: 8 }}
              />
            )}

            {/* Form */}
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Full Name"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Mobile Number"
                name="mobile"
                rules={[
                  { required: true, message: "Please enter mobile number" },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Mobile Number"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Please enter address" }]}
              >
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Address"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Village"
                name="village"
                rules={[{ required: true, message: "Please enter village" }]}
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Village"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Register
                </Button>
              </Form.Item>
            </Form>

            {/* Login Link */}
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Already have admin? </Text>
              <Link to="/login" style={{ fontWeight: 600 }}>
                Login
              </Link>
            </div>

            {/* Footer */}
            <Text
              type="secondary"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              © {new Date().getFullYear()} Sirivaram Admin Panel
            </Text>
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Register;
