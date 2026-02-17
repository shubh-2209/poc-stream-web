import React from "react";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <div className="app_root_wrapper">
      {/* Future Global Components Example */}
      {/* <CommonToast /> */}
      {/* <NotificationHandler /> */}

      <AppRoutes />
    </div>
  );
};

export default App;
