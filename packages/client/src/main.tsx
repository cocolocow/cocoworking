import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
