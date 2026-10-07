import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  FileText,
  HeartPulse,
  History,
  Loader2,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

import api from "../../services/api";

/* ============================================================
   HELPERS
============================================================ */

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("sw-TZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue, timeValue) {
  const date = formatDate(dateValue);

  if (date === "—" && !timeValue) {
    return "—";
  }

  if (timeValue) {
    return `${date} • ${timeValue}`;
  }

  return date;
}

function getStatusLabel(status) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "Inaendelea";

    case "ARCHIVED":
      return "Imehifadhiwa";

    case "COMPLETED":
      return "Imekamilika";

    default:
      return status || "Haijulikani";
  }
}

function getStatusClasses(status) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "ARCHIVED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "COMPLETED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusAccent(status) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-500";

    case "ARCHIVED":
      return "bg-slate-400";

    case "COMPLETED":
      return "bg-blue-500";

    default:
      return "bg-amber-500";
  }
}

function getLabourStageLabel(stage) {
  if (!stage) {
    return "Bado";
  }

  const labels = {
    FIRST_STAGE: "First Stage",
    SECOND_STAGE: "Second Stage",
    THIRD_STAGE: "Third Stage",
    FOURTH_STAGE: "Fourth Stage",
    LATENT_PHASE: "Latent Phase",
    ACTIVE_PHASE: "Active Phase",
  };

  return labels[String(stage).toUpperCase()] || stage;
}

function getDeliveryModeLabel(mode) {
  if (!mode) {
    return "Bado";

  }

  const labels = {
    NORMAL: "Normal Delivery",
    SVD: "Normal Delivery",
    VAGINAL: "Vaginal Delivery",
    C_SECTION: "C-Section",
    CAESAREAN: "C-Section",
    ASSISTED_VAGINAL: "Assisted Vaginal",
  };

  return labels[String(mode).toUpperCase()] || mode;
}

function getANCTypeLabel(type) {
  if (!type) {
    return "ANC Visit";
  }

  const labels = {
    INITIAL_ANC: "Initial ANC",
    FOLLOW_UP: "Follow Up",
    FOLLOWUP: "Follow Up",
    ROUTINE: "Routine ANC",
    EMERGENCY: "Emergency ANC",
  };

  return labels[String(type).toUpperCase()] || type;
}

function calculateGestation(lmp) {
  if (!lmp) {
    return null;
  }

  const lmpDate = new Date(lmp);

  if (Number.isNaN(lmpDate.getTime())) {
    return null;
  }

  const today = new Date();

  const difference =
    today.getTime() - lmpDate.getTime();

  if (difference < 0) {
    return "0 weeks";
  }

  const weeks = Math.floor(
    difference / (1000 * 60 * 60 * 24 * 7)
  );

  return `${weeks} weeks`;
}

function getPatientName(pregnancy) {
  return (
    pregnancy?.patientName ||
    "Mgonjwa hajatajwa"
  );
}

/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

function InfoCard({
  label,
  value,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words text-sm font-bold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PregnancyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pregnancy, setPregnancy] = useState(null);
  const [ancVisits, setAncVisits] = useState([]);
  const [labourRecords, setLabourRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [labourLoading, setLabourLoading] = useState(true);

  const [error, setError] = useState("");
  const [labourError, setLabourError] = useState("");

  const [archiving, setArchiving] = useState(false);

  /* ============================================================
     LOAD PREGNANCY + ANC + LABOUR
  ============================================================ */

  async function loadPregnancy() {
    if (!id) {
      setError("Pregnancy ID haipo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLabourLoading(true);

      setError("");
      setLabourError("");

      const [
        pregnancyResponse,
        ancResponse,
        labourResponse,
      ] = await Promise.all([
        api.get(`/maternity/pregnancies/${id}`),

        api.get(
          `/maternity/anc-visits/pregnancy/${id}`
        ),

        api.get(
          `/maternity/labour-records/pregnancy/${id}`
        ),
      ]);

      const pregnancyData =
        pregnancyResponse.data || null;

      const ancData = Array.isArray(
        ancResponse.data
      )
        ? ancResponse.data
        : [];

      const labourData = Array.isArray(
        labourResponse.data
      )
        ? labourResponse.data
        : [];

      setPregnancy(pregnancyData);
      setAncVisits(ancData);

      /*
       * IMPORTANT:
       *
       * Hapa tunahifadhi Labour records ZOTE:
       * ACTIVE
       * COMPLETED
       * ARCHIVED
       *
       * Hakuna filter ya ACTIVE hapa.
       *
       * Hii ndiyo fix ya tatizo tuliloliona.
       */
      setLabourRecords(labourData);
    } catch (err) {
      console.error(
        "Pregnancy profile error:",
        err
      );

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      setError(
        backendMessage ||
          "Imeshindikana kupata taarifa za pregnancy."
      );

      /*
       * Kama Labour endpoint pekee imekataa,
       * hatutaki kupoteza pregnancy na ANC.
       */
      if (
        err?.config?.url?.includes(
          "/maternity/labour-records/pregnancy/"
        )
      ) {
        setLabourError(
          backendMessage ||
            "Imeshindikana kupata Labour history."
        );
      }
    } finally {
      setLoading(false);
      setLabourLoading(false);
    }
  }

  useEffect(() => {
    loadPregnancy();
  }, [id]);

  /* ============================================================
     DERIVED DATA
  ============================================================ */

  const activeANCVisits = useMemo(() => {
    return ancVisits.filter(
      (visit) =>
        String(
          visit?.recordStatus || ""
        ).toUpperCase() === "ACTIVE"
    );
  }, [ancVisits]);

  const archivedANCVisits = useMemo(() => {
    return ancVisits.filter(
      (visit) =>
        String(
          visit?.recordStatus || ""
        ).toUpperCase() === "ARCHIVED"
    );
  }, [ancVisits]);

  const activeLabourRecords = useMemo(() => {
    return labourRecords.filter(
      (record) =>
        String(
          record?.recordStatus || ""
        ).toUpperCase() === "ACTIVE"
    );
  }, [labourRecords]);

  const completedLabourRecords = useMemo(() => {
    return labourRecords.filter(
      (record) =>
        String(
          record?.recordStatus || ""
        ).toUpperCase() === "COMPLETED"
    );
  }, [labourRecords]);

  const archivedLabourRecords = useMemo(() => {
    return labourRecords.filter(
      (record) =>
        String(
          record?.recordStatus || ""
        ).toUpperCase() === "ARCHIVED"
    );
  }, [labourRecords]);

  const latestANC = useMemo(() => {
    if (!ancVisits.length) {
      return null;
    }

    return [...ancVisits].sort((a, b) => {
      return (
        new Date(
          b?.visitDate || 0
        ).getTime() -
        new Date(
          a?.visitDate || 0
        ).getTime()
      );
    })[0];
  }, [ancVisits]);

  const latestLabour = useMemo(() => {
    if (!labourRecords.length) {
      return null;
    }

    return [...labourRecords].sort((a, b) => {
      const dateA = new Date(
        `${a?.admissionDate || "1900-01-01"}T${
          a?.admissionTime || "00:00"
        }`
      ).getTime();

      const dateB = new Date(
        `${b?.admissionDate || "1900-01-01"}T${
          b?.admissionTime || "00:00"
        }`
      ).getTime();

      return dateB - dateA;
    })[0];
  }, [labourRecords]);

  const gestation = calculateGestation(
    pregnancy?.lmp
  );

  const pregnancyIsActive =
    String(
      pregnancy?.status || ""
    ).toUpperCase() === "ACTIVE";

  /* ============================================================
     ARCHIVE PREGNANCY
  ============================================================ */

  async function handleArchivePregnancy() {
    if (!pregnancy || archiving) {
      return;
    }

    if (
      String(
        pregnancy.status || ""
      ).toUpperCase() !== "ACTIVE"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Una uhakika unataka ku-archive pregnancy hii? Pregnancy hii itabaki kwenye historia lakini haitapokea clinical records mpya."
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);

      await api.delete(
        `/maternity/pregnancies/${pregnancy.id}`
      );

      navigate("/maternity/pregnancies");
    } catch (err) {
      console.error(
        "Archive pregnancy error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Imeshindikana ku-archive pregnancy."
      );
    } finally {
      setArchiving(false);
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>

            <p className="text-sm font-medium">
              Inapakia Pregnancy Profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR / NOT FOUND
  ============================================================ */

  if (!pregnancy) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />

              <div>
                <h2 className="font-bold text-red-800">
                  Pregnancy haikupatikana
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error ||
                    "Taarifa za pregnancy hazikupatikana."}
                </p>

                <Link
                  to="/maternity/pregnancies"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Rudi Pregnancy Records
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ======================================================
            BACK
        ====================================================== */}

        <Link
          to="/maternity/pregnancies"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Rudi Pregnancy Records
        </Link>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Imeshindikana kupakia baadhi ya taarifa
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative p-6 sm:p-7 lg:p-8">

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

              <div className="flex min-w-0 items-start gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                  <UserRound className="h-8 w-8" />
                </div>

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Pregnancy Profile
                    </h1>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                        pregnancy.status
                      )}`}
                    >
                      {getStatusLabel(
                        pregnancy.status
                      )}
                    </span>

                    {pregnancy.highRisk && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        High Risk
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-slate-800">
                    {getPatientName(pregnancy)}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                    <span>
                      Patient No:{" "}
                      <strong className="font-semibold text-slate-700">
                        {pregnancy.patientNumber ||
                          "—"}
                      </strong>
                    </span>

                    <span>
                      Pregnancy ID:{" "}
                      <strong className="font-semibold text-slate-700">
                        #{pregnancy.id}
                      </strong>
                    </span>

                    {gestation && (
                      <span>
                        Gestation:{" "}
                        <strong className="font-semibold text-slate-700">
                          {gestation}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-3">

                {pregnancyIsActive &&
                  activeLabourRecords.length ===
                    0 && (
                    <Link
                      to={`/maternity/labour-records/register?pregnancyId=${pregnancy.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                    >
                      <Activity className="h-4 w-4" />
                      Anzisha Labour
                    </Link>
                  )}

                {pregnancyIsActive &&
                  activeLabourRecords.length >
                    0 && (
                    <Link
                      to={`/maternity/labour-records/${activeLabourRecords[0].id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                    >
                      <Activity className="h-4 w-4" />
                      Labour Inaendelea
                    </Link>
                  )}

                {pregnancyIsActive && (
                  <Link
                    to={`/maternity/pregnancies/${pregnancy.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Pregnancy
                  </Link>
                )}

              </div>
            </div>

            {/* HERO SUMMARY */}

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                label="LMP"
                value={formatDate(
                  pregnancy.lmp
                )}
                icon={CalendarDays}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <InfoCard
                label="EDD"
                value={formatDate(
                  pregnancy.edd
                )}
                icon={CalendarDays}
                iconClass="bg-blue-50 text-blue-600"
              />

              <InfoCard
                label="ANC Active"
                value={`${activeANCVisits.length} visit(s)`}
                icon={Stethoscope}
                iconClass="bg-violet-50 text-violet-600"
              />

              <InfoCard
                label="Labour"
                value={
                  activeLabourRecords.length
                    ? "Inaendelea"
                    : labourRecords.length
                    ? `${labourRecords.length} record(s)`
                    : "Hakuna record"
                }
                icon={Activity}
                iconClass="bg-rose-50 text-rose-600"
              />

            </div>
          </div>
        </section>

        {/* ======================================================
            PREGNANCY OVERVIEW
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <SectionHeader
            icon={CalendarDays}
            title="Pregnancy Overview"
            description="Taarifa kuu za mimba hii na progression yake."
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoCard
              label="Gravida"
              value={pregnancy.gravida}
              icon={Users}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <InfoCard
              label="Para"
              value={pregnancy.para}
              icon={Users}
              iconClass="bg-blue-50 text-blue-600"
            />

            <InfoCard
              label="Living Children"
              value={pregnancy.livingChildren}
              icon={Baby}
              iconClass="bg-violet-50 text-violet-600"
            />

            <InfoCard
              label="Abortions"
              value={pregnancy.abortions}
              icon={AlertTriangle}
              iconClass="bg-amber-50 text-amber-600"
            />

          </div>

          {(pregnancy.notes ||
            pregnancy.highRisk) && (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

              {pregnancy.highRisk && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <p className="font-bold text-red-800">
                        High Risk Pregnancy
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-700">
                        Pregnancy hii imewekwa kama high risk na inahitaji clinical monitoring ya karibu.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {pregnancy.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-slate-500" />

                    <div>
                      <p className="font-bold text-slate-800">
                        Notes
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {pregnancy.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* ======================================================
            ANC HISTORY
        ====================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-blue-50/50 p-5 sm:p-6">

            <SectionHeader
              icon={Stethoscope}
              title="ANC Visit History"
              description="Clinical records zote za ANC za pregnancy hii."
              iconClass="bg-blue-50 text-blue-600"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {activeANCVisits.length} Active
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {archivedANCVisits.length} Archived
              </span>

              {pregnancyIsActive && (
                <Link
                  to={`/maternity/pregnancies/${pregnancy.id}/anc/register`}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Ongeza ANC Visit
                </Link>
              )}

            </div>
          </div>

          {ancVisits.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Stethoscope className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Hakuna ANC Visit bado
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                Pregnancy hii bado haina clinical ANC visit.
              </p>

              {pregnancyIsActive && (
                <Link
                  to={`/maternity/pregnancies/${pregnancy.id}/anc/register`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Sajili ANC Visit
                </Link>
              )}

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {ancVisits.map((visit) => {
                const status = String(
                  visit?.recordStatus || ""
                ).toUpperCase();

                return (
                  <Link
                    key={visit.id}
                    to={`/maternity/anc-visits/${visit.id}`}
                    className="group block p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex items-start gap-4">

                      <div
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          status === "ARCHIVED"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Stethoscope className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-slate-900">
                            {getANCTypeLabel(
                              visit?.visitType
                            )}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-bold ${getStatusClasses(
                              visit?.recordStatus
                            )}`}
                          >
                            {getStatusLabel(
                              visit?.recordStatus
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            {formatDate(
                              visit?.visitDate
                            )}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                          <span>
                            Gestation:{" "}
                            <strong className="text-slate-700">
                              {visit?.gestationalWeeks
                                ? `${visit.gestationalWeeks} weeks`
                                : "—"}
                            </strong>
                          </span>

                          <span>
                            BP:{" "}
                            <strong className="text-slate-700">
                              {visit?.bloodPressureSystolic &&
                              visit?.bloodPressureDiastolic
                                ? `${visit.bloodPressureSystolic}/${visit.bloodPressureDiastolic}`
                                : "—"}
                            </strong>
                          </span>

                          <span>
                            FHR:{" "}
                            <strong className="text-slate-700">
                              {visit?.fetalHeartRate
                                ? `${visit.fetalHeartRate} bpm`
                                : "—"}
                            </strong>
                          </span>

                        </div>
                      </div>

                      <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />

                    </div>
                  </Link>
                );
              })}

            </div>
          )}
        </section>

        {/* ======================================================
            LABOUR & DELIVERY HISTORY
        ====================================================== */}

        <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">

          <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 p-5 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

              <SectionHeader
                icon={Activity}
                title="Labour & Delivery"
                description="Labour Record ni episode/admission ya mama wakati wa labour. Inaendelea kuwa sehemu ya historia ya pregnancy hii."
                iconClass="bg-rose-100 text-rose-600"
              />

              <div className="flex flex-wrap gap-2">

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  {activeLabourRecords.length} Active
                </span>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {completedLabourRecords.length} Completed
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {archivedLabourRecords.length} Archived
                </span>

              </div>
            </div>
          </div>

          {/* LABOUR ERROR */}

          {labourError && (
            <div className="border-b border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />

                <p className="text-sm text-red-700">
                  {labourError}
                </p>
              </div>
            </div>
          )}

          {/* LOADING */}

          {labourLoading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-rose-600" />

                <p className="text-sm">
                  Inapakia Labour history...
                </p>
              </div>
            </div>
          ) : labourRecords.length === 0 ? (

            /*
             * IMPORTANT:
             *
             * Empty state inatokea ONLY kama
             * hakuna Labour record yoyote.
             *
             * Hapa hatuangalii ACTIVE pekee.
             */
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <Activity className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Hakuna Labour Record bado
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                Pregnancy hii bado haina Labour & Delivery episode. Hii haimaanishi pregnancy haipo; Labour Record huanzishwa mama anapoingia kwenye labour/admission.
              </p>

              {pregnancyIsActive && (
                <Link
                  to={`/maternity/labour-records/register?pregnancyId=${pregnancy.id}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                >
                  <Plus className="h-4 w-4" />
                  Anzisha Labour Record
                </Link>
              )}

            </div>
          ) : (

            /*
             * IMPORTANT:
             *
             * Kama kuna ACTIVE, COMPLETED au ARCHIVED,
             * zote zinaonyeshwa hapa.
             */
            <div className="divide-y divide-slate-100">

              {labourRecords.map((record) => {
                const status = String(
                  record?.recordStatus || ""
                ).toUpperCase();

                return (
                  <Link
                    key={record.id}
                    to={`/maternity/labour-records/${record.id}`}
                    className="group relative block overflow-hidden p-5 transition hover:bg-slate-50/80 sm:p-6"
                  >

                    <div
                      className={`absolute bottom-0 left-0 top-0 w-1 ${getStatusAccent(
                        record?.recordStatus
                      )}`}
                    />

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* MAIN RECORD */}

                      <div className="flex min-w-0 flex-1 items-start gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            status === "ARCHIVED"
                              ? "bg-slate-100 text-slate-500"
                              : status === "COMPLETED"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <Activity className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold text-slate-900">
                              Labour Record #{record.id}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(
                                record?.recordStatus
                              )}`}
                            >
                              {getStatusLabel(
                                record?.recordStatus
                              )}
                            </span>

                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                            <span>
                              Admission:{" "}
                              <strong className="text-slate-700">
                                {formatDateTime(
                                  record?.admissionDate,
                                  record?.admissionTime
                                )}
                              </strong>
                            </span>

                            <span>
                              Stage:{" "}
                              <strong className="text-slate-700">
                                {getLabourStageLabel(
                                  record?.labourStage
                                )}
                              </strong>
                            </span>

                            <span>
                              FHR:{" "}
                              <strong className="text-slate-700">
                                {record?.fetalHeartRate
                                  ? `${record.fetalHeartRate} bpm`
                                  : "—"}
                              </strong>
                            </span>

                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                              <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
                              BP:{" "}
                              {record?.maternalBloodPressureSystolic &&
                              record?.maternalBloodPressureDiastolic
                                ? `${record.maternalBloodPressureSystolic}/${record.maternalBloodPressureDiastolic}`
                                : record?.maternalBpSystolic &&
                                  record?.maternalBpDiastolic
                                ? `${record.maternalBpSystolic}/${record.maternalBpDiastolic}`
                                : "—"}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                              <Baby className="h-3.5 w-3.5 text-violet-600" />
                              Delivery:{" "}
                              {getDeliveryModeLabel(
                                record?.deliveryMode
                              )}
                            </span>

                            {record?.deliveryDate && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                                <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                                {formatDate(
                                  record.deliveryDate
                                )}
                              </span>
                            )}

                          </div>

                          {status ===
                            "ARCHIVED" &&
                            record?.archiveReason && (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-xs text-slate-500">
                                  <strong className="text-slate-700">
                                    Sababu ya archive:
                                  </strong>{" "}
                                  {record.archiveReason}
                                </p>
                              </div>
                            )}

                        </div>
                      </div>

                      {/* RIGHT */}

                      <div className="flex shrink-0 items-center justify-end">

                        <div className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-700 transition group-hover:border-rose-200 group-hover:bg-rose-100">
                          Fungua record

                          <ChevronRight className="h-5 w-5 text-rose-500 transition group-hover:translate-x-1" />
                        </div>

                      </div>

                    </div>
                  </Link>
                );
              })}

            </div>
          )}

          {/* LABOUR FOOTER */}

          {!labourLoading &&
            labourRecords.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">

                <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex flex-wrap gap-x-5 gap-y-2">

                    <span>
                      Total Labour:{" "}
                      <strong className="text-slate-700">
                        {labourRecords.length}
                      </strong>
                    </span>

                    <span>
                      Active:{" "}
                      <strong className="text-emerald-700">
                        {activeLabourRecords.length}
                      </strong>
                    </span>

                    <span>
                      Completed:{" "}
                      <strong className="text-blue-700">
                        {completedLabourRecords.length}
                      </strong>
                    </span>

                    <span>
                      Archived:{" "}
                      <strong className="text-slate-700">
                        {archivedLabourRecords.length}
                      </strong>
                    </span>

                  </div>

                  {pregnancyIsActive &&
                    activeLabourRecords.length ===
                      0 && (
                      <Link
                        to={`/maternity/labour-records/register?pregnancyId=${pregnancy.id}`}
                        className="inline-flex items-center gap-2 font-semibold text-rose-700 hover:text-rose-800"
                      >
                        <Plus className="h-4 w-4" />
                        Anzisha Labour mpya
                      </Link>
                    )}

                </div>
              </div>
            )}
        </section>

        {/* ======================================================
            LABOUR CONTINUITY
        ====================================================== */}

        {latestLabour && (
          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm sm:p-6">

            <SectionHeader
              icon={Baby}
              title="Labour & Delivery Continuity"
              description="Muhtasari wa Labour Record ya hivi karibuni kwa mwendelezo wa clinical care."
              iconClass="bg-violet-100 text-violet-700"
            />

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                label="Labour Record"
                value={`#${latestLabour.id}`}
                icon={Activity}
                iconClass="bg-rose-50 text-rose-600"
              />

              <InfoCard
                label="Status"
                value={getStatusLabel(
                  latestLabour.recordStatus
                )}
                icon={ShieldCheck}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <InfoCard
                label="Admission"
                value={formatDateTime(
                  latestLabour.admissionDate,
                  latestLabour.admissionTime
                )}
                icon={Clock3}
                iconClass="bg-blue-50 text-blue-600"
              />

              <InfoCard
                label="Delivery"
                value={getDeliveryModeLabel(
                  latestLabour.deliveryMode
                )}
                icon={Baby}
                iconClass="bg-violet-50 text-violet-600"
              />

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                to={`/maternity/labour-records/${latestLabour.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Fungua Labour Record
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                to="/maternity/labour-records"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <History className="h-4 w-4" />
                Labour Records
              </Link>

            </div>
          </section>
        )}

        {/* ======================================================
            HISTORY PROTECTION
        ====================================================== */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Clinical History inalindwa
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  ANC, Labour na clinical records zilizohifadhiwa kama ARCHIVED hazifutwi. Zinaendelea kuwa sehemu ya historia ya huduma.
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Baby className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Pregnancy Continuity
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Pregnancy ndiyo parent record. ANC, Labour & Delivery na Newborn zinaendelea chini ya pregnancy husika.
                </p>
              </div>

            </div>
          </div>

        </section>

        {/* ======================================================
            ARCHIVE PREGNANCY
        ====================================================== */}

        {pregnancyIsActive && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <History className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-amber-900">
                    Hifadhi Pregnancy History
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800">
                    Ukimaliza pregnancy hii, unaweza kui-archive. Record zake za ANC na Labour zitaendelea kubaki kwenye history.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={handleArchivePregnancy}
                disabled={archiving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archiving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <History className="h-4 w-4" />
                )}

                {archiving
                  ? "Inahifadhi..."
                  : "Archive Pregnancy"}
              </button>

            </div>
          </section>
        )}

        {/* ======================================================
            RECORD INFO
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <SectionHeader
            icon={FileText}
            title="Record Information"
            description="Taarifa za mfumo kuhusu pregnancy record hii."
            iconClass="bg-slate-100 text-slate-600"
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoCard
              label="Pregnancy ID"
              value={`#${pregnancy.id}`}
              icon={FileText}
              iconClass="bg-slate-100 text-slate-600"
            />

            <InfoCard
              label="Patient ID"
              value={pregnancy.patientId}
              icon={UserRound}
              iconClass="bg-blue-50 text-blue-600"
            />

            <InfoCard
              label="Created"
              value={formatDate(
                pregnancy.createdAt
              )}
              icon={CalendarDays}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <InfoCard
              label="Updated"
              value={formatDate(
                pregnancy.updatedAt
              )}
              icon={Clock3}
              iconClass="bg-violet-50 text-violet-600"
            />

          </div>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <p>
            Maternity Management • Pregnancy Profile
          </p>

          <p>
            Pregnancy → ANC → Labour & Delivery → Newborn
          </p>

        </div>

      </div>
    </div>
  );
}