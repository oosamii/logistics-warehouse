import React, { useEffect, useRef, useState } from "react";
import http from "@/api/http";
import Pagination from "@/pages/components/Pagination";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const PaginatedEntityDropdown = ({
  endpoint,
  listKey,
  value,
  onChange,
  placeholder = "Select",
  limit = 10,
  disabled = false,
  renderItem,

  query = {},
  enableSearch = false,
  searchParam = "search",
  searchPlaceholder = "Search…",
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit,
  });

  const [search, setSearch] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const wrapRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return;

    const fetchSelected = async () => {
      try {
        const qs = new URLSearchParams();
        const ids = Array.isArray(value) ? value.join(",") : value;
        qs.set("id", ids);

        Object.entries(query || {}).forEach(([k, v]) => {
          if (v != null && v !== "") qs.set(k, String(v));
        });

        const res = await http.get(`${endpoint}?${qs.toString()}`);
        const list =
          res?.data?.data?.[listKey] || res?.data?.[listKey] || res?.data || [];
        if (list.length) {
          setItems((prev) => {
            const prevIds = prev.map((x) => x.id);
            const newItems = list.filter((x) => !prevIds.includes(x.id));
            return [...prev, ...newItems];
          });
        }
      } catch (e) {
        console.error("Failed to fetch selected item", e);
      }
    };

    fetchSelected();
  }, [value, endpoint, JSON.stringify(query)]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const buildUrl = (page) => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));

    // extra query params
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      qs.set(k, String(v));
    });

    // search
    if (enableSearch && search.trim()) {
      qs.set(searchParam, search.trim());
    }

    return `${endpoint}?${qs.toString()}`;
  };

  const loadPage = async (page = 1) => {
    try {
      setLoading(true);

      const res = await http.get(buildUrl(page));
      const list = res?.data?.data?.[listKey] || [];
      const pag = res?.data?.data?.pagination || {};

      setItems(Array.isArray(list) ? list : []);
      setPagination({
        total: pag.total ?? 0,
        page: pag.page ?? page,
        pages: pag.pages ?? 1,
        limit: pag.limit ?? limit,
      });
    } catch (e) {
      setItems([]);
      setPagination({ total: 0, page: 1, pages: 1, limit });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enableSearch) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadPage(1);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, JSON.stringify(query), enableSearch]);

  useEffect(() => {
    if (!open) return;
    if (hasFetched) return;

    loadPage(1).then(() => setHasFetched(true));
  }, [open]);

  const selected = items.find((x) => String(x.id) === String(value));
  const selectedLabel = value
    ? selected
      ? (renderItem?.(selected)?.title ?? `Selected: ${value}`)
      : `Selected: ${value}`
    : placeholder;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm
             flex justify-between items-center
             focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel}
        </span>
        <span className="ml-2 text-gray-400">
          {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
          {enableSearch ? (
            <div className="p-2 border-b border-gray-100">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-3 text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                No records found
              </div>
            ) : (
              items.map((it) => {
                const active = String(it.id) === String(value);
                const view = renderItem?.(it) || {
                  title: String(it.id),
                  subtitle: "",
                };

                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      onChange(String(it.id), it);
                      setOpen(false);
                    }}
                    className={[
                      "w-full px-3 py-2 text-left hover:bg-gray-50",
                      active ? "bg-blue-50" : "",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {view.title}
                    </div>
                    {view.subtitle ? (
                      <div className="text-xs text-gray-500">
                        {view.subtitle}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-200">
            <Pagination
              pagination={pagination}
              onPageChange={(p) => loadPage(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedEntityDropdown;
