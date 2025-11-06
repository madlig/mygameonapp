import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Content from "./Content";
import Headbar from "./Headbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white h-screen sticky top-0 overflow-hidden">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Headbar */}
        <div className="sticky top-0 z-20 bg-white shadow">
          <Headbar />
        </div>

        {/* Content and Footer */}
        <div className="flex flex-col flex-1 overflow-y-auto bg-gray-100">
          <Content>
            <Outlet />
          </Content>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
