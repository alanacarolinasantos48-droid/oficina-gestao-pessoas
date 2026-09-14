import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import QrCheckin from "./QrCheckin.jsx";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const isQrCheckin = params.get("checkin") === "1";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isQrCheckin ? <QrCheckin /> : <App />}
  </React.StrictMode>
);