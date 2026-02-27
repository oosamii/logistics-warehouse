import { Bell, Search } from "lucide-react";
import { useAuth } from "../utils/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import http from "../../api/http";

const ROUTE_MAP = {
  "/billing/invoice": "/billing?tab=invoiced",
  "/inventory/holds": "/inventory",
};

const resolveRoute = (route) => {
  if (!route) return "/";
  return ROUTE_MAP[route] || route;
};

const Header = () => {
  const { userSession } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  const typingTimerRef = useRef(null);
  const abortRef = useRef(null);
  const cacheRef = useRef(new Map());

  if (!userSession) return <></>;

  useEffect(() => {
    const query = searchTerm.trim();
    setSearchErr("");

    if (query.length < 2) {
      setSearchResults(null);
      setShowDropdown(false);
      setIsTyping(false);
      setIsSearching(false);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    setIsTyping(true);
    setShowDropdown(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(async () => {
      setIsTyping(false);

      const normalized = query.toLowerCase();

      if (cacheRef.current.has(normalized)) {
        setSearchResults(cacheRef.current.get(normalized));
        setIsSearching(false);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsSearching(true);

      try {
        const res = await http.get(`/search`, {
          params: { q: query, limit: 5 },
          signal: abortRef.current.signal,
        });

        const results = res?.data?.results || {};
        cacheRef.current.set(normalized, results);

        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
          return;
        console.error("Search error:", err);
        setSearchErr("Search failed. Try again.");
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const statusText = useMemo(() => {
    if (searchTerm.trim().length < 2) return "";
    if (isTyping) return "Typing…";
    if (isSearching) return "Searching…";
    if (searchErr) return searchErr;
    return "";
  }, [searchTerm, isTyping, isSearching, searchErr]);

  const getUserInitials = () => {
    const firstName = userSession.first_name || "";
    const lastName = userSession.last_name || "";
    const initials =
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || userSession.username?.charAt(0).toUpperCase() || "U";
  };

  const getUsername = () => userSession.username || "User";

  const getUserRole = () => userSession.roles?.[0]?.role_name || "";

  const getProfileImage = () =>
    userSession.profile_image ||
    userSession.avatar_url ||
    userSession.profile_picture ||
    null;

  const onSelectItem = (item) => {
    if (!item?.route) return;
    navigate(resolveRoute(item.route));
    setShowDropdown(false);
    setSearchTerm("");
    setSearchResults(null);
  };

  const hasAnyResults =
    searchResults &&
    Object.values(searchResults).some((g) => (g?.items || []).length > 0);

  return (
    <header className="w-full bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <div className="font-semibold text-gray-900">Dashboard</div>
          <div className="text-xs text-gray-500">
            Welcome back, {getUsername()}
          </div>
        </div>
        <div className="md:hidden">
          <div className="font-semibold text-gray-900">Dashboard</div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim().length >= 2) setShowDropdown(true);
            }}
            placeholder="Search SKU, Order, GRN, Pallet..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {(isTyping || isSearching) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}

          {showDropdown && (statusText || searchResults) && (
            <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg overflow-hidden">
              {statusText && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                  {statusText}
                </div>
              )}

              {hasAnyResults ? (
                <div className="max-h-96 overflow-y-auto">
                  {Object.values(searchResults).map((group) => {
                    const items = group?.items || [];
                    if (items.length === 0) return null;

                    return (
                      <div
                        key={group.key}
                        className="border-b last:border-none"
                      >
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                          {group.label}
                        </div>

                        {items.map((item, idx) => (
                          <button
                            key={`${group.key}-${idx}`}
                            type="button"
                            onClick={() => onSelectItem(item)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            <div className="font-medium">{item.display}</div>
                            {item.subtitle && (
                              <div className="text-xs text-gray-500">
                                {item.subtitle}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                !isTyping &&
                !isSearching &&
                searchTerm.trim().length >= 2 && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No results
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div
            onClick={() => navigate("/setting")}
            className="relative cursor-pointer"
          >
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt={getUsername()}
                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                {getUserInitials()}
              </div>
            )}
          </div>

          <div className="hidden md:block text-right">
            <div className="font-medium text-gray-900">{getUsername()}</div>
            <div className="text-xs text-gray-500">{getUserRole()}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
