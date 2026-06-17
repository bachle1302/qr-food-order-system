"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Copy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminTable } from "../types";

type TableQrDialogProps = {
  table: AdminTable;
  qrUrl: string;
  onClose: () => void;
  onCopy: () => Promise<void> | void;
};

function sanitizeFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "table";
}

export function TableQrDialog({
  table,
  qrUrl,
  onClose,
  onCopy,
}: TableQrDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Không thể tạo mã QR.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [qrUrl]);

  function handleDownload() {
    if (!qrDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${sanitizeFileName(table.name)}.png`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md border-y border-gray-200 bg-gray-50 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              QR code {table.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Khách quét mã này để mở trang đặt món của bàn.
            </p>
          </div>
          <Button
            aria-label="Dong QR dialog"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <X />
          </Button>
        </div>

        <div className="mt-4 border-y border-gray-200 py-4 dark:border-slate-800">
          {qrDataUrl ? (
            <Image
              alt={`QR code ${table.name}`}
              className="mx-auto aspect-square w-full max-w-72 rounded-md"
              height={320}
              unoptimized
              width={320}
              src={qrDataUrl}
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center border-y border-dashed border-gray-200 text-sm text-muted-foreground dark:border-slate-800">
              {error ?? "Dang tao QR code..."}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-1 text-sm">
          <span className="text-muted-foreground">QR link</span>
          <code className="break-all rounded-md border border-border bg-muted px-2 py-2 text-xs text-foreground">
            {qrUrl}
          </code>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onCopy} type="button" variant="outline">
            <Copy />
            Copy link
          </Button>
          <Button
            disabled={!qrDataUrl}
            onClick={handleDownload}
            type="button"
            variant="outline"
          >
            <Download />
            Download PNG
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Có thể in mã này và dán lên bàn. QR chỉ chứa link public, không chứa
          secret backend.
        </p>
      </section>
    </div>
  );
}
