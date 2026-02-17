import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import AuthPage from "./features/auth/AuthPage";
import PrivateRoute from "./features/auth/privateRoute";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes> 
          <Route path="/auth" element={<AuthPage />} />
 
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
          </Route>

           <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;