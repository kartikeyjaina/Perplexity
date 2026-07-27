import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const Protected = ({ children }) => {

  const user = useSelector((state) => state.auth.user);
  const checkingAuth = useSelector((state) => state.auth.checkingAuth);

  if (checkingAuth) return <div>Loading...</div>;
  if (!user) return <Navigate to="/register" replace />;
  return children;
};

export default Protected;
