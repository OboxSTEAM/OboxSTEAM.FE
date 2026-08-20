"use client";

import { useState } from "react";
import { GraduationCap, Newspaper, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addExpertDegree,
  addExpertPublication,
  deleteExpertDegree,
  deleteExpertPublication,
  updateExpertDegree,
  updateExpertPublication,
  type Expert,
  type ExpertCredentialDrafts,
  type ExpertDegree,
  type ExpertDegreeRequestInput,
  type ExpertPublication,
  type ExpertPublicationRequestInput,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

const INPUT_CLASS =
  "h-10 rounded-lg border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

type ExpertCredentialsEditorProps = {
  expert: Expert | null;
  drafts: ExpertCredentialDrafts;
  onDraftsChange: (drafts: ExpertCredentialDrafts) => void;
  onExpertChange: (expert: Expert) => void;
};

function parseYear(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const year = Number(trimmed);
  return Number.isInteger(year) && year >= 1900 && year <= 2100
    ? year
    : undefined;
}

export function ExpertCredentialsEditor({
  expert,
  drafts,
  onDraftsChange,
  onExpertChange,
}: ExpertCredentialsEditorProps) {
  const [degreeDraft, setDegreeDraft] = useState({
    title: "",
    institution: "",
    year: "",
  });
  const [publicationDraft, setPublicationDraft] = useState({
    title: "",
    venue: "",
    year: "",
    url: "",
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    try {
      await action();
    } finally {
      setBusyKey(null);
    }
  }

  function addDraftDegree() {
    const title = degreeDraft.title.trim();
    const institution = degreeDraft.institution.trim();
    if (!title || !institution) return;
    onDraftsChange({
      ...drafts,
      degrees: [
        ...drafts.degrees,
        {
          title,
          institution,
          year: parseYear(degreeDraft.year),
        },
      ],
    });
    setDegreeDraft({ title: "", institution: "", year: "" });
  }

  function addDraftPublication() {
    const title = publicationDraft.title.trim();
    if (!title) return;
    onDraftsChange({
      ...drafts,
      publications: [
        ...drafts.publications,
        {
          title,
          venue: publicationDraft.venue.trim() || null,
          year: parseYear(publicationDraft.year),
          url: publicationDraft.url.trim() || null,
        },
      ],
    });
    setPublicationDraft({ title: "", venue: "", year: "", url: "" });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <GraduationCap className="size-4 text-primary" />
            Bằng cấp / chứng chỉ
          </h4>
          <span className="text-[11px] font-medium text-muted-foreground">
            {(expert?.degrees.length ?? drafts.degrees.length)} mục
          </span>
        </div>
        <ul className="space-y-2">
          {expert
            ? expert.degrees.map((degree) => (
                <DegreeRow
                  key={degree.id}
                  degree={degree}
                  disabled={busyKey != null}
                  onSave={(input) =>
                    run(`degree-${degree.id}`, async () => {
                      try {
                        const result = await updateExpertDegree(
                          expert.id,
                          degree.id,
                          input,
                        );
                        const next = result?.data;
                        if (!next) return;
                        onExpertChange({
                          ...expert,
                          degrees: expert.degrees.map((item) =>
                            item.id === next.id ? next : item,
                          ),
                        });
                        showAppSuccess({ title: "Đã cập nhật bằng cấp" });
                      } catch (error) {
                        showAppErrorFromUnknown(error, "experts.credentials");
                      }
                    })
                  }
                  onDelete={() =>
                    run(`degree-${degree.id}`, async () => {
                      try {
                        await deleteExpertDegree(expert.id, degree.id);
                        onExpertChange({
                          ...expert,
                          degrees: expert.degrees.filter(
                            (item) => item.id !== degree.id,
                          ),
                        });
                        showAppSuccess({ title: "Đã xóa bằng cấp" });
                      } catch (error) {
                        showAppErrorFromUnknown(error, "experts.credentials");
                      }
                    })
                  }
                />
              ))
            : drafts.degrees.map((degree, index) => (
                <DraftDegreeRow
                  key={`${degree.title}-${index}`}
                  degree={degree}
                  onChange={(next) =>
                    onDraftsChange({
                      ...drafts,
                      degrees: drafts.degrees.map((item, itemIndex) =>
                        itemIndex === index ? next : item,
                      ),
                    })
                  }
                  onDelete={() =>
                    onDraftsChange({
                      ...drafts,
                      degrees: drafts.degrees.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                />
              ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_5.5rem_auto]">
          <Input
            className={INPUT_CLASS}
            placeholder="Học vị / chứng chỉ"
            value={degreeDraft.title}
            onChange={(event) =>
              setDegreeDraft((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <Input
            className={INPUT_CLASS}
            placeholder="Trường / tổ chức"
            value={degreeDraft.institution}
            onChange={(event) =>
              setDegreeDraft((prev) => ({
                ...prev,
                institution: event.target.value,
              }))
            }
          />
          <Input
            className={INPUT_CLASS}
            placeholder="Năm"
            inputMode="numeric"
            value={degreeDraft.year}
            onChange={(event) =>
              setDegreeDraft((prev) => ({ ...prev, year: event.target.value }))
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={busyKey != null}
            className="h-10 rounded-lg"
            onClick={() => {
              if (!expert) {
                addDraftDegree();
                return;
              }
              void run("degree-new", async () => {
                try {
                  const result = await addExpertDegree(expert.id, {
                    title: degreeDraft.title.trim(),
                    institution: degreeDraft.institution.trim(),
                    year: parseYear(degreeDraft.year),
                  });
                  const next = result?.data;
                  if (!next) return;
                  onExpertChange({
                    ...expert,
                    degrees: [...expert.degrees, next],
                  });
                  setDegreeDraft({ title: "", institution: "", year: "" });
                  showAppSuccess({ title: "Đã thêm bằng cấp" });
                } catch (error) {
                  showAppErrorFromUnknown(error, "experts.credentials");
                }
              });
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Newspaper className="size-4 text-primary" />
            Bài báo khoa học
          </h4>
          <span className="text-[11px] font-medium text-muted-foreground">
            {(expert?.publications.length ?? drafts.publications.length)} mục
          </span>
        </div>
        <ul className="space-y-2">
          {expert
            ? expert.publications.map((publication) => (
                <PublicationRow
                  key={publication.id}
                  publication={publication}
                  disabled={busyKey != null}
                  onSave={(input) =>
                    run(`pub-${publication.id}`, async () => {
                      try {
                        const result = await updateExpertPublication(
                          expert.id,
                          publication.id,
                          input,
                        );
                        const next = result?.data;
                        if (!next) return;
                        onExpertChange({
                          ...expert,
                          publications: expert.publications.map((item) =>
                            item.id === next.id ? next : item,
                          ),
                        });
                        showAppSuccess({ title: "Đã cập nhật bài báo" });
                      } catch (error) {
                        showAppErrorFromUnknown(error, "experts.credentials");
                      }
                    })
                  }
                  onDelete={() =>
                    run(`pub-${publication.id}`, async () => {
                      try {
                        await deleteExpertPublication(expert.id, publication.id);
                        onExpertChange({
                          ...expert,
                          publications: expert.publications.filter(
                            (item) => item.id !== publication.id,
                          ),
                        });
                        showAppSuccess({ title: "Đã xóa bài báo" });
                      } catch (error) {
                        showAppErrorFromUnknown(error, "experts.credentials");
                      }
                    })
                  }
                />
              ))
            : drafts.publications.map((publication, index) => (
                <DraftPublicationRow
                  key={`${publication.title}-${index}`}
                  publication={publication}
                  onChange={(next) =>
                    onDraftsChange({
                      ...drafts,
                      publications: drafts.publications.map((item, itemIndex) =>
                        itemIndex === index ? next : item,
                      ),
                    })
                  }
                  onDelete={() =>
                    onDraftsChange({
                      ...drafts,
                      publications: drafts.publications.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                />
              ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            className={INPUT_CLASS}
            placeholder="Tên bài"
            value={publicationDraft.title}
            onChange={(event) =>
              setPublicationDraft((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
          />
          <Input
            className={INPUT_CLASS}
            placeholder="Tạp chí / hội nghị"
            value={publicationDraft.venue}
            onChange={(event) =>
              setPublicationDraft((prev) => ({
                ...prev,
                venue: event.target.value,
              }))
            }
          />
          <Input
            className={INPUT_CLASS}
            placeholder="Năm"
            inputMode="numeric"
            value={publicationDraft.year}
            onChange={(event) =>
              setPublicationDraft((prev) => ({
                ...prev,
                year: event.target.value,
              }))
            }
          />
          <Input
            className={INPUT_CLASS}
            placeholder="https://..."
            value={publicationDraft.url}
            onChange={(event) =>
              setPublicationDraft((prev) => ({
                ...prev,
                url: event.target.value,
              }))
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={busyKey != null}
            className="h-10 rounded-lg sm:col-span-2"
            onClick={() => {
              if (!expert) {
                addDraftPublication();
                return;
              }
              void run("pub-new", async () => {
                try {
                  const result = await addExpertPublication(expert.id, {
                    title: publicationDraft.title.trim(),
                    venue: publicationDraft.venue.trim() || null,
                    year: parseYear(publicationDraft.year),
                    url: publicationDraft.url.trim() || null,
                  });
                  const next = result?.data;
                  if (!next) return;
                  onExpertChange({
                    ...expert,
                    publications: [...expert.publications, next],
                  });
                  setPublicationDraft({
                    title: "",
                    venue: "",
                    year: "",
                    url: "",
                  });
                  showAppSuccess({ title: "Đã thêm bài báo" });
                } catch (error) {
                  showAppErrorFromUnknown(error, "experts.credentials");
                }
              });
            }}
          >
            <Plus className="size-4" />
            Thêm bài báo
          </Button>
        </div>
      </section>
    </div>
  );
}

function DegreeRow({
  degree,
  disabled,
  onSave,
  onDelete,
}: {
  degree: ExpertDegree;
  disabled: boolean;
  onSave: (input: ExpertDegreeRequestInput) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(degree.title);
  const [institution, setInstitution] = useState(degree.institution);
  const [year, setYear] = useState(degree.year?.toString() ?? "");

  function save() {
    const nextYear = parseYear(year) ?? null;
    if (
      title.trim() === degree.title &&
      institution.trim() === degree.institution &&
      nextYear === degree.year
    ) {
      return;
    }
    onSave({
      title: title.trim(),
      institution: institution.trim(),
      year: nextYear ?? undefined,
    });
  }

  return (
    <li className="grid gap-2 rounded-xl border border-border bg-background/60 p-2 sm:grid-cols-[1fr_1fr_5.5rem_auto]">
      <Input
        className={INPUT_CLASS}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <Input
        className={INPUT_CLASS}
        value={institution}
        onChange={(event) => setInstitution(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <Input
        className={INPUT_CLASS}
        value={year}
        onChange={(event) => setYear(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        onClick={onDelete}
        aria-label="Xóa bằng cấp"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function DraftDegreeRow({
  degree,
  onChange,
  onDelete,
}: {
  degree: ExpertDegreeRequestInput;
  onChange: (degree: ExpertDegreeRequestInput) => void;
  onDelete: () => void;
}) {
  return (
    <li className="grid gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-2 sm:grid-cols-[1fr_1fr_5.5rem_auto]">
      <Input
        className={INPUT_CLASS}
        value={degree.title}
        onChange={(event) =>
          onChange({ ...degree, title: event.target.value })
        }
      />
      <Input
        className={INPUT_CLASS}
        value={degree.institution}
        onChange={(event) =>
          onChange({ ...degree, institution: event.target.value })
        }
      />
      <Input
        className={INPUT_CLASS}
        value={degree.year?.toString() ?? ""}
        onChange={(event) =>
          onChange({ ...degree, year: parseYear(event.target.value) })
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Xóa bằng cấp nháp"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function PublicationRow({
  publication,
  disabled,
  onSave,
  onDelete,
}: {
  publication: ExpertPublication;
  disabled: boolean;
  onSave: (input: ExpertPublicationRequestInput) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(publication.title);
  const [venue, setVenue] = useState(publication.venue);
  const [year, setYear] = useState(publication.year?.toString() ?? "");
  const [url, setUrl] = useState(publication.url);

  function save() {
    const nextYear = parseYear(year) ?? null;
    const nextVenue = venue.trim();
    const nextUrl = url.trim();
    if (
      title.trim() === publication.title &&
      nextVenue === publication.venue &&
      nextYear === publication.year &&
      nextUrl === publication.url
    ) {
      return;
    }
    onSave({
      title: title.trim(),
      venue: nextVenue || null,
      year: nextYear ?? undefined,
      url: nextUrl || null,
    });
  }

  return (
    <li className="grid gap-2 rounded-xl border border-border bg-background/60 p-2 sm:grid-cols-2">
      <Input
        className={INPUT_CLASS}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <Input
        className={INPUT_CLASS}
        value={venue}
        onChange={(event) => setVenue(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <Input
        className={INPUT_CLASS}
        value={year}
        onChange={(event) => setYear(event.target.value)}
        onBlur={save}
        disabled={disabled}
      />
      <div className="flex gap-2">
        <Input
          className={INPUT_CLASS}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onBlur={save}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          onClick={onDelete}
          aria-label="Xóa bài báo"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

function DraftPublicationRow({
  publication,
  onChange,
  onDelete,
}: {
  publication: ExpertPublicationRequestInput;
  onChange: (publication: ExpertPublicationRequestInput) => void;
  onDelete: () => void;
}) {
  return (
    <li className="grid gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-2 sm:grid-cols-2">
      <Input
        className={INPUT_CLASS}
        value={publication.title}
        onChange={(event) =>
          onChange({ ...publication, title: event.target.value })
        }
      />
      <Input
        className={INPUT_CLASS}
        value={publication.venue ?? ""}
        onChange={(event) =>
          onChange({ ...publication, venue: event.target.value || null })
        }
      />
      <Input
        className={INPUT_CLASS}
        value={publication.year?.toString() ?? ""}
        onChange={(event) =>
          onChange({ ...publication, year: parseYear(event.target.value) })
        }
      />
      <div className="flex gap-2">
        <Input
          className={INPUT_CLASS}
          value={publication.url ?? ""}
          onChange={(event) =>
            onChange({ ...publication, url: event.target.value || null })
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Xóa bài báo nháp"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
