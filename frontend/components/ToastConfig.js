"use client";

import { ToastContainer, Slide } from "react-toastify";

export default function ToastConfig() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={1500}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={false}
      pauseOnHover={false}
      theme="dark"
      transition={Slide}
    />
  );
}
