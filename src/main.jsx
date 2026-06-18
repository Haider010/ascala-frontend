import { createRoot } from "react-dom/client";
import { App } from "./App";
import { hideGhlHeader } from "./utils/hideGhlHeader";
import "./styles.css";

hideGhlHeader();

createRoot(document.getElementById("root")).render(<App />);
