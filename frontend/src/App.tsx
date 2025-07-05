import { Outlet } from "react-router-dom";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
// import "./App.css";
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 ">
          <Outlet /> {/* Đây là nơi hiển thị trang con */}
        </main>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
