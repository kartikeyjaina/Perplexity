import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { register, login, getMe, logout } from "../services/auth.api";
import { setUser, setLoading, setError, clearError } from "../auth.slice";
export function useAuth() {
  const dispatch = useDispatch();

  const handleLogout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await logout();
      dispatch(setUser(null));
      dispatch(clearError());
    } catch (error) {
      console.error("Logout error:", error);
      // Clear user anyway on logout attempt
      dispatch(setUser(null));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleRegister = useCallback(async ({ email, username, password }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      await register({ email, username, password });
      // User needs to verify email before login
      dispatch(setError(null));
    } catch (error) {
      dispatch(
        setError(error.response?.data?.message || "Registration failed"),
      );
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleLogin = useCallback(async ({ email, password }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const data = await login({ email, password });
      dispatch(setUser(data.user));
    } catch (error) {
      dispatch(setError(error.response?.data?.message || "Login failed"));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleGetMe = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await getMe();
      dispatch(setUser(data.user));
    } catch (err) {
      // Do not show global error for expected unauthenticated state.
      if (err?.response?.status !== 401) {
        dispatch(
          setError(err.response?.data?.message || "Failed to fetch user data"),
        );
      }
      dispatch(setUser(null));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    handleRegister,
    handleLogin,
    handleGetMe,
    handleLogout,
  };
}
