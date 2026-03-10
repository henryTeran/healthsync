import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./guards/PrivateRoute";
import { Login } from "../../features/auth/ui/LoginPage";
import { Register } from "../../features/auth/ui/RegisterPage";
import { PrivateLayout } from "../layouts/PrivateLayout";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="*" element={<PrivateLayout />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};
