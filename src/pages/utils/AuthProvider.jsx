import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import http from "../../api/http";
import {
  getUser,
  getToken,
  getPerms,
  setPerms,
  permsAreFresh,
  clearAuth,
} from "./authStorage";
import { normalizePermissions } from "./permissions";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userSession, setUserSession] = useState(() => getUser());
  const [perms, setPermState] = useState(() => getPerms());
  const [loadingPerms, setLoadingPerms] = useState(false);

  const refreshPermissions = async ({ force = false } = {}) => {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
      clearAuth();
      setUserSession(null);
      setPermState(null);
      return { ok: false, reason: "No user/token" };
    }

    const cachedPerms = getPerms();
    if (!force && cachedPerms && permsAreFresh()) {
      setPermState(cachedPerms);
      return { ok: true, source: "cache" };
    }

    // Get all role IDs
    const roleIds = user?.roles?.map((r) => r.id) || [];
    if (!roleIds.length) return { ok: false, reason: "No roleIds on user" };

    try {
      setLoadingPerms(true);

      const results = await Promise.allSettled(
        roleIds.map((id) => http.get(`/roles/${id}`)),
      );

      const mergedPerms = results
        .filter((r) => r.status === "fulfilled")
        .map((r) =>
          normalizePermissions(r.value?.data?.data?.permissions || []),
        )
        .reduce((merged, perms) => {
          Object.keys(perms).forEach((moduleCode) => {
            if (!merged[moduleCode]) {
              merged[moduleCode] = {};
            }
            merged[moduleCode] = {
              ...merged[moduleCode],
              ...perms[moduleCode],
            };
          });
          return merged;
        }, {});

      setPerms(mergedPerms);
      setPermState(mergedPerms);
      return { ok: true, source: "api" };
    } catch (e) {
      clearAuth();
      setUserSession(null);
      setPermState(null);
      return { ok: false, reason: "Permissions API failed" };
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    refreshPermissions({ force: true });
  }, []);

  const value = useMemo(
    () => ({
      userSession,
      setUserSession,
      perms,
      loadingPerms,
      refreshPermissions,
      logout: () => {
        clearAuth();
        setUserSession(null);
        setPermState(null);
      },
    }),
    [userSession, perms, loadingPerms],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
