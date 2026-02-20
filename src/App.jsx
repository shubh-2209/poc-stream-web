import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast'

const App = () => {
  return (
    <div className="app_root_wrapper">
      {/* Future Global Components Example */}
      {/* <CommonToast /> */}
      {/* <NotificationHandler /> */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AppRoutes />
    </div>
  );
};

export default App;
