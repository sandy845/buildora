"use client";

import { useState, useRef, useEffect } from "react";

type FileUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultCategory?: "document" | "blueprint";
  onUploadSuccess: (item: {
    name: string;
    type: string;
    date: string;
    category: "document" | "blueprint";
  }) => void;
};

export function FileUploadModal({
  isOpen,
  onClose,
  projectId,
  defaultCategory = "document",
  onUploadSuccess,
}: FileUploadModalProps) {
  const [category, setCategory] = useState<"document" | "blueprint">(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("specification");
  const [designType, setDesignType] = useState<string>("drawing");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "requesting_url" | "uploading" | "confirming" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setCategory(defaultCategory);
      setFile(null);
      setStatus("idle");
      setProgress(0);
      setErrorMessage("");
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [defaultCategory, isOpen]);

  if (!isOpen) return null;

  function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);
    setErrorMessage("");
    setStatus("idle");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload() {
    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    try {
      setStatus("requesting_url");
      setProgress(10);
      setErrorMessage("");

      // 1. Request presigned upload URL
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSizeBytes: file.size,
          category,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error || "Failed to generate upload URL.");
      }

      // 2. Upload file directly to S3 / Cloudflare R2 presigned URL
      setStatus("uploading");
      setProgress(40);

      const uploadHeaders: Record<string, string> = {
        "Content-Type": file.type || "application/octet-stream",
      };

      const uploadRes = await fetch(presignData.presignedUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Direct storage upload failed. Please try again.");
      }

      // 3. Confirm upload and persist to database
      setStatus("confirming");
      setProgress(85);

      const confirmRes = await fetch("/api/storage/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          key: presignData.key,
          fileName: file.name,
          fileSizeBytes: file.size,
          contentType: file.type || "application/octet-stream",
          category,
          documentType: docType,
          designAssetType: designType,
          description: description.trim() || undefined,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error || "Failed to record upload in project.");
      }

      setProgress(100);
      setStatus("success");

      const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      onUploadSuccess({
        name: file.name,
        type: category === "blueprint" ? designType : docType,
        date: today,
        category,
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred during upload.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e5e2dc] bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9590]">
              Project assets
            </p>
            <h2 id="upload-modal-title" className="mt-1 text-2xl font-semibold text-[#1a1a1a]">
              {category === "blueprint" ? "Upload Blueprint / CAD Drawing" : "Upload Project Document"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-[#9b9590] hover:bg-[#f0ede7] hover:text-[#1a1a1a]"
          >
            ✕
          </button>
        </div>

        {/* Category Switcher */}
        <div className="mt-6 flex rounded-xl bg-[#f8f6f3] p-1">
          <button
            type="button"
            onClick={() => setCategory("document")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              category === "document"
                ? "bg-white text-[#1a1a1a] shadow-xs"
                : "text-[#6b6560] hover:text-[#1a1a1a]"
            }`}
          >
            Client Document
          </button>
          <button
            type="button"
            onClick={() => setCategory("blueprint")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              category === "blueprint"
                ? "bg-white text-[#1a1a1a] shadow-xs"
                : "text-[#6b6560] hover:text-[#1a1a1a]"
            }`}
          >
            Blueprint / CAD Drawing
          </button>
        </div>

        {/* File Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-[#1a1a1a] bg-[#f8f6f3]"
              : file
                ? "border-emerald-500 bg-emerald-50/30"
                : "border-[#d8d3cb] bg-[#faf8f5] hover:border-[#1a1a1a]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={
              category === "blueprint"
                ? ".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.webp,.svg,.cad,.rvt"
                : ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            }
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ede7] text-[#1a1a1a]">
            📁
          </div>

          {file ? (
            <div className="mt-3">
              <p className="font-semibold text-[#1a1a1a]">{file.name}</p>
              <p className="mt-0.5 text-xs text-[#6b6560]">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · Click to replace
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-semibold text-[#1a1a1a]">
                Drop your file here, or <span className="underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-[#9b9590]">
                {category === "blueprint"
                  ? "AutoCAD DWG, DXF, PDF, or high-res renderings (up to 50MB)"
                  : "PDF, Word, Excel, CSV, or contracts (up to 25MB)"}
              </p>
            </div>
          )}
        </div>

        {/* Metadata options */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {category === "blueprint" ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b6560]">
                Drawing Type
              </label>
              <select
                value={designType}
                onChange={(e) => setDesignType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e5e2dc] bg-[#f8f6f3] px-3 py-2.5 text-sm text-[#1a1a1a] outline-hidden focus:border-[#1a1a1a]"
              >
                <option value="drawing">Architectural Drawing</option>
                <option value="floor_plan">Floor Plan</option>
                <option value="rendering">3D Rendering</option>
                <option value="moodboard">Material Moodboard</option>
                <option value="image">Site / Elevation Photo</option>
                <option value="other">Other CAD / Asset</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b6560]">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e5e2dc] bg-[#f8f6f3] px-3 py-2.5 text-sm text-[#1a1a1a] outline-hidden focus:border-[#1a1a1a]"
              >
                <option value="specification">Specification</option>
                <option value="contract">Contract Agreement</option>
                <option value="plan">Approved Plan</option>
                <option value="quotation">Quotation / BOQ</option>
                <option value="invoice">Invoice / Bill</option>
                <option value="receipt">Payment Receipt</option>
                <option value="other">Other Document</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b6560]">
              Notes / Revision
            </label>
            <input
              type="text"
              placeholder="e.g. Rev 2 - Structural signoff"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e5e2dc] bg-[#f8f6f3] px-3 py-2 text-sm text-[#1a1a1a] outline-hidden focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Progress bar */}
        {status !== "idle" && (
          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium text-[#6b6560]">
              <span>
                {status === "requesting_url" && "Authorizing AWS S3 / Cloudflare R2 presigned URL..."}
                {status === "uploading" && "Uploading directly to cloud storage..."}
                {status === "confirming" && "Recording asset in project workspace..."}
                {status === "success" && "Upload complete!"}
                {status === "error" && "Upload failed"}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f0ede7]">
              <div
                className={`h-full transition-all duration-300 ${
                  status === "error" ? "bg-red-500" : "bg-[#1a1a1a]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={status === "uploading" || status === "confirming"}
            className="rounded-full border border-[#e5e2dc] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#f8f6f3] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || status === "uploading" || status === "confirming" || status === "requesting_url"}
            className="rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "uploading"
              ? "Uploading..."
              : status === "confirming"
                ? "Finalizing..."
                : status === "success"
                  ? "Done!"
                  : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}
