import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Loader2,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const initialForm = {
  pregnancyId: "",

  admissionDate: "",
  admissionTime: "",
  admissionReason: "",
  labourOnset: "",
  labourStage: "",
  membraneStatus: "",
  liquor: "",
  cervicalDilation: "",
  cervicalEffacement: "",
  fetalDescent: "",
  contractionFrequency: "",
  contractionDuration: "",

  maternalWeight: "",
  maternalBpSystolic: "",
  maternalBpDiastolic: "",
  maternalPulse: "",
  maternalTemperature: "",
  maternalRespiratoryRate: "",
  maternalCondition: "",
  painScore: "",
  bleeding: "",
  complications: "",

  fetalHeartRate: "",
  fetalCondition: "",
  fetalPresentation: "",
  fetalLie: "",
  fetalPosition: "",
  fetalMovement: "",

  deliveryDate: "",
  deliveryTime: "",
  deliveryMode: "",
  deliveryIndication: "",
  deliveryOutcome: "",
  deliveryComplications: "",

  maternalOutcome: "",
  postpartumBleeding: "",
  placentaStatus: "",
  estimatedBloodLoss: "",

  assessment: "",
  diagnosis: "",
  treatment: "",
  medication: "",
  referral: "",
  notes: "",
};

const sectionThemes = {
  admission: {
    icon: CalendarDays,
    iconClass: "bg-blue-50 text-blue-600",
    headerClass: "bg-blue-50/60 border-blue-100",
    titleClass: "text-blue-950",
  },
  labour: {
    icon: ClipboardList,
    iconClass: "bg-orange-50 text-orange-600",
    headerClass: "bg-orange-50/60 border-orange-100",
    titleClass: "text-orange-950",
  },
  maternal: {
    icon: HeartPulse,
    iconClass: "bg-rose-50 text-rose-600",
    headerClass: "bg-rose-50/60 border-rose-100",
    titleClass: "text-rose-950",
  },
  fetal: {
    icon: Baby,
    iconClass: "bg-violet-50 text-violet-600",
    headerClass: "bg-violet-50/60 border-violet-100",
    titleClass: "text-violet-950",
  },
  delivery: {
    icon: Baby,
    iconClass: "bg-orange-100 text-orange-700",
    headerClass:
      "bg-gradient-to-r from-orange-50 to-rose-50 border-orange-100",
    titleClass: "text-orange-950",
  },
  postpartum: {
    icon: HeartPulse,
    iconClass: "bg-emerald-50 text-emerald-600",
    headerClass: "bg-emerald-50/60 border-emerald-100",
    titleClass: "text-emerald-950",
  },
  clinical: {
    icon: Stethoscope,
    iconClass: "bg-slate-100 text-slate-700",
    headerClass: "bg-slate-50/80 border-slate-200",
    titleClass: "text-slate-900",
  },
};

function SectionCard({
  theme = "clinical",
  title,
  subtitle,
  children,
  highlight = false,
}) {
  const config = sectionThemes[theme] || sectionThemes.clinical;
  const Icon = config.icon;

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        highlight
          ? "border-orange-200 shadow-orange-100/60"
          : "border-slate-200"
      }`}
    >
      <div className={`border-b px-5 py-4 ${config.headerClass}`}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
          >
            <Icon size={20} />
          </div>

          <div className="min-w-0">
            <h2
              className={`text-base font-bold ${config.titleClass}`}
            >
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
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

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}

      {required && (
        <span className="ml-1 text-rose-500">*</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const textareaClass =
  "w-full min-h-[105px] resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizePayload(form) {
  return {
    pregnancyId: Number(form.pregnancyId),

    admissionDate: form.admissionDate || null,
    admissionTime: form.admissionTime || null,
    admissionReason: form.admissionReason || null,
    labourOnset: form.labourOnset || null,
    labourStage: form.labourStage || null,
    membraneStatus: form.membraneStatus || null,
    liquor: form.liquor || null,
    cervicalDilation: form.cervicalDilation || null,
    cervicalEffacement: form.cervicalEffacement || null,
    fetalDescent: form.fetalDescent || null,
    contractionFrequency: form.contractionFrequency || null,
    contractionDuration: form.contractionDuration || null,

    maternalWeight: normalizeNumber(form.maternalWeight),
    maternalBpSystolic: normalizeNumber(form.maternalBpSystolic),
    maternalBpDiastolic: normalizeNumber(form.maternalBpDiastolic),
    maternalPulse: normalizeNumber(form.maternalPulse),
    maternalTemperature: normalizeNumber(form.maternalTemperature),
    maternalRespiratoryRate: normalizeNumber(
      form.maternalRespiratoryRate
    ),
    maternalCondition: form.maternalCondition || null,
    painScore: normalizeNumber(form.painScore),
    bleeding: form.bleeding || null,
    complications: form.complications || null,

    fetalHeartRate: normalizeNumber(form.fetalHeartRate),
    fetalCondition: form.fetalCondition || null,
    fetalPresentation: form.fetalPresentation || null,
    fetalLie: form.fetalLie || null,
    fetalPosition: form.fetalPosition || null,
    fetalMovement: form.fetalMovement || null,

    deliveryDate: form.deliveryDate || null,
    deliveryTime: form.deliveryTime || null,
    deliveryMode: form.deliveryMode || null,
    deliveryIndication: form.deliveryIndication || null,
    deliveryOutcome: form.deliveryOutcome || null,
    deliveryComplications:
      form.deliveryComplications || null,

    maternalOutcome: form.maternalOutcome || null,
    postpartumBleeding: form.postpartumBleeding || null,
    placentaStatus: form.placentaStatus || null,
    estimatedBloodLoss: normalizeNumber(
      form.estimatedBloodLoss
    ),

    assessment: form.assessment || null,
    diagnosis: form.diagnosis || null,
    treatment: form.treatment || null,
    medication: form.medication || null,
    referral: form.referral || null,
    notes: form.notes || null,
  };
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

export default function EditLabourRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [record, setRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const recordStatus = useMemo(
    () => record?.recordStatus?.toUpperCase() || "",
    [record]
  );

  const isActive = recordStatus === "ACTIVE";
  const isCompleted = recordStatus === "COMPLETED";
  const isArchived = recordStatus === "ARCHIVED";

  const isLocked = !isActive;

  useEffect(() => {
    let mounted = true;

    const loadRecord = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/maternity/labour-records/${id}`
        );

        if (!mounted) {
          return;
        }

        const data = response.data;

        setRecord(data);

        setForm({
          pregnancyId: data.pregnancyId ?? "",

          admissionDate: data.admissionDate ?? "",
          admissionTime: data.admissionTime ?? "",
          admissionReason: data.admissionReason ?? "",
          labourOnset: data.labourOnset ?? "",
          labourStage: data.labourStage ?? "",
          membraneStatus: data.membraneStatus ?? "",
          liquor: data.liquor ?? "",
          cervicalDilation: data.cervicalDilation ?? "",
          cervicalEffacement: data.cervicalEffacement ?? "",
          fetalDescent: data.fetalDescent ?? "",
          contractionFrequency:
            data.contractionFrequency ?? "",
          contractionDuration:
            data.contractionDuration ?? "",

          maternalWeight: data.maternalWeight ?? "",
          maternalBpSystolic:
            data.maternalBpSystolic ?? "",
          maternalBpDiastolic:
            data.maternalBpDiastolic ?? "",
          maternalPulse: data.maternalPulse ?? "",
          maternalTemperature:
            data.maternalTemperature ?? "",
          maternalRespiratoryRate:
            data.maternalRespiratoryRate ?? "",
          maternalCondition:
            data.maternalCondition ?? "",
          painScore: data.painScore ?? "",
          bleeding: data.bleeding ?? "",
          complications: data.complications ?? "",

          fetalHeartRate: data.fetalHeartRate ?? "",
          fetalCondition: data.fetalCondition ?? "",
          fetalPresentation:
            data.fetalPresentation ?? "",
          fetalLie: data.fetalLie ?? "",
          fetalPosition: data.fetalPosition ?? "",
          fetalMovement: data.fetalMovement ?? "",

          deliveryDate: data.deliveryDate ?? "",
          deliveryTime: data.deliveryTime ?? "",
          deliveryMode: data.deliveryMode ?? "",
          deliveryIndication:
            data.deliveryIndication ?? "",
          deliveryOutcome: data.deliveryOutcome ?? "",
          deliveryComplications:
            data.deliveryComplications ?? "",

          maternalOutcome:
            data.maternalOutcome ?? "",
          postpartumBleeding:
            data.postpartumBleeding ?? "",
          placentaStatus:
            data.placentaStatus ?? "",
          estimatedBloodLoss:
            data.estimatedBloodLoss ?? "",

          assessment: data.assessment ?? "",
          diagnosis: data.diagnosis ?? "",
          treatment: data.treatment ?? "",
          medication: data.medication ?? "",
          referral: data.referral ?? "",
          notes: data.notes ?? "",
        });
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          getErrorMessage(
            err,
            "Imeshindikana kupata taarifa za Labour Record."
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecord();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLocked) {
      setError(
        isCompleted
          ? "Labour Record hii imekamilika na imefungwa. Completed records haziwezi kuhaririwa."
          : isArchived
          ? "Labour Record hii ime-archive na haiwezi kuhaririwa kwa sababu ni historical record."
          : "Labour Record hii haiwezi kuhaririwa kwa sababu status yake hairuhusu clinical editing."
      );
      return;
    }

    if (!form.pregnancyId) {
      setError(
        "Pregnancy ID haipo. Tafadhali rudi Labour Record Profile."
      );
      return;
    }

    if (!form.admissionDate) {
      setError("Admission Date inahitajika.");
      return;
    }

    if (!form.admissionTime) {
      setError("Admission Time inahitajika.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = normalizePayload(form);

      const response = await api.put(
        `/maternity/labour-records/${id}`,
        payload
      );

      setRecord(response.data);

      setSuccessMessage(
        "Labour Record imesasishwa kwa mafanikio."
      );

      setTimeout(() => {
        navigate(`/maternity/labour-records/${id}`);
      }, 700);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Imeshindikana kusasisha Labour Record. Tafadhali jaribu tena."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
              <Loader2
                className="animate-spin text-rose-600"
                size={30}
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">
                Inapakia Labour Record...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Tafadhali subiri kidogo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <HeartPulse size={26} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-800">
              Labour Record haijapatikana
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "Taarifa za Labour Record hazikupatikana."}
            </p>

            <Link
              to="/maternity/labour-records"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              <ArrowLeft size={17} />
              Rudi Labour Records
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    const lockedTitle = isCompleted
      ? "Labour Record imekamilika"
      : "Labour Record haiwezi kuhaririwa";

    const lockedDescription = isCompleted
      ? "Record hii imekamilishwa baada ya delivery. Taarifa za Labour & Delivery zimefungwa ili kulinda clinical history."
      : "Record hii imehifadhiwa kama historical record na hairuhusiwi kubadilishwa.";

    const statusLabel = isCompleted
      ? "COMPLETED"
      : isArchived
      ? "ARCHIVED"
      : record.recordStatus || "LOCKED";

    const statusClass = isCompleted
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-700 border-amber-200";

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              to={`/maternity/labour-records/${id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-rose-600"
            >
              <ArrowLeft size={18} />
              Rudi Labour Record Profile
            </Link>
          </div>

          <div
            className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
              isCompleted
                ? "border-emerald-200"
                : "border-amber-200"
            }`}
          >
            <div
              className={`relative overflow-hidden px-6 py-8 md:px-8 ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50"
                  : "bg-gradient-to-r from-amber-50 to-orange-50"
              }`}
            >
              <div
                className={`absolute -right-10 -top-16 h-40 w-40 rounded-full blur-2xl ${
                  isCompleted
                    ? "bg-emerald-100/70"
                    : "bg-amber-100/70"
                }`}
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <ShieldCheck size={28} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isCompleted
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {isCompleted
                        ? "Record Completed"
                        : "Record Archived"}
                    </p>

                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-black tracking-wide ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <h1 className="mt-1 text-2xl font-black text-slate-900">
                    {lockedTitle}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {lockedDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Patient
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {record.patientName || "—"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {record.patientNumber || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pregnancy
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    Pregnancy #{record.pregnancyId || "—"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Relationship locked
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Labour Record
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    #{record.id}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Clinical editing locked
                  </p>
                </div>
              </div>

              {isCompleted && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Delivery record imekamilika
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        Labour clinical data haiwezi tena
                        kuhaririwa. Unaweza kuendelea kuona
                        Labour Profile na Newborn Records
                        zilizounganishwa na Labour hii.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isArchived && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Historical record
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Record hii imehifadhiwa kwa ajili ya
                        historia na audit. Haiwezi kuhaririwa.
                      </p>

                      {record.archiveReason && (
                        <p className="mt-2 text-xs font-semibold text-amber-800">
                          Sababu: {record.archiveReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/maternity/labour-records/${id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  <ArrowLeft size={17} />
                  Angalia Profile
                </Link>

                <Link
                  to="/maternity/labour-records"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Labour Records
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500 shadow-lg">
          <div className="relative overflow-hidden px-5 py-6 md:px-8 md:py-7">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-orange-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Link
                  to={`/maternity/labour-records/${id}`}
                  className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                  title="Rudi Profile"
                >
                  <ArrowLeft size={20} />
                </Link>

                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Stethoscope size={14} />
                    Labour & Delivery
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                    Hariri Labour Record
                  </h1>

                  <p className="mt-1 text-sm text-rose-100">
                    Rekebisha taarifa za labour, delivery na
                    postpartum za mgonjwa.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs font-medium text-rose-100">
                  Labour Record ID
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  #{id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PATIENT SUMMARY */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Mgonjwa
                </p>

                <p className="truncate text-sm font-bold text-slate-800">
                  {record.patientName || "—"}
                </p>

                <p className="text-xs text-slate-500">
                  {record.patientNumber || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Baby size={20} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Pregnancy
                </p>

                <p className="text-sm font-bold text-slate-800">
                  Pregnancy #{record.pregnancyId}
                </p>

                <p className="text-xs text-slate-500">
                  Relationship locked
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Record Status
                </p>

                <p className="text-sm font-black text-emerald-800">
                  {record.recordStatus || "ACTIVE"}
                </p>

                <p className="text-xs text-emerald-700">
                  ACTIVE record inaruhusiwa kuhaririwa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* IMPORTANT NOTE */}
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-bold text-blue-900">
                Pregnancy relationship imelindwa
              </p>

              <p className="mt-0.5 text-xs leading-5 text-blue-700">
                Pregnancy iliyounganishwa na Labour Record hii
                haiwezi kubadilishwa wakati wa edit. Taarifa nyingine
                zinaweza kusasishwa bila kuvunja historia ya mgonjwa.
              </p>
            </div>
          </div>
        </div>

        {/* ERRORS */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ADMISSION */}
          <SectionCard
            theme="admission"
            title="Admission"
            subtitle="Taarifa za mgonjwa wakati wa kuwasili labour ward."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel required>Admission Date</FieldLabel>

                <input
                  type="date"
                  name="admissionDate"
                  value={form.admissionDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <FieldLabel required>Admission Time</FieldLabel>

                <input
                  type="time"
                  name="admissionTime"
                  value={form.admissionTime}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <FieldLabel>Admission Reason</FieldLabel>

                <input
                  type="text"
                  name="admissionReason"
                  value={form.admissionReason}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Sababu ya kuja hospitali"
                />
              </div>

              <div>
                <FieldLabel>Labour Onset</FieldLabel>

                <select
                  name="labourOnset"
                  value={form.labourOnset}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="SPONTANEOUS">Spontaneous</option>
                  <option value="INDUCED">Induced</option>
                  <option value="AUGMENTED">Augmented</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* LABOUR PROGRESS */}
          <SectionCard
            theme="labour"
            title="Labour Progress"
            subtitle="Taarifa za maendeleo ya labour na uterine activity."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>Labour Stage</FieldLabel>

                <select
                  name="labourStage"
                  value={form.labourStage}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="FIRST_STAGE">First Stage</option>
                  <option value="SECOND_STAGE">Second Stage</option>
                  <option value="THIRD_STAGE">Third Stage</option>
                  <option value="FOURTH_STAGE">Fourth Stage</option>
                </select>
              </div>

              <div>
                <FieldLabel>Membrane Status</FieldLabel>

                <select
                  name="membraneStatus"
                  value={form.membraneStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="INTACT">Intact</option>
                  <option value="RUPTURED">Ruptured</option>
                </select>
              </div>

              <div>
                <FieldLabel>Liquor</FieldLabel>

                <select
                  name="liquor"
                  value={form.liquor}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="CLEAR">Clear</option>
                  <option value="MECONIUM">Meconium</option>
                  <option value="BLOOD_STAINED">Blood Stained</option>
                  <option value="FOUL_SMELLING">
                    Foul Smelling
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>Cervical Dilation</FieldLabel>

                <input
                  type="text"
                  name="cervicalDilation"
                  value={form.cervicalDilation}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. 5 cm"
                />
              </div>

              <div>
                <FieldLabel>Cervical Effacement</FieldLabel>

                <input
                  type="text"
                  name="cervicalEffacement"
                  value={form.cervicalEffacement}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. 80%"
                />
              </div>

              <div>
                <FieldLabel>Fetal Descent</FieldLabel>

                <input
                  type="text"
                  name="fetalDescent"
                  value={form.fetalDescent}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. Station 0"
                />
              </div>

              <div>
                <FieldLabel>Contraction Frequency</FieldLabel>

                <input
                  type="text"
                  name="contractionFrequency"
                  value={form.contractionFrequency}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. 3 in 10 min"
                />
              </div>

              <div>
                <FieldLabel>Contraction Duration</FieldLabel>

                <input
                  type="text"
                  name="contractionDuration"
                  value={form.contractionDuration}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. 40 sec"
                />
              </div>
            </div>
          </SectionCard>

          {/* MATERNAL */}
          <SectionCard
            theme="maternal"
            title="Maternal Assessment"
            subtitle="Vital signs, pain, bleeding na hali ya mama."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel>Weight (kg)</FieldLabel>

                <input
                  type="number"
                  step="0.1"
                  name="maternalWeight"
                  value={form.maternalWeight}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="kg"
                />
              </div>

              <div>
                <FieldLabel>BP Systolic</FieldLabel>

                <input
                  type="number"
                  name="maternalBpSystolic"
                  value={form.maternalBpSystolic}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mmHg"
                />
              </div>

              <div>
                <FieldLabel>BP Diastolic</FieldLabel>

                <input
                  type="number"
                  name="maternalBpDiastolic"
                  value={form.maternalBpDiastolic}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mmHg"
                />
              </div>

              <div>
                <FieldLabel>Pulse</FieldLabel>

                <input
                  type="number"
                  name="maternalPulse"
                  value={form.maternalPulse}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="bpm"
                />
              </div>

              <div>
                <FieldLabel>Temperature</FieldLabel>

                <input
                  type="number"
                  step="0.1"
                  name="maternalTemperature"
                  value={form.maternalTemperature}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="°C"
                />
              </div>

              <div>
                <FieldLabel>Respiratory Rate</FieldLabel>

                <input
                  type="number"
                  name="maternalRespiratoryRate"
                  value={form.maternalRespiratoryRate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="breaths/min"
                />
              </div>

              <div>
                <FieldLabel>Pain Score</FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="10"
                  name="painScore"
                  value={form.painScore}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0 - 10"
                />
              </div>

              <div>
                <FieldLabel>Bleeding</FieldLabel>

                <select
                  name="bleeding"
                  value={form.bleeding}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="NONE">None</option>
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <FieldLabel>Maternal Condition</FieldLabel>

                <textarea
                  name="maternalCondition"
                  value={form.maternalCondition}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Eleza hali ya mama..."
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <FieldLabel>Complications</FieldLabel>

                <textarea
                  name="complications"
                  value={form.complications}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Complications zilizopo kama zipo..."
                />
              </div>
            </div>
          </SectionCard>

          {/* FETAL */}
          <SectionCard
            theme="fetal"
            title="Fetal Assessment"
            subtitle="Taarifa za mtoto wakati wa labour."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>Fetal Heart Rate</FieldLabel>

                <input
                  type="number"
                  name="fetalHeartRate"
                  value={form.fetalHeartRate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="bpm"
                />
              </div>

              <div>
                <FieldLabel>Fetal Condition</FieldLabel>

                <select
                  name="fetalCondition"
                  value={form.fetalCondition}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="REASSURING">Reassuring</option>
                  <option value="NON_REASSURING">
                    Non-Reassuring
                  </option>
                  <option value="DISTRESSED">Distressed</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div>
                <FieldLabel>Fetal Presentation</FieldLabel>

                <select
                  name="fetalPresentation"
                  value={form.fetalPresentation}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="CEPHALIC">Cephalic</option>
                  <option value="BREECH">Breech</option>
                  <option value="SHOULDER">Shoulder</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <FieldLabel>Fetal Lie</FieldLabel>

                <select
                  name="fetalLie"
                  value={form.fetalLie}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="LONGITUDINAL">Longitudinal</option>
                  <option value="TRANSVERSE">Transverse</option>
                  <option value="OBLIQUE">Oblique</option>
                </select>
              </div>

              <div>
                <FieldLabel>Fetal Position</FieldLabel>

                <input
                  type="text"
                  name="fetalPosition"
                  value={form.fetalPosition}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="mf. LOA"
                />
              </div>

              <div>
                <FieldLabel>Fetal Movement</FieldLabel>

                <select
                  name="fetalMovement"
                  value={form.fetalMovement}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="PRESENT">Present</option>
                  <option value="REDUCED">Reduced</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* DELIVERY */}
          <SectionCard
            theme="delivery"
            title="Delivery & Outcome"
            subtitle="Taarifa muhimu za kujifungua na outcome ya mtoto."
            highlight
          >
            <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Baby size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-orange-950">
                    Delivery outcome
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-orange-800">
                    Jaza taarifa hizi pale delivery imefanyika au
                    taarifa yake inahitaji kusahihishwa.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>Delivery Date</FieldLabel>

                <input
                  type="date"
                  name="deliveryDate"
                  value={form.deliveryDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>Delivery Time</FieldLabel>

                <input
                  type="time"
                  name="deliveryTime"
                  value={form.deliveryTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>Delivery Mode</FieldLabel>

                <select
                  name="deliveryMode"
                  value={form.deliveryMode}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="SVD">SVD</option>
                  <option value="ASSISTED_VAGINAL">
                    Assisted Vaginal
                  </option>
                  <option value="C_SECTION">C-Section</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <FieldLabel>Delivery Indication</FieldLabel>

                <input
                  type="text"
                  name="deliveryIndication"
                  value={form.deliveryIndication}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Sababu ya delivery mode"
                />
              </div>

              <div>
                <FieldLabel>Delivery Outcome</FieldLabel>

                <select
                  name="deliveryOutcome"
                  value={form.deliveryOutcome}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="LIVE_BIRTH">Live Birth</option>
                  <option value="STILLBIRTH">Stillbirth</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <FieldLabel>Delivery Complications</FieldLabel>

                <textarea
                  name="deliveryComplications"
                  value={form.deliveryComplications}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Complications wakati wa delivery..."
                />
              </div>
            </div>
          </SectionCard>

          {/* POSTPARTUM */}
          <SectionCard
            theme="postpartum"
            title="Postpartum / Mother After Delivery"
            subtitle="Taarifa za mama baada ya kujifungua."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel>Maternal Outcome</FieldLabel>

                <select
                  name="maternalOutcome"
                  value={form.maternalOutcome}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="STABLE">Stable</option>
                  <option value="REFERRED">Referred</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="DECEASED">Deceased</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <FieldLabel>Postpartum Bleeding</FieldLabel>

                <select
                  name="postpartumBleeding"
                  value={form.postpartumBleeding}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="NONE">None</option>
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
              </div>

              <div>
                <FieldLabel>Placenta Status</FieldLabel>

                <select
                  name="placentaStatus"
                  value={form.placentaStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Chagua</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="RETAINED">Retained</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div>
                <FieldLabel>Estimated Blood Loss (ml)</FieldLabel>

                <input
                  type="number"
                  name="estimatedBloodLoss"
                  value={form.estimatedBloodLoss}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="ml"
                />
              </div>
            </div>
          </SectionCard>

          {/* CLINICAL MANAGEMENT */}
          <SectionCard
            theme="clinical"
            title="Clinical Management"
            subtitle="Assessment, diagnosis na management iliyotolewa."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Assessment</FieldLabel>

                <textarea
                  name="assessment"
                  value={form.assessment}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Clinical assessment..."
                />
              </div>

              <div>
                <FieldLabel>Diagnosis</FieldLabel>

                <textarea
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Diagnosis..."
                />
              </div>

              <div>
                <FieldLabel>Treatment</FieldLabel>

                <textarea
                  name="treatment"
                  value={form.treatment}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Treatment iliyotolewa..."
                />
              </div>

              <div>
                <FieldLabel>Medication</FieldLabel>

                <textarea
                  name="medication"
                  value={form.medication}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Medication..."
                />
              </div>

              <div>
                <FieldLabel>Referral</FieldLabel>

                <textarea
                  name="referral"
                  value={form.referral}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Referral details kama ipo..."
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Maelezo ya ziada..."
                />
              </div>
            </div>
          </SectionCard>

          {/* FOOTER ACTIONS */}
          <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-xs text-slate-500 sm:text-left">
                <p className="font-medium text-slate-600">
                  Labour Record #{id}
                </p>

                <p className="mt-0.5">
                  Mabadiliko yatahifadhiwa kwenye database.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/maternity/labour-records/${id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={18} />
                  Ghairi
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        className="animate-spin"
                        size={18}
                      />
                      Inahifadhi...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Hifadhi Mabadiliko
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}