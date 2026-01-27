import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Grid,
  Drawer,
  Typography,
  Button,
  Tooltip,
  Breadcrumb,
  Dropdown,
  Avatar,
  Space,
  message,
} from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  DashboardOutlined,
  UserOutlined,
  ReadOutlined,
  CalendarOutlined,
  PictureOutlined,
  LayoutOutlined,
  LogoutOutlined,
  DollarCircleOutlined,
  SettingOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const SIDEBAR_WIDTH = 256;
const COLLAPSED_WIDTH = 84;

/* ===== SINGLE SOURCE OF SIDEBAR ITEMS ===== */
const ADMIN_MENU = [
  {
    key: "/reports",
    label: "Dashboard Overview",
    icon: <DashboardOutlined />,
    to: "/reports",
  },
  {
    key: "/users",
    label: "User Management",
    icon: <UserOutlined />,
    to: "/users",
  },
  {
    key: "/blogs",
    label: "Blog Management",
    icon: <ReadOutlined />,
    to: "/blogs",
  },
  {
    key: "/events",
    label: "Event Management",
    icon: <CalendarOutlined />,
    to: "/events",
  },
  {
    key: "/gallery",
    label: "Gallery Management",
    icon: <PictureOutlined />,
    to: "/gallery",
  },
  {
    key: "/footer",
    label: "Site Configuration",
    icon: <LayoutOutlined />,
    to: "/footer",
  },
  {
    key: "/payments",
    label: "Payment Processing",
    icon: <DollarCircleOutlined />,
    to: "/payments",
  },
];

// Breadcrumb label map
const LABEL_MAP = {
  reports: "Dashboard Overview",
  users: "User Management",
  blogs: "Blog Management",
  events: "Event Management",
  gallery: "Gallery Management",
  footer: "Site Configuration",
  payments: "Payment Processing",
};

const getSelectedKey = (pathname) => {
  const match = ADMIN_MENU.map((m) => m.key)
    .filter((k) => pathname === k || pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match || "/reports";
};

const generateBreadcrumbs = (pathname) => {
  const items = [
    {
      title: (
        <Link
          to="/reports"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <HomeOutlined /> Dashboard
        </Link>
      ),
    },
  ];

  if (!pathname || pathname === "/" || pathname === "/reports") return items;

  const parts = pathname.split("/").filter(Boolean);
  let currentPath = "";

  parts.forEach((part, idx) => {
    currentPath += "/" + part;
    const label =
      LABEL_MAP[part] || part.charAt(0).toUpperCase() + part.slice(1);

    if (idx === parts.length - 1) items.push({ title: label });
    else items.push({ title: <Link to={currentPath}>{label}</Link> });
  });

  return items;
};

const AdminPanelLayout = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isLarge = !!screens.lg;

  const navigate = useNavigate();
  const location = useLocation();
  const year = new Date().getFullYear();

  // Persist collapse preference (better UX)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_layout_collapsed");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scroll to top on route change (better UX)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (isMobile) setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Save collapse preference
  useEffect(() => {
    try {
      localStorage.setItem("admin_layout_collapsed", JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const selectedKey = useMemo(
    () => getSelectedKey(location.pathname),
    [location.pathname],
  );

  const sidebarItems = useMemo(
    () =>
      ADMIN_MENU.map((m) => ({
        key: m.key,
        icon: m.icon,
        label: <Link to={m.to}>{m.label}</Link>,
      })),
    [],
  );

  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(location.pathname),
    [location.pathname],
  );

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate("/login");
  }, [navigate]);

  const toggleSidebar = useCallback(() => setCollapsed((v) => !v), []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const mainMarginLeft = isMobile
    ? 0
    : collapsed
      ? COLLAPSED_WIDTH
      : SIDEBAR_WIDTH;

  const profileMenuItems = useMemo(
    () => [
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Settings",
        onClick: () => message.info("Settings page (optional)"),
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        danger: true,
        onClick: handleLogout,
      },
    ],
    [handleLogout],
  );

  const MenuContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={sidebarItems}
      onClick={() => isMobile && setDrawerOpen(false)}
      className="adminMenu"
    />
  );

  return (
    <Layout className="adminRoot">
      {/* ===== IMPROVED CSS (clean, responsive, smooth) ===== */}
      <style>{`
        .adminRoot {
          min-height: 100vh;
          background: #f3f6fb;
        }

        /* SIDEBAR */
        .adminSider {
          background: #0f172a !important;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .adminBrand {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          color: #fff;
        }
        .adminLogo {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: grid;
          place-items: center;
          font-weight: 900;
          user-select: none;
        }
        .adminBrandText {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }
        .adminBrandText .title {
          font-weight: 900;
          letter-spacing: 0.4px;
        }
        .adminBrandText .sub {
          font-size: 12px;
          color: rgba(226,232,240,0.78);
        }

        /* MENU */
        .adminMenu {
          padding: 10px;
          background: #0f172a !important;
          height: calc(100vh - 64px);
          overflow: auto;
        }
        .adminMenu .ant-menu-item {
          height: 46px !important;
          line-height: 46px !important;
          border-radius: 12px !important;
          margin: 6px 4px !important;
          font-weight: 700;
        }
        .adminMenu .ant-menu-item a {
          color: rgba(226,232,240,0.92) !important;
          text-decoration: none !important;
        }
        .adminMenu .ant-menu-item:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .adminMenu .ant-menu-item-selected {
          background: rgba(255,255,255,0.12) !important;
        }

        /* Scrollbar (nice) */
        .adminMenu::-webkit-scrollbar { width: 8px; }
        .adminMenu::-webkit-scrollbar-track { background: transparent; }
        .adminMenu::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.35); border-radius: 999px; }

        /* HEADER */
        .adminHeader {
          background: rgba(255,255,255,0.9) !important;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(15,23,42,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px !important;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .adminHeaderLeft {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .adminHeaderTitle {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.1;
        }
        .adminHeaderTitle .h1 {
          margin: 0;
          font-weight: 900;
          font-size: 15px;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .adminHeaderTitle .h2 {
          margin: 0;
          font-size: 12px;
          color: rgba(15,23,42,0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* CONTENT */
        .adminBreadcrumbWrap {
          padding: 14px 14px 0;
        }
        .adminContent {
          padding: 14px;
        }
        .adminCard {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 6px 24px rgba(15,23,42,0.06);
          border: 1px solid rgba(15,23,42,0.06);
          overflow-x: auto;
          min-height: calc(100vh - 64px - 52px - 70px);
        }

        /* FOOTER */
        .adminFooter {
          text-align: center;
          background: #fff !important;
          border-top: 1px solid rgba(15,23,42,0.06);
        }

        /* MOBILE spacing */
        @media (max-width: 768px) {
          .adminBreadcrumbWrap { padding: 12px 12px 0; }
          .adminContent { padding: 12px; }
          .adminCard { border-radius: 14px; padding: 12px; }
        }
      `}</style>

      {/* ===== Desktop Sidebar ===== */}
      {!isMobile && (
        <Sider
          className="adminSider"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={SIDEBAR_WIDTH}
          collapsedWidth={COLLAPSED_WIDTH}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          <div
            className="adminBrand"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <div className="adminLogo">S</div>
            {!collapsed && (
              <div className="adminBrandText">
                <div className="title">SIRIVARAM ADMIN</div>
              
              </div>
            )}
          </div>
          {MenuContent}
        </Sider>
      )}

      {/* ===== Mobile Drawer Sidebar ===== */}
      {isMobile && (
        <Drawer
          placement="left"
          width={SIDEBAR_WIDTH}
          open={drawerOpen}
          onClose={closeDrawer}
          bodyStyle={{ padding: 0, background: "#0f172a" }}
          headerStyle={{ display: "none" }}
          destroyOnClose
        >
          <div className="adminBrand">
            <div className="adminLogo">S</div>
            <div className="adminBrandText">
              <div className="title">SIRIVARAM ADMIN</div>
             
            </div>
          </div>
          {MenuContent}
        </Drawer>
      )}

      {/* ===== Main Layout ===== */}
      <Layout
        style={{
          marginLeft: mainMarginLeft,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
          background: "#f3f6fb",
        }}
      >
        <Header className="adminHeader">
          <div className="adminHeaderLeft">
            {isMobile ? (
              <Button
                type="text"
                aria-label="Open menu"
                icon={<MenuOutlined />}
                onClick={openDrawer}
              />
            ) : (
              <Button
                type="text"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleSidebar}
              />
            )}

            <div className="adminHeaderTitle">
              <div className="h1">Admin Panel</div>
             
            </div>
          </div>

          <Space size={10}>
            {/* Quick logout (desktop) */}
            <Tooltip title="Logout">
              <Button
                danger
                type="primary"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="middle"
              >
                {isLarge ? "Logout" : null}
              </Button>
            </Tooltip>

            {/* Profile dropdown (better UX) */}
            <Dropdown
              menu={{ items: profileMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button type="text" aria-label="Profile menu">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {isLarge ? <Text strong>Admin</Text> : null}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <div className="adminBreadcrumbWrap">
          <Breadcrumb items={breadcrumbs} />
        </div>

        <Content className="adminContent">
          <div className="adminCard">
            <Outlet />
          </div>
        </Content>

        <Footer className="adminFooter">
          Sirivaram Admin ©{year} • Professional Management Solution
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminPanelLayout;
