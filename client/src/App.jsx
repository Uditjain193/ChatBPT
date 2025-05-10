import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/chat";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "./redux/authSlice";
import Header from "./component/Header";

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (user && token) {
      dispatch(setCredentials({ user, token }));
    }
  }, [dispatch]);

  return (
    <div className="dark bg-gray-900 text-white min-h-screen">
      <BrowserRouter>
        <div className="sticky top-0 z-50 bg-gray-900 shadow-md w-full">
          <Header />
        </div>

        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/chat" /> : <Navigate to="/signup" />}
          />
          <Route
            path="/login"
            element={token ? <Navigate to="/chat" /> : <Login />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chat"
            element={token ? <Chat /> : <Navigate to="/login" />}
          />
          <Route
            path="*"
            element={<Navigate to={token ? "/chat" : "/login"} />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
