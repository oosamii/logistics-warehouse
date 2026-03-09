// src/pages/outbound/components/detailpagetabs/DocumentsTab.jsx
import React, { useMemo } from "react";
import {
  Download,
  UploadCloud,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

const FileTypeIcon = ({ type }) => {
  const isImage =
    type.toLowerCase().includes("spec") || type.toLowerCase().includes("image");
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className="h-9 w-9 rounded-md bg-red-50 text-red-500 flex items-center justify-center">
      <Icon size={18} />
    </div>
  );
};

const Avatar = ({ name }) => {
  const initials = (name || "User")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
};

const DocumentsTab = ({
  onDownloadAll,
  onUpload,
  onView,
  onDownload,
  onDelete,
}) => {
  const rows = useMemo(
    () => [
      {
        id: "1",
        type: "Customer PO",
        fileName: "PO-ACME-2023-089.pdf",
        uploadedBy: "System Admin",
        uploadedTime: "Oct 24, 2023 09:15 AM",
        status: "ready",
      },
      {
        id: "2",
        type: "Product Spec Sheet",
        fileName: "spec_sheet_v2.png",
        uploadedBy: "Sarah Jenkins",
        uploadedTime: "Oct 24, 2023 10:30 AM",
        status: "ready",
      },
      {
        id: "3",
        type: "Shipping Label (Pending)",
        fileName: "Waiting for packing...",
        uploadedBy: "--",
        uploadedTime: "--",
        status: "pending",
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Order Documents
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Manage invoices, labels, and related files.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* <button
            type="button"
            onClick={onDownloadAll}
            className="px-4 py-2 border rounded-md text-sm bg-white inline-flex items-center gap-2"
          >
            <Download size={16} />
            Download All
          </button> */}

          <button
            type="button"
            onClick={onUpload}
            className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white inline-flex items-center gap-2"
          >
            <UploadCloud size={16} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-white">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">File Name</th>
                <th className="px-4 py-3 font-medium">Uploaded By</th>
                <th className="px-4 py-3 font-medium">Uploaded Time</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <FileTypeIcon type={r.type} />
                      <div className="text-sm font-medium text-gray-900">
                        {r.type}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div
                      className={[
                        "text-sm",
                        r.status === "pending"
                          ? "text-gray-400"
                          : "text-gray-900",
                      ].join(" ")}
                    >
                      {r.fileName}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {r.uploadedBy === "--" ? (
                      <div className="text-sm text-gray-400">--</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Avatar name={r.uploadedBy} />
                        <div className="text-sm text-gray-900">
                          {r.uploadedBy}
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-700">
                      {r.uploadedTime}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => onView?.(r)}
                        className={[
                          "text-gray-500 hover:text-gray-800",
                          r.status === "pending"
                            ? "opacity-40 pointer-events-none"
                            : "",
                        ].join(" ")}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>

                      {/* <button
                        type="button"
                        onClick={() => onDownload?.(r)}
                        className={[
                          "text-gray-500 hover:text-gray-800",
                          r.status === "pending"
                            ? "opacity-40 pointer-events-none"
                            : "",
                        ].join(" ")}
                        title="Download"
                      >
                        <Download size={16} />
                      </button> */}

                      <button
                        type="button"
                        onClick={() => onDelete?.(r)}
                        className={[
                          "text-red-500 hover:text-red-700",
                          r.status === "pending"
                            ? "opacity-40 pointer-events-none"
                            : "",
                        ].join(" ")}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
