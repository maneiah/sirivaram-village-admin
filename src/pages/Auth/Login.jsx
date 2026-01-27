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
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "https://sirivaram-backed.onrender.com/api/auth/login",
        {
          mobile: values.mobile,
          password: values.password,
        },
      );

      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      navigate("/reports");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Invalid mobile number or password",
      );
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
          background: "#f8f9fa", // ✅ Updated: Clean light gray bg (no gradient)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
        }}
      >
        <Card
          style={{
            width: 420,
            maxWidth: "95%",
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)", // ✅ Subtle shadow for clean design
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Header */}
            <div style={{ textAlign: "center" }}>
              <Title level={3} style={{ margin: 0, color: "#1a1a1a" }}>
                Admin Login
              </Title>
              <Text type="secondary">Sign in to Sirivaram Admin Panel</Text>
            </div>

            {/* Error */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ borderRadius: 8 }}
              />
            )}

            {/* Form */}
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Mobile Number"
                name="mobile"
                rules={[
                  { required: true, message: "Please enter mobile number" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter mobile number"
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
                  placeholder="Enter password"
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
                  Login
                </Button>
              </Form.Item>
            </Form>

            {/* Register Link */}
            {/* <div style={{ textAlign: "center" }}>
              <Text type="secondary">New Admin? </Text>
              <Link to="/register" style={{ fontWeight: 600 }}>
                Register
              </Link>
            </div> */}

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

export default Login;
