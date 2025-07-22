import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import styles from "./App.module.scss";
import "./index.scss";
import { Create } from "./pages/Create";
import Edit from "./pages/Edit";
import Home from "./pages/Home";
import { Login } from "./pages/Login";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className={styles.background}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create" element={<Create />} />
            <Route path="/edit" element={<Edit />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
