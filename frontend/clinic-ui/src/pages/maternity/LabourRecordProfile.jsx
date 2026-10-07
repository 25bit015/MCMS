import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  HeartPulse,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import api from "../../services/api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") return "Active";
  if (normalized === "COMPLETED") return "Completed";
  if (normalized === "ARCHIVED") return "Archived";

  return status || "—";
}

function statusClasses(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ARCHIVED") {
    return "border-white/40 bg-white/20 text-white";
  }

  if (normalized === "COMPLETED") {
    return "border-white/40 bg-white/15 text-white";
  }

  return "border-emerald-200 bg-emerald-100 text-emerald-800";
}

function labourStageLabel(value) {
  const labels = {
    FIRST_STAGE: "First Stage",
    SECOND_STAGE: "Second Stage",
    THIRD_STAGE: "Third Stage",
    FOURTH_STAGE: "Fourth Stage",
    COMPLETED: "Completed",
  };

  return labels[value] || value || "—";
}

function deliveryModeLabel(value) {
  const labels = {
    SVD: "Spontaneous Vaginal Delivery",
    NORMAL: "Normal Vaginal Delivery",
    C_SECTION: "Caesarean Section",
    ASSISTED: "Assisted Vaginal Delivery",
    VACUUM: "Vacuum Delivery",
    FORCEPS: "Forceps Delivery",
  };

  return labels[value] || value || "—";
}

function newbornSexLabel(value) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";

  return value || "—";
}

function newbornOutcomeLabel(value) {
  const normalized = String(value || "").toUpperCase();

  const labels = {
    ALIVE: "Alive",
    STABLE: "Stable",
    REFERRED: "Referred",
    DECEASED: "Deceased",
    STILLBIRTH: "Stillbirth",
  };

  return labels[normalized] || value || "—";
}

function InfoItem({
  label,
  value,
  tone = "slate",
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-slate-50/70",
    blue: "border-blue-100 bg-blue-50/60",
    rose: "border-rose-100 bg-rose-50/60",
    green: "border-emerald-100 bg-emerald-50/60",
    orange: "border-orange-100 bg-orange-50/60",
    purple: "border-purple-100 bg-purple-50/60",
    amber: "border-amber-100 bg-amber-50/60",
  };

  const labelClasses = {
    slate: "text-slate-400",
    blue: "text-blue-500",
    rose: "text-rose-500",
    green: "text-emerald-600",
    orange: "text-orange-500",
    purple: "text-purple-500",
    amber: "text-amber-600",
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        toneClasses[tone] || toneClasses.slate
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.08em] ${
          labelClasses[tone] || labelClasses.slate
        }`}
      >
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-bold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  tone = "rose",
}) {
  const themes = {
    rose: {
      wrapper: "border-rose-100",
      header: "from-rose-50 via-white to-pink-50",
      icon: "bg-rose-100 text-rose-600 ring-rose-200",
      line: "bg-rose-500",
    },
    blue: {
      wrapper: "border-blue-100",
      header: "from-blue-50 via-white to-sky-50",
      icon: "bg-blue-100 text-blue-600 ring-blue-200",
      line: "bg-blue-500",
    },
    green: {
      wrapper: "border-emerald-100",
      header: "from-emerald-50 via-white to-green-50",
      icon: "bg-emerald-100 text-emerald-600 ring-emerald-200",
      line: "bg-emerald-500",
    },
    orange: {
      wrapper: "border-orange-100",
      header: "from-orange-50 via-white to-amber-50",
      icon: "bg-orange-100 text-orange-600 ring-orange-200",
      line: "bg-orange-500",
    },
    purple: {
      wrapper: "border-purple-100",
      header: "from-purple-50 via-white to-violet-50",
      icon: "bg-purple-100 text-purple-600 ring-purple-200",
      line: "bg-purple-500",
    },
    slate: {
      wrapper: "border-slate-200",
      header: "from-slate-50 via-white to-slate-100",
      icon: "bg-slate-100 text-slate-600 ring-slate-200",
      line: "bg-slate-500",
    },
    amber: {
      wrapper: "border-amber-100",
      header: "from-amber-50 via-white to-yellow-50",
      icon: "bg-amber-100 text-amber-600 ring-amber-200",
      line: "bg-amber-500",
    },
  };

  const theme = themes[tone] || themes.rose;

  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition duration-300 hover:shadow-md ${theme.wrapper}`}
    >
      <div
        className={`relative border-b border-slate-100 bg-gradient-to-r px-5 py-4 ${theme.header}`}
      >
        <div
          className={`absolute bottom-0 left-0 top-0 w-1 ${theme.line}`}
        />

        <div className="flex items-start gap-3 pl-1">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${theme.icon}`}
          >
            <Icon size={21} />
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function TextBlock({
  label,
  value,
  tone = "slate",
}) {
  const classes = {
    slate: "border-slate-200 bg-slate-50/70",
    blue: "border-blue-100 bg-blue-50/50",
    rose: "border-rose-100 bg-rose-50/50",
    green: "border-emerald-100 bg-emerald-50/50",
    orange: "border-orange-100 bg-orange-50/50",
    purple: "border-purple-100 bg-purple-50/50",
    amber: "border-amber-100 bg-amber-50/50",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        classes[tone] || classes.slate
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function NewbornCard({ newborn }) {
  const isArchived =
    String(newborn?.recordStatus || "").toUpperCase() ===
    "ARCHIVED";

  const outcomeNormalized = String(
    newborn?.newbornOutcome || ""
  ).toUpperCase();

  const outcomeIsGood = ["ALIVE", "STABLE"].includes(
    outcomeNormalized
  );

  return (
    <div className="group overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg">
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-blue-50 p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-pink-200/30 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 ring-1 ring-pink-200">
              <Baby size={23} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-pink-500">
                Newborn Record
              </p>

              <h3 className="mt-0.5 text-lg font-black text-slate-900">
                Baby #{newborn.id}
              </h3>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
              isArchived
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isArchived ? (
              <Lock size={12} />
            ) : (
              <CheckCircle2 size={12} />
            )}

            {statusLabel(newborn.recordStatus)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Sex"
            value={newbornSexLabel(newborn.sex)}
            tone="rose"
          />

          <InfoItem
            label="Birth Order"
            value={
              newborn.birthOrder != null
                ? `Baby ${newborn.birthOrder}`
                : "—"
            }
            tone="purple"
          />

          <InfoItem
            label="Date of Birth"
            value={formatDate(newborn.dateOfBirth)}
            tone="blue"
          />

          <InfoItem
            label="Time of Birth"
            value={newborn.timeOfBirth}
            tone="blue"
          />

          <InfoItem
            label="Birth Weight"
            value={
              newborn.birthWeight != null
                ? `${newborn.birthWeight} kg`
                : "—"
            }
            tone="green"
          />

          <InfoItem
            label="Outcome"
            value={newbornOutcomeLabel(newborn.newbornOutcome)}
            tone={outcomeIsGood ? "green" : "orange"}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
          <div className="flex items-center gap-2">
            <HeartPulse size={17} className="text-purple-600" />

            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-purple-500">
              APGAR Score
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-purple-100">
              <p className="text-[10px] font-bold text-slate-400">
                1 MIN
              </p>

              <p className="mt-1 text-lg font-black text-purple-700">
                {newborn.apgarOneMinute ?? "—"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-purple-100">
              <p className="text-[10px] font-bold text-slate-400">
                5 MIN
              </p>

              <p className="mt-1 text-lg font-black text-purple-700">
                {newborn.apgarFiveMinutes ?? "—"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-purple-100">
              <p className="text-[10px] font-bold text-slate-400">
                10 MIN
              </p>

              <p className="mt-1 text-lg font-black text-purple-700">
                {newborn.apgarTenMinutes ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {newborn.placeOfCare && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Stethoscope
              size={16}
              className="shrink-0 text-slate-500"
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Place of Care
              </p>

              <p className="text-sm font-bold text-slate-700">
                {newborn.placeOfCare}
              </p>
            </div>
          </div>
        )}

        {isArchived && newborn.archiveReason && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Lock
                size={16}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  Archive Reason
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  {newborn.archiveReason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/maternity/newborn-records/${newborn.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            <Eye size={17} />
            Angalia Profile
          </Link>

          {!isArchived && (
            <Link
              to={`/maternity/newborn-records/${newborn.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-black text-purple-700 transition hover:bg-purple-100"
            >
              <Edit3 size={17} />
              Hariri
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabourRecordProfile() {
  const { id } = useParams();

  const [record, setRecord] = useState(null);
  const [newborns, setNewborns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingNewborns, setLoadingNewborns] = useState(true);

  const [error, setError] = useState("");
  const [newbornError, setNewbornError] = useState("");

  const [archiving, setArchiving] = useState(false);

  const [archiveModalOpen, setArchiveModalOpen] =
    useState(false);

  const [archiveReason, setArchiveReason] = useState("");

  const [archiveValidationError, setArchiveValidationError] =
    useState("");

  async function loadRecord() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/maternity/labour-records/${id}`
      );

      setRecord(response.data);
    } catch (err) {
      console.error("Failed to load Labour record:", err);

      setError(
        err.response?.data?.message ||
          "Imeshindikana kupakia taarifa za Labour Record."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadNewborns() {
    try {
      setLoadingNewborns(true);
      setNewbornError("");

      const response = await api.get(
        `/maternity/newborn-records/labour/${id}`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setNewborns(data);
    } catch (err) {
      console.error("Failed to load newborn records:", err);

      setNewbornError(
        err.response?.data?.message ||
          "Imeshindikana kupakia taarifa za watoto waliozaliwa."
      );
    } finally {
      setLoadingNewborns(false);
    }
  }

  useEffect(() => {
    loadRecord();
    loadNewborns();
  }, [id]);

  const recordStatus = useMemo(
    () => String(record?.recordStatus || "").toUpperCase(),
    [record]
  );

  const isArchived = recordStatus === "ARCHIVED";
  const isCompleted = recordStatus === "COMPLETED";
  const isActive = recordStatus === "ACTIVE";

  /*
   * Labour lifecycle:
   *
   * ACTIVE
   *   - can edit
   *   - can archive
   *   - can register newborn
   *
   * COMPLETED
   *   - read-only labour/delivery data
   *   - cannot edit
   *   - cannot archive from the normal profile action area
   *   - newborn registration remains allowed
   *
   * ARCHIVED
   *   - historical/read-only
   *   - cannot edit
   *   - cannot archive again
   *   - cannot register newborn
   */
  const canEdit = isActive;
  const canArchive = isActive;
  const canRegisterNewborn = !isArchived;

  const activeNewbornsCount = useMemo(
    () =>
      newborns.filter(
        (newborn) =>
          String(newborn?.recordStatus || "").toUpperCase() ===
          "ACTIVE"
      ).length,
    [newborns]
  );

  function openArchiveModal() {
    if (!record || !canArchive || archiving) return;

    setArchiveReason("");
    setArchiveValidationError("");
    setArchiveModalOpen(true);
  }

  function closeArchiveModal() {
    if (archiving) return;

    setArchiveModalOpen(false);
    setArchiveReason("");
    setArchiveValidationError("");
  }

  async function handleArchive() {
    if (!record || !canArchive || archiving) return;

    const trimmedReason = archiveReason.trim();

    if (!trimmedReason) {
      setArchiveValidationError(
        "Tafadhali weka sababu ya ku-archive Labour Record."
      );
      return;
    }

    try {
      setArchiving(true);
      setError("");
      setArchiveValidationError("");

      await api.put(
        `/maternity/labour-records/${record.id}/archive`,
        null,
        {
          params: {
            reason: trimmedReason,
          },
        }
      );

      setArchiveModalOpen(false);
      setArchiveReason("");
      setArchiveValidationError("");

      await loadRecord();
    } catch (err) {
      console.error("Failed to archive Labour record:", err);

      setError(
        err.response?.data?.message ||
          "Imeshindikana ku-archive Labour Record."
      );
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
              <Loader2
                className="animate-spin text-rose-600"
                size={28}
              />
            </div>

            <p className="text-sm font-semibold text-slate-600">
              Inapakia taarifa za Labour Record...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="min-h-[70vh] bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/maternity/labour-records"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-rose-600"
          >
            <ArrowLeft size={17} />
            Rudi Labour Records
          </Link>

          <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="font-black text-red-800">
                    Imeshindikana kupakia taarifa
                  </h2>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/30 to-rose-50/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-900 to-rose-800 text-white shadow-xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Link
                  to="/maternity/labour-records"
                  className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/20"
                  title="Rudi Labour Records"
                >
                  <ArrowLeft size={20} />
                </Link>

                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      <HeartPulse size={14} />
                      Labour & Delivery
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${statusClasses(
                        record.recordStatus
                      )}`}
                    >
                      {isArchived ? (
                        <Lock size={13} />
                      ) : isCompleted ? (
                        <ShieldCheck size={13} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}

                      {statusLabel(record.recordStatus)}
                    </span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Labour Record #{record.id}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                    Taarifa kamili za labour, maternal assessment,
                    fetal assessment na delivery ya mgonjwa.
                  </p>

                  {isActive && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-blue-50 backdrop-blur">
                      <HeartPulse size={14} />
                      Labour & Delivery inaendelea. Taarifa bado
                      zinaweza kuhaririwa.
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-blue-50 backdrop-blur">
                      <Lock size={14} />
                      Labour & Delivery imekamilika. Taarifa za labour
                      ni read-only.
                    </div>
                  )}

                  {isArchived && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-blue-50 backdrop-blur">
                      <Lock size={14} />
                      Labour Record hii ni historical record na
                      imefungwa kwa ajili ya audit.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {canEdit && (
                  <Link
                    to={`/maternity/labour-records/${record.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-rose-50"
                  >
                    <Edit3 size={17} />
                    Hariri
                  </Link>
                )}

                {canArchive && (
                  <button
                    type="button"
                    onClick={openArchiveModal}
                    disabled={archiving}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {archiving ? (
                      <Loader2
                        className="animate-spin"
                        size={17}
                      />
                    ) : (
                      <Lock size={17} />
                    )}

                    Archive
                  </button>
                )}
              </div>
            </div>

            {/* Header mini summary */}
            <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Patient
                </p>

                <p className="mt-1 truncate text-sm font-black">
                  {record.patientName || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Patient Number
                </p>

                <p className="mt-1 text-sm font-black">
                  {record.patientNumber || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Pregnancy
                </p>

                <p className="mt-1 text-sm font-black">
                  #{record.pregnancyId}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Admission
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatDate(record.admissionDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 shrink-0 text-red-600"
                size={19}
              />

              <span className="text-sm font-semibold text-red-700">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Patient + Admission */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            icon={UserRound}
            title="Taarifa za Mgonjwa"
            subtitle="Patient information"
            tone="blue"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Jina la Mgonjwa"
                value={record.patientName}
                tone="blue"
              />

              <InfoItem
                label="Patient Number"
                value={record.patientNumber}
                tone="blue"
              />

              <InfoItem
                label="Patient ID"
                value={record.patientId}
                tone="blue"
              />

              <InfoItem
                label="Pregnancy ID"
                value={record.pregnancyId}
                tone="rose"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={CalendarDays}
            title="Admission"
            subtitle="Taarifa za kuwasili labour ward"
            tone="orange"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Admission Date"
                value={formatDate(record.admissionDate)}
                tone="orange"
              />

              <InfoItem
                label="Admission Time"
                value={record.admissionTime}
                tone="orange"
              />

              <InfoItem
                label="Admission Reason"
                value={record.admissionReason}
                tone="orange"
              />

              <InfoItem
                label="Labour Onset"
                value={record.labourOnset}
                tone="orange"
              />
            </div>
          </SectionCard>
        </div>

        {/* Labour Progress */}
        <SectionCard
          icon={Stethoscope}
          title="Maendeleo ya Labour"
          subtitle="Labour progress and cervical assessment"
          tone="orange"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Labour Stage"
              value={labourStageLabel(record.labourStage)}
              tone="orange"
            />

            <InfoItem
              label="Membrane Status"
              value={record.membraneStatus}
              tone="orange"
            />

            <InfoItem
              label="Liquor"
              value={record.liquor}
              tone="orange"
            />

            <InfoItem
              label="Cervical Dilation"
              value={record.cervicalDilation}
              tone="orange"
            />

            <InfoItem
              label="Cervical Effacement"
              value={record.cervicalEffacement}
              tone="orange"
            />

            <InfoItem
              label="Fetal Descent"
              value={record.fetalDescent}
              tone="orange"
            />

            <InfoItem
              label="Contraction Frequency"
              value={record.contractionFrequency}
              tone="orange"
            />

            <InfoItem
              label="Contraction Duration"
              value={record.contractionDuration}
              tone="orange"
            />
          </div>
        </SectionCard>

        {/* Maternal */}
        <SectionCard
          icon={HeartPulse}
          title="Taarifa za Mama"
          subtitle="Maternal assessment and vital signs"
          tone="rose"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Weight"
              value={
                record.maternalWeight != null
                  ? `${record.maternalWeight} kg`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Blood Pressure"
              value={
                record.bloodPressureSystolic != null &&
                record.bloodPressureDiastolic != null
                  ? `${record.bloodPressureSystolic}/${record.bloodPressureDiastolic} mmHg`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Pulse"
              value={
                record.pulse != null
                  ? `${record.pulse} bpm`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Temperature"
              value={
                record.temperature != null
                  ? `${record.temperature} °C`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Respiratory Rate"
              value={
                record.respiratoryRate != null
                  ? `${record.respiratoryRate}/min`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Condition"
              value={record.maternalCondition}
              tone="green"
            />

            <InfoItem
              label="Pain Score"
              value={
                record.painScore != null
                  ? `${record.painScore}/10`
                  : "—"
              }
              tone="rose"
            />

            <InfoItem
              label="Bleeding"
              value={record.bleeding}
              tone="rose"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TextBlock
              label="Complications"
              value={record.complications}
              tone="rose"
            />
          </div>
        </SectionCard>

        {/* Fetal */}
        <SectionCard
          icon={Baby}
          title="Taarifa za Mtoto"
          subtitle="Fetal assessment"
          tone="purple"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Fetal Heart Rate"
              value={
                record.fetalHeartRate != null
                  ? `${record.fetalHeartRate} bpm`
                  : "—"
              }
              tone="purple"
            />

            <InfoItem
              label="Fetal Condition"
              value={record.fetalCondition}
              tone="purple"
            />

            <InfoItem
              label="Presentation"
              value={record.fetalPresentation}
              tone="purple"
            />

            <InfoItem
              label="Lie"
              value={record.fetalLie}
              tone="purple"
            />

            <InfoItem
              label="Position"
              value={record.fetalPosition}
              tone="purple"
            />

            <InfoItem
              label="Fetal Movement"
              value={record.fetalMovement}
              tone="green"
            />
          </div>
        </SectionCard>

        {/* Delivery */}
        <SectionCard
          icon={Baby}
          title="Delivery"
          subtitle="Taarifa za kujifungua"
          tone="green"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Delivery Date"
              value={formatDate(record.deliveryDate)}
              tone="green"
            />

            <InfoItem
              label="Delivery Time"
              value={record.deliveryTime}
              tone="green"
            />

            <InfoItem
              label="Delivery Mode"
              value={deliveryModeLabel(record.deliveryMode)}
              tone="green"
            />

            <InfoItem
              label="Delivery Outcome"
              value={record.deliveryOutcome}
              tone="green"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TextBlock
              label="Delivery Indication"
              value={record.deliveryIndication}
              tone="green"
            />

            <TextBlock
              label="Delivery Complications"
              value={record.deliveryComplications}
              tone="orange"
            />
          </div>
        </SectionCard>

        {/* NEWBORN RECORDS */}
        <SectionCard
          icon={Baby}
          title="Newborn Records"
          subtitle="Taarifa za watoto waliozaliwa kwenye Labour Record hii"
          tone="rose"
        >
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 via-white to-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 ring-1 ring-pink-200">
                <Baby size={21} />
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  {newborns.length === 0
                    ? "Hakuna Newborn Record bado"
                    : `${newborns.length} Newborn Record${
                        newborns.length > 1 ? "s" : ""
                      }`}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {activeNewbornsCount > 0
                    ? `${activeNewbornsCount} active newborn record${
                        activeNewbornsCount > 1 ? "s" : ""
                      } imehusishwa na Labour Record hii.`
                    : "Unaweza kusajili mtoto mpya kutoka hapa."}
                </p>
              </div>
            </div>

            {canRegisterNewborn && (
              <Link
                to={`/maternity/newborn-records/register?labourRecordId=${record.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Plus size={17} />
                Sajili Mtoto
              </Link>
            )}
          </div>

          {loadingNewborns ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 bg-pink-50/30 px-5 py-14">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                <Loader2
                  className="animate-spin"
                  size={24}
                />
              </div>

              <p className="mt-3 text-sm font-bold text-slate-600">
                Inapakia Newborn Records...
              </p>
            </div>
          ) : newbornError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-red-600"
                  size={19}
                />

                <div>
                  <p className="text-sm font-black text-red-800">
                    Imeshindikana kupakia Newborn Records
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {newbornError}
                  </p>

                  <button
                    type="button"
                    onClick={loadNewborns}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-700 transition hover:bg-red-50"
                  >
                    Jaribu tena
                  </button>
                </div>
              </div>
            </div>
          ) : newborns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-50/60 to-blue-50/60 px-5 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-pink-500 shadow-sm ring-1 ring-pink-100">
                <Baby size={30} />
              </div>

              <h3 className="mt-4 text-lg font-black text-slate-800">
                Hakuna mtoto aliyesajiliwa bado
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Labour Record hii bado haina taarifa ya mtoto.
                Sajili Newborn Record ili kuhusisha taarifa za mtoto
                na labour hii.
              </p>

              {canRegisterNewborn && (
                <Link
                  to={`/maternity/newborn-records/register?labourRecordId=${record.id}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Plus size={17} />
                  Sajili Mtoto
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {newborns.map((newborn) => (
                <NewbornCard
                  key={newborn.id}
                  newborn={newborn}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Postpartum */}
        <SectionCard
          icon={ShieldCheck}
          title="Baada ya Kujifungua"
          subtitle="Maternal postpartum and placenta assessment"
          tone="green"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Maternal Outcome"
              value={record.maternalOutcome}
              tone="green"
            />

            <InfoItem
              label="Postpartum Bleeding"
              value={record.postpartumBleeding}
              tone="green"
            />

            <InfoItem
              label="Placenta Status"
              value={record.placentaStatus}
              tone="green"
            />

            <InfoItem
              label="Estimated Blood Loss"
              value={
                record.estimatedBloodLoss != null
                  ? `${record.estimatedBloodLoss} mL`
                  : "—"
              }
              tone="green"
            />
          </div>
        </SectionCard>

        {/* Clinical */}
        <SectionCard
          icon={FileText}
          title="Clinical Information"
          subtitle="Assessment, diagnosis and management"
          tone="purple"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextBlock
              label="Assessment"
              value={record.assessment}
              tone="purple"
            />

            <TextBlock
              label="Diagnosis"
              value={record.diagnosis}
              tone="purple"
            />

            <TextBlock
              label="Treatment"
              value={record.treatment}
              tone="purple"
            />

            <TextBlock
              label="Medication"
              value={record.medication}
              tone="purple"
            />

            <TextBlock
              label="Referral"
              value={record.referral}
              tone="blue"
            />

            <TextBlock
              label="Notes"
              value={record.notes}
              tone="slate"
            />
          </div>
        </SectionCard>

        {/* Record Protection */}
        <SectionCard
          icon={Lock}
          title="Record Protection & History"
          subtitle="Audit information ya Labour Record"
          tone={
            isArchived
              ? "amber"
              : isCompleted
                ? "green"
                : "blue"
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Record Status"
              value={statusLabel(record.recordStatus)}
              tone={
                isArchived
                  ? "amber"
                  : isCompleted
                    ? "green"
                    : "blue"
              }
            />

            <InfoItem
              label="Created At"
              value={formatDateTime(record.createdAt)}
              tone="blue"
            />

            <InfoItem
              label="Updated At"
              value={formatDateTime(record.updatedAt)}
              tone="blue"
            />

            <InfoItem
              label="Record ID"
              value={record.id}
              tone="slate"
            />
          </div>

          {isActive && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-rose-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <HeartPulse size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-blue-800">
                    Labour Record hii iko ACTIVE
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    Labour & Delivery bado inaendelea. Taarifa za
                    clinical zinaweza kuhaririwa hadi record
                    ikamilishwe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-green-50 to-blue-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-emerald-800">
                    Labour Record hii imekamilika
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    Taarifa za labour na delivery zimefanyiwa
                    finalization. Record hii ni read-only na haiwezi
                    kuhaririwa tena.
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    Newborn Records bado zinaweza kusajiliwa kutoka
                    kwenye Labour Record hii.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isArchived && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Lock size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-amber-800">
                    Labour Record hii ime-archive
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Record hii ni sehemu ya historia ya mgonjwa na
                    haiwezi kuhaririwa.
                  </p>

                  {record.archiveReason && (
                    <p className="mt-2 text-sm text-amber-800">
                      <span className="font-black">
                        Sababu:
                      </span>{" "}
                      {record.archiveReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Footer Actions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              to="/maternity/labour-records"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={17} />
              Rudi Labour Records
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/maternity/pregnancies/${record.pregnancyId}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
              >
                <UserRound size={17} />
                Fungua Pregnancy
              </Link>

              {canEdit && (
                <Link
                  to={`/maternity/labour-records/${record.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Edit3 size={17} />
                  Hariri Labour Record
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-4 text-xs font-medium text-slate-400">
          <Clock3 size={14} />

          <span>
            Record ID: {record.id} · Pregnancy ID:{" "}
            {record.pregnancyId}
            {" · "}
            Newborns: {newborns.length}
          </span>
        </div>
      </div>

      {/* Archive Modal */}
      {archiveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !archiving
            ) {
              closeArchiveModal();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-labour-title"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-1 ring-amber-200">
                    <Lock size={21} />
                  </div>

                  <div>
                    <h2
                      id="archive-labour-title"
                      className="text-lg font-black text-slate-900"
                    >
                      Thibitisha Archive
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Labour Record #{record.id} itawekwa kwenye
                      historia na haitaruhusiwa kuhaririwa.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeArchiveModal}
                  disabled={archiving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Funga"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-black text-amber-800">
                      Taarifa muhimu
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Archive haifuti taarifa kwenye database.
                      Record itabaki kama historical record kwa
                      ajili ya audit na patient history.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="labour-archive-reason"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Sababu ya Archive
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  id="labour-archive-reason"
                  value={archiveReason}
                  onChange={(event) => {
                    setArchiveReason(event.target.value);

                    if (archiveValidationError) {
                      setArchiveValidationError("");
                    }
                  }}
                  placeholder="Mfano: Labour record completed"
                  rows={4}
                  maxLength={500}
                  autoFocus
                  disabled={archiving}
                  className={`w-full resize-none rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    archiveValidationError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-amber-500 focus:ring-amber-100"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                />

                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    {archiveValidationError && (
                      <p className="text-xs font-semibold text-red-600">
                        {archiveValidationError}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    {archiveReason.length}/500
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeArchiveModal}
                  disabled={archiving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Ina-archive...
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      Archive Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}