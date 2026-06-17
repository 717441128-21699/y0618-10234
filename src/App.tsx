import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import HouseList from "./pages/HouseList.js";
import HouseDetail from "./pages/HouseDetail.js";
import PublishHouse from "./pages/PublishHouse.js";
import Profile from "./pages/Profile.js";
import MatchList from "./pages/MatchList.js";
import ChatList from "./pages/ChatList.js";
import ChatRoom from "./pages/ChatRoom.js";
import AgreementList from "./pages/AgreementList.js";
import AgreementDetail from "./pages/AgreementDetail.js";
import DisputeList from "./pages/DisputeList.js";
import DisputeDetail from "./pages/DisputeDetail.js";
import VerifyIdentity from "./pages/VerifyIdentity.js";
import { useAuthStore } from "./store/useAuthStore.js";

function PrivateRoute() {
  const { user, token } = useAuthStore();
  return user && token ? <Outlet /> : <Navigate to="/login" replace />;
}

function VerifiedRoute() {
  const { user, token } = useAuthStore();
  if (!user || !token) return <Navigate to="/login" replace />;
  if (!user.realNameVerified) return <Navigate to="/verification" replace />;
  return <Outlet />;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchProfile().catch(console.error);
    }
  }, [token, fetchProfile]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/houses" element={<HouseList />} />
          <Route path="/houses/:id" element={<HouseDetail />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/publish" element={<PublishHouse />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verification" element={<VerifyIdentity />} />
          </Route>
          
          <Route element={<VerifiedRoute />}>
            <Route path="/matches" element={<MatchList />} />
            <Route path="/chat" element={<ChatList />} />
            <Route path="/chat/:userId" element={<ChatRoom />} />
            <Route path="/agreements" element={<AgreementList />} />
            <Route path="/agreements/:id" element={<AgreementDetail />} />
            <Route path="/disputes" element={<DisputeList />} />
            <Route path="/disputes/:id" element={<DisputeDetail />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
