"use client";

import type { ImportResult, ProductCsvRow } from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categoryKeys } from "@/lib/admin/categories";
import {
  downloadTemplate,
  importProducts,
  parseProductsCsv,
} from "@/lib/admin/csv";
import { notifyError } from "@/lib/admin/errors";
import { productKeys } from "@/lib/admin/products";
import { statsKeys } from "@/lib/admin/stats";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 100;

const ACTION_LABEL = {
  create: "New",
  update: "Update",
  error: "Skipped",
} as const;

export function ImportProductsDialog() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ProductCsvRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);

  function reset() {
    setRows(null);
    setFileName("");
    setParseError(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const check = useMutation({
    mutationFn: (parsed: ProductCsvRow[]) => importProducts(parsed, true),
    onSuccess: setPreview,
    onError: notifyError,
  });

  const apply = useMutation({
    mutationFn: (parsed: ProductCsvRow[]) => importProducts(parsed, false),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
      ]);
      const { create, update, error } = result.summary;
      toast.success(
        `Imported ${create + update} products (${create} new, ${update} updated)${error ? `, ${error} skipped` : ""}`,
      );
      setOpen(false);
      reset();
    },
    onError: notifyError,
  });

  async function onFile(file: File | undefined) {
    reset();
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = await parseProductsCsv(file);
      setRows(parsed);
      check.mutate(parsed);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Could not read this file",
      );
    }
  }

  const importable =
    (preview?.summary.create ?? 0) + (preview?.summary.update ?? 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <UploadIcon data-icon="inline-start" />
        Import
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            Upload a CSV. Rows with a matching SKU update that product, and the
            rest are added. You see a preview before anything changes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Choose CSV file
          </Button>
          <Button type="button" variant="ghost" onClick={downloadTemplate}>
            <DownloadIcon data-icon="inline-start" />
            Download template
          </Button>
          {fileName ? (
            <span className="text-muted-foreground truncate text-sm">
              {fileName}
            </span>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            aria-label="Choose CSV file"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </div>

        {parseError ? (
          <Alert>
            <AlertTitle>That file did not work</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        ) : null}

        {check.isPending ? (
          <p className="text-muted-foreground">Checking your file</p>
        ) : null}

        {preview ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{preview.summary.create} new</Badge>
              <Badge variant="secondary">
                {preview.summary.update} to update
              </Badge>
              <Badge
                variant="outline"
                className={preview.summary.error ? "text-destructive" : ""}
              >
                {preview.summary.error} skipped
              </Badge>
            </div>
            {preview.createdCategories.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                New categories will be created:{" "}
                {preview.createdCategories.join(", ")}.
              </p>
            ) : null}
            <div className="border-border max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, PREVIEW_LIMIT).map((row) => (
                    <tr
                      key={row.line}
                      className="border-border border-t align-top"
                    >
                      <td className="price px-3 py-2">{row.line}</td>
                      <td className="px-3 py-2">
                        <span className="font-bold">
                          {row.name || "(no name)"}
                        </span>
                        {row.sku ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {row.sku}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2",
                          row.action === "error" && "text-destructive",
                        )}
                      >
                        {ACTION_LABEL[row.action]}
                        {row.messages.map((message) => (
                          <span key={message} className="block text-sm">
                            {message}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > PREVIEW_LIMIT ? (
              <p className="text-muted-foreground text-sm">
                Showing the first {PREVIEW_LIMIT} of {preview.rows.length} rows.
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!rows || importable === 0 || apply.isPending}
            onClick={() => rows && apply.mutate(rows)}
          >
            {apply.isPending
              ? "Importing"
              : importable > 0
                ? `Import ${importable} products`
                : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
