import "@fortawesome/fontawesome-free/css/all.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Modal from "react-modal";

import App from "./App";

const root = document.getElementById("root")!;

Modal.setAppElement(root);

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
