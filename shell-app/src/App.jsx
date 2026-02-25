import React, { Suspense, lazy } from "react";

// Remote components
const AuthPage = lazy(() => import("auth_app/AuthPage"));
const ContestPage = lazy(() => import("contest_app/ContestPage"));

export default function App() {
  return (
    <div>
      <h1>Escape Live Shell</h1>

      <Suspense fallback={<div>Loading Auth Module...</div>}>
        <AuthPage />
      </Suspense>

      <Suspense fallback={<div>Loading Contest Module...</div>}>
        <ContestPage />
      </Suspense>
    </div>
  );
}