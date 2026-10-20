"use client";

import {
  ANNOUNCEMENT_MAX_LENGTH,
  ANNOUNCEMENT_MAX_MESSAGES,
  type AnnouncementSettings,
} from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { AnnouncementMarquee } from "@/components/store/announcement-marquee";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  announcementKeys,
  announcementsFormSchema,
  getAnnouncements,
  saveAnnouncements,
} from "@/lib/admin/announcements";
import { notifyError } from "@/lib/admin/errors";
import { toApiError } from "@/lib/api";

interface Line {
  id: number;
  text: string;
}

function AnnouncementsForm({
  settings,
}: Readonly<{ settings: AnnouncementSettings }>) {
  const queryClient = useQueryClient();
  const nextId = useRef(settings.messages.length);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [lines, setLines] = useState<Line[]>(() =>
    settings.messages.length > 0
      ? settings.messages.map((text, id) => ({ id, text }))
      : [{ id: nextId.current++, text: "" }],
  );
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: saveAnnouncements,
    onSuccess: (saved) => {
      queryClient.setQueryData(announcementKeys.all, saved);
      toast.success(
        saved.enabled ? "Announcements are live" : "Announcements saved",
      );
    },
    onError: notifyError,
  });

  const filled = lines.filter((line) => line.text.trim() !== "");
  const preview = filled.map((line) => line.text.trim());

  function update(id: number, text: string) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, text } : line)),
    );
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setFormError(null);
  }

  function add() {
    setLines((current) => [...current, { id: nextId.current++, text: "" }]);
  }

  function remove(id: number) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  function move(index: number, offset: number) {
    setLines((current) => {
      const next = [...current];
      const [line] = next.splice(index, 1);
      if (line) next.splice(index + offset, 0, line);
      return next;
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = announcementsFormSchema.safeParse({
      enabled,
      messages: filled.map((line) => line.text),
    });
    if (!parsed.success) {
      const next: Record<number, string> = {};
      let general: string | null = null;
      for (const issue of parsed.error.issues) {
        const index = issue.path[1];
        const line = typeof index === "number" ? filled[index] : undefined;
        if (line) {
          next[line.id] ??= issue.message;
        } else {
          general ??= issue.message;
        }
      }
      setErrors(next);
      setFormError(general);
      toast.error("Check the highlighted fields");
      return;
    }
    setErrors({});
    setFormError(null);
    save.mutate(parsed.data);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-3xl flex-col gap-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {enabled
              ? "This scrolls across the top of every store page."
              : "The bar is off. Customers will not see it until you turn it on."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preview.length > 0 ? (
            <AnnouncementMarquee messages={preview} className="rounded-sm" />
          ) : (
            <p className="text-muted-foreground text-small">
              Write a message below to see the preview.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Short lines like free delivery offers, new arrivals or holiday
            hours. Up to {ANNOUNCEMENT_MAX_MESSAGES} messages, shown in this
            order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <Switch
                id="announcementsEnabled"
                checked={enabled}
                onCheckedChange={(value) => {
                  setEnabled(value);
                  setFormError(null);
                }}
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="announcementsEnabled">
                  Show the announcement bar
                </FieldLabel>
                <FieldDescription>
                  Turn it off to hide the bar without losing your messages.
                </FieldDescription>
              </div>
            </Field>
            {lines.map((line, index) => {
              const error = errors[line.id];
              const inputId = `announcement-${line.id}`;
              return (
                <Field key={line.id} data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor={inputId}>Message {index + 1}</FieldLabel>
                  <div className="flex items-center gap-1">
                    <Input
                      id={inputId}
                      value={line.text}
                      maxLength={ANNOUNCEMENT_MAX_LENGTH}
                      placeholder="Free delivery in Ibadan on orders over ₦100,000"
                      onChange={(event) => update(line.id, event.target.value)}
                      aria-invalid={error ? true : undefined}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move message ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move message ${index + 1} down`}
                      disabled={index === lines.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove message ${index + 1}`}
                      onClick={() => remove(line.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <FieldDescription>
                    {line.text.trim().length} of {ANNOUNCEMENT_MAX_LENGTH}{" "}
                    characters
                  </FieldDescription>
                  <FieldError>{error}</FieldError>
                </Field>
              );
            })}
            {formError ? (
              <p role="alert" className="text-destructive text-small">
                {formError}
              </p>
            ) : null}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={add}
                disabled={lines.length >= ANNOUNCEMENT_MAX_MESSAGES}
              >
                <PlusIcon data-icon="inline-start" />
                Add message
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? "Saving" : "Save announcements"}
        </Button>
      </div>
    </form>
  );
}

export function AnnouncementsView() {
  const announcements = useQuery({
    queryKey: announcementKeys.all,
    queryFn: getAnnouncements,
  });
  return (
    <>
      <PageHeader
        title="Announcements"
        description="The scrolling bar at the top of your store."
      />
      {announcements.isError ? (
        <Alert>
          <AlertTitle>Could not load announcements</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(announcements.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => announcements.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : announcements.data ? (
        <AnnouncementsForm
          key={JSON.stringify(announcements.data)}
          settings={announcements.data}
        />
      ) : (
        <Skeleton className="h-96 max-w-3xl rounded-md" />
      )}
    </>
  );
}
