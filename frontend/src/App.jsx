import { Route, Routes } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar";
import LogPage from "./pages/LogPage";
import MemoriesPage from "./pages/MemoriesPage";

export default function App() {
  const [draftMessage, setDraftMessage] = useState("");

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={<LogPage message={draftMessage} setMessage={setDraftMessage} />}
          />
          <Route path="/memories" element={<MemoriesPage />} />
        </Routes>
      </div>
    </div>
  );
}
