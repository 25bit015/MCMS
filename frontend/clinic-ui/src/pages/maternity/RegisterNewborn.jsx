import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Loader2,
  Activity,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

const initialForm = {
  labourRecordId: "",
  dateOfBirth: "",
  timeOfBirth: "",
  sex: "",
  birthOrder: "1",

  birthWeight: "",
  birthLength: "",
  headCircumference: "",

  apgarOneMinute: "",
  apgarFiveMinutes: "",
  apgarTenMinutes: "",

  conditionAtBirth: "",
  cryAtBirth: "",
  breathingAtBirth: "",
  muscleTone: "",
  skinColour: "",

  resuscitationRequired: false,
  resuscitationMethod: "",
  resuscitationDuration: "",

  congenitalAbnormalities: "",
  clinicalCondition: "",
  temperature: "",
  heartRate: "",
  respiratoryRate: "",

  breastfeedingStarted: false,
  breastfeedingTime: "",
  skinToSkin: false,
  vitaminKGiven: false,
  bcgGiven: false,
  opvGiven: false,

  newbornOutcome: "ALIVE",
  placeOfCare: "",
  referralRequired: false,
  referralReason: "",

  assessment: "",
  treatment: "",
  notes: "",
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Imeshindikana kusajili taarifa za newborn."
  );
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed === "" ? null : trimmed;
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  tone = "blue",
}) {
  const tones = {
    blue: {
      wrapper: "border-blue-100",
      header: "bg-blue-50/70",
      icon: "bg-blue-100 text-blue-700",
    },
    pink: {
      wrapper: "border-pink-100",
      header: "bg-pink-50/70",
      icon: "bg-pink-100 text-pink-700",
    },
    purple: {
      wrapper: "border-purple-100",
      header: "bg-purple-50/70",
      icon: "bg-purple-100 text-purple-700",
    },
    emerald: {
      wrapper: "border-emerald-100",
      header: "bg-emerald-50/70",
      icon: "bg-emerald-100 text-emerald-700",
    },
    orange: {
      wrapper: "border-orange-100",
      header: "bg-orange-50/70",
      icon: "bg-orange-100 text-orange-700",
    },
    slate: {
      wrapper: "border-slate-200",
      header: "bg-slate-50",
      icon: "bg-slate-100 text-slate-700",
    },
  };

  const selected = tones[tone] || tones.blue;

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${selected.wrapper}`}
    >
      <div
        className={`flex items-start gap-3 border-b border-slate-100 px-5 py-4 ${selected.header}`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
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
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

const selectClass = inputClass;

const textareaClass =
  "min-h-[105px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

function ToggleField({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>

        {description && (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export default function RegisterNewborn() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const requestedLabourRecordId =
    searchParams.get("labourRecordId") || "";

  const isLabourPreselected =
    Boolean(requestedLabourRecordId);

  const [form, setForm] = useState(() => ({
    ...initialForm,
    labourRecordId: requestedLabourRecordId,
  }));

  const [labourRecords, setLabourRecords] = useState([]);
  const [loadingLabour, setLoadingLabour] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadLabourRecords = async () => {
      try {
        setLoadingLabour(true);
        setError("");

        const response = await api.get(
          "/maternity/labour-records"
        );

        const records = Array.isArray(response.data)
          ? response.data
          : [];

        /*
         * Newborn registration is allowed for:
         * ACTIVE    -> Labour is still ongoing.
         * COMPLETED -> Delivery/labour is completed and
         *              newborn is now being recorded.
         *
         * ARCHIVED is excluded because it is a locked
         * historical record.
         */
        const eligibleRecords = records.filter((record) => {
          const status = String(
            record.recordStatus || ""
          ).toUpperCase();

          return (
            status === "ACTIVE" ||
            status === "COMPLETED"
          );
        });

        setLabourRecords(eligibleRecords);

        if (requestedLabourRecordId) {
          const matchingRecord = eligibleRecords.find(
            (record) =>
              String(record.id) ===
              String(requestedLabourRecordId)
          );

          if (matchingRecord) {
            setForm((current) => ({
              ...current,
              labourRecordId: String(matchingRecord.id),
            }));
          } else {
            setForm((current) => ({
              ...current,
              labourRecordId: "",
            }));

            setError(
              `Labour Record #${requestedLabourRecordId} haipatikani au umehifadhiwa kama ARCHIVED.`
            );
          }
        }
      } catch (err) {
        console.error(
          "Failed to load eligible labour records:",
          err
        );

        setError(getErrorMessage(err));
      } finally {
        setLoadingLabour(false);
      }
    };

    loadLabourRecords();
  }, [requestedLabourRecordId]);

  const selectedLabour = useMemo(() => {
    return labourRecords.find(
      (record) =>
        String(record.id) ===
        String(form.labourRecordId)
    );
  }, [labourRecords, form.labourRecordId]);

  const selectedLabourStatus = String(
    selectedLabour?.recordStatus || ""
  ).toUpperCase();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      labourRecordId: requestedLabourRecordId,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.labourRecordId) {
      setError("Tafadhali chagua Labour Record.");
      return;
    }

    if (!form.dateOfBirth) {
      setError("Tarehe ya kuzaliwa inahitajika.");
      return;
    }

    if (!form.timeOfBirth) {
      setError("Muda wa kuzaliwa unahitajika.");
      return;
    }

    if (!form.sex) {
      setError("Tafadhali chagua jinsia ya mtoto.");
      return;
    }

    if (
      form.birthOrder === "" ||
      Number(form.birthOrder) < 1
    ) {
      setError("Birth order lazima iwe namba kuanzia 1.");
      return;
    }

    if (form.resuscitationRequired) {
      if (!form.resuscitationMethod.trim()) {
        setError(
          "Tafadhali weka njia ya resuscitation iliyotumika."
        );
        return;
      }
    }

    if (form.referralRequired) {
      if (!form.referralReason.trim()) {
        setError(
          "Tafadhali eleza sababu ya referral."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        labourRecordId: Number(form.labourRecordId),

        dateOfBirth: form.dateOfBirth,
        timeOfBirth: normalizeString(form.timeOfBirth),
        sex: normalizeString(form.sex),
        birthOrder: normalizeNumber(form.birthOrder),

        birthWeight: normalizeNumber(form.birthWeight),
        birthLength: normalizeNumber(form.birthLength),
        headCircumference: normalizeNumber(
          form.headCircumference
        ),

        apgarOneMinute: normalizeNumber(
          form.apgarOneMinute
        ),
        apgarFiveMinutes: normalizeNumber(
          form.apgarFiveMinutes
        ),
        apgarTenMinutes: normalizeNumber(
          form.apgarTenMinutes
        ),

        conditionAtBirth: normalizeString(
          form.conditionAtBirth
        ),
        cryAtBirth: normalizeString(form.cryAtBirth),
        breathingAtBirth: normalizeString(
          form.breathingAtBirth
        ),
        muscleTone: normalizeString(form.muscleTone),
        skinColour: normalizeString(form.skinColour),

        resuscitationRequired:
          Boolean(form.resuscitationRequired),

        resuscitationMethod:
          form.resuscitationRequired
            ? normalizeString(form.resuscitationMethod)
            : null,

        resuscitationDuration:
          form.resuscitationRequired
            ? normalizeString(form.resuscitationDuration)
            : null,

        congenitalAbnormalities: normalizeString(
          form.congenitalAbnormalities
        ),

        clinicalCondition: normalizeString(
          form.clinicalCondition
        ),

        temperature: normalizeNumber(form.temperature),

        heartRate: normalizeNumber(form.heartRate),

        respiratoryRate: normalizeNumber(
          form.respiratoryRate
        ),

        breastfeedingStarted:
          Boolean(form.breastfeedingStarted),

        breastfeedingTime:
          form.breastfeedingStarted
            ? normalizeString(form.breastfeedingTime)
            : null,

        skinToSkin: Boolean(form.skinToSkin),

        vitaminKGiven: Boolean(form.vitaminKGiven),

        bcgGiven: Boolean(form.bcgGiven),

        opvGiven: Boolean(form.opvGiven),

        newbornOutcome: normalizeString(
          form.newbornOutcome
        ),

        placeOfCare: normalizeString(form.placeOfCare),

        referralRequired:
          Boolean(form.referralRequired),

        referralReason:
          form.referralRequired
            ? normalizeString(form.referralReason)
            : null,

        assessment: normalizeString(form.assessment),

        treatment: normalizeString(form.treatment),

        notes: normalizeString(form.notes),
      };

      const response = await api.post(
        "/maternity/newborn-records",
        payload
      );

      const savedRecord = response.data;

      setSuccess(
        "Taarifa za newborn zimesajiliwa kwa mafanikio."
      );

      setTimeout(() => {
        if (savedRecord?.id) {
          navigate(
            `/maternity/newborn-records/${savedRecord.id}`
          );
        } else {
          navigate("/maternity/newborn-records");
        }
      }, 700);
    } catch (err) {
      console.error(
        "Failed to register newborn:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/maternity/newborn-records"
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                title="Rudi kwenye Newborn Records"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                    MATERNITY
                  </span>

                  <span className="rounded-full bg-pink-400/15 px-3 py-1 text-xs font-semibold text-pink-100 ring-1 ring-pink-300/20">
                    Newborn Care
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Sajili Newborn
                </h1>

                <p className="mt-1 text-sm text-blue-100 sm:text-base">
                  Ingiza taarifa za mtoto aliyezaliwa na
                  huduma za awali za newborn.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-medium text-blue-50 ring-1 ring-white/10 sm:flex">
              <ShieldCheck className="h-4 w-4" />
              Record itahifadhiwa kama ACTIVE
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Alerts */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-bold">
                    Imeshindikana kuhifadhi taarifa
                  </p>

                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />

                <p className="font-semibold">
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* Mother / Labour */}
          <SectionCard
            icon={UserRound}
            title="Mama & Labour Record"
            subtitle={
              isLabourPreselected
                ? "Labour Record imechaguliwa moja kwa moja kutoka kwenye Labour Profile."
                : "Chagua Labour Record yenye status ACTIVE au COMPLETED inayohusiana na mtoto huyu."
            }
            tone="blue"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel required>
                  Labour Record
                </FieldLabel>

                {loadingLabour ? (
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inapakia Labour Records...
                  </div>
                ) : (
                  <select
                    name="labourRecordId"
                    value={form.labourRecordId}
                    onChange={handleChange}
                    disabled={isLabourPreselected}
                    className={`${selectClass} ${
                      isLabourPreselected
                        ? "cursor-not-allowed bg-blue-50 text-blue-800 ring-1 ring-blue-100"
                        : ""
                    }`}
                  >
                    <option value="">
                      -- Chagua Labour Record --
                    </option>

                    {labourRecords.map((record) => {
                      const status = String(
                        record.recordStatus || ""
                      ).toUpperCase();

                      return (
                        <option
                          key={record.id}
                          value={record.id}
                        >
                          #{record.id} —{" "}
                          {record.patientName ||
                            "Mgonjwa hajulikani"}{" "}
                          —{" "}
                          {record.patientNumber ||
                            "No Patient Number"}{" "}
                          — {record.admissionDate || ""} —{" "}
                          {status}
                        </option>
                      );
                    })}
                  </select>
                )}

                {isLabourPreselected && (
                  <p className="mt-2 text-xs font-medium text-blue-600">
                    Labour Record imechaguliwa kutoka
                    kwenye Labour Record Profile.
                  </p>
                )}

                {!loadingLabour &&
                  labourRecords.length === 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      Hakuna Labour Record yenye status
                      ACTIVE au COMPLETED inayopatikana.
                    </p>
                  )}
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Selected Labour Record
                  </p>

                  {selectedLabourStatus && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        selectedLabourStatus === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedLabourStatus}
                    </span>
                  )}
                </div>

                {selectedLabour ? (
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">
                        Mama
                      </p>

                      <p className="font-bold text-slate-800">
                        {selectedLabour.patientName || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Patient No.
                      </p>

                      <p className="font-bold text-slate-800">
                        {selectedLabour.patientNumber || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Pregnancy
                      </p>

                      <p className="font-bold text-slate-800">
                        #{selectedLabour.pregnancyId || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Labour
                      </p>

                      <p className="font-bold text-slate-800">
                        #{selectedLabour.id}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Chagua Labour Record kuona taarifa
                    za mama.
                  </p>
                )}

                {selectedLabourStatus === "COMPLETED" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                    Labour imekamilika. Unaweza sasa
                    kurekodi taarifa za newborn chini ya
                    Labour Record hii.
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Birth information */}
          <SectionCard
            icon={Baby}
            title="Taarifa za Kuzaliwa"
            subtitle="Taarifa msingi za mtoto wakati wa kuzaliwa."
            tone="pink"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel required>
                  Tarehe ya Kuzaliwa
                </FieldLabel>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>
                  Muda wa Kuzaliwa
                </FieldLabel>

                <input
                  type="time"
                  name="timeOfBirth"
                  value={form.timeOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>
                  Jinsia
                </FieldLabel>

                <select
                  name="sex"
                  value={form.sex}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">
                    -- Chagua Jinsia --
                  </option>
                  <option value="MALE">Mwanaume</option>
                  <option value="FEMALE">Mwanamke</option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Birth Order
                </FieldLabel>

                <input
                  type="number"
                  min="1"
                  name="birthOrder"
                  value={form.birthOrder}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Measurements */}
          <SectionCard
            icon={HeartPulse}
            title="Vipimo vya Mtoto"
            subtitle="Vipimo muhimu vya newborn baada ya kuzaliwa."
            tone="purple"
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <FieldLabel>
                  Birth Weight (kg)
                </FieldLabel>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="birthWeight"
                  value={form.birthWeight}
                  onChange={handleChange}
                  placeholder="Mfano: 3.2"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Birth Length (cm)
                </FieldLabel>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="birthLength"
                  value={form.birthLength}
                  onChange={handleChange}
                  placeholder="Mfano: 50"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Head Circumference (cm)
                </FieldLabel>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="headCircumference"
                  value={form.headCircumference}
                  onChange={handleChange}
                  placeholder="Mfano: 34"
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* APGAR */}
          <SectionCard
            icon={Activity}
            title="APGAR & Condition at Birth"
            subtitle="Tathmini ya mtoto dakika 1, 5 na 10."
            tone="emerald"
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <FieldLabel>
                  APGAR — 1 Minute
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="10"
                  name="apgarOneMinute"
                  value={form.apgarOneMinute}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  APGAR — 5 Minutes
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="10"
                  name="apgarFiveMinutes"
                  value={form.apgarFiveMinutes}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  APGAR — 10 Minutes
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="10"
                  name="apgarTenMinutes"
                  value={form.apgarTenMinutes}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>
                  Condition at Birth
                </FieldLabel>

                <input
                  type="text"
                  name="conditionAtBirth"
                  value={form.conditionAtBirth}
                  onChange={handleChange}
                  placeholder="Mfano: Stable"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Cry at Birth
                </FieldLabel>

                <input
                  type="text"
                  name="cryAtBirth"
                  value={form.cryAtBirth}
                  onChange={handleChange}
                  placeholder="Mfano: Strong cry"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Breathing at Birth
                </FieldLabel>

                <input
                  type="text"
                  name="breathingAtBirth"
                  value={form.breathingAtBirth}
                  onChange={handleChange}
                  placeholder="Mfano: Spontaneous"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Muscle Tone
                </FieldLabel>

                <input
                  type="text"
                  name="muscleTone"
                  value={form.muscleTone}
                  onChange={handleChange}
                  placeholder="Mfano: Good"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Skin Colour
                </FieldLabel>

                <input
                  type="text"
                  name="skinColour"
                  value={form.skinColour}
                  onChange={handleChange}
                  placeholder="Mfano: Pink"
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Resuscitation */}
          <SectionCard
            icon={Stethoscope}
            title="Resuscitation"
            subtitle="Taarifa za msaada wa kupumua au resuscitation."
            tone="orange"
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-3">
                <ToggleField
                  label="Resuscitation ilihitajika"
                  description="Weka tiki kama mtoto alihitaji resuscitation."
                  checked={form.resuscitationRequired}
                  onChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      resuscitationRequired: checked,
                      ...(checked
                        ? {}
                        : {
                            resuscitationMethod: "",
                            resuscitationDuration: "",
                          }),
                    }))
                  }
                />
              </div>

              {form.resuscitationRequired && (
                <>
                  <div>
                    <FieldLabel required>
                      Resuscitation Method
                    </FieldLabel>

                    <input
                      type="text"
                      name="resuscitationMethod"
                      value={form.resuscitationMethod}
                      onChange={handleChange}
                      placeholder="Mfano: Bag and mask"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Duration
                    </FieldLabel>

                    <input
                      type="text"
                      name="resuscitationDuration"
                      value={form.resuscitationDuration}
                      onChange={handleChange}
                      placeholder="Mfano: 2 minutes"
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Clinical condition */}
          <SectionCard
            icon={HeartPulse}
            title="Clinical Condition"
            subtitle="Tathmini ya hali ya mtoto baada ya kuzaliwa."
            tone="blue"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>
                  Congenital Abnormalities
                </FieldLabel>

                <input
                  type="text"
                  name="congenitalAbnormalities"
                  value={form.congenitalAbnormalities}
                  onChange={handleChange}
                  placeholder="Mfano: None observed"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Clinical Condition
                </FieldLabel>

                <input
                  type="text"
                  name="clinicalCondition"
                  value={form.clinicalCondition}
                  onChange={handleChange}
                  placeholder="Mfano: Stable"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Temperature (°C)
                </FieldLabel>

                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={form.temperature}
                  onChange={handleChange}
                  placeholder="Mfano: 36.7"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Heart Rate
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  name="heartRate"
                  value={form.heartRate}
                  onChange={handleChange}
                  placeholder="bpm"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Respiratory Rate
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  name="respiratoryRate"
                  value={form.respiratoryRate}
                  onChange={handleChange}
                  placeholder="breaths/min"
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Immediate care */}
          <SectionCard
            icon={Baby}
            title="Immediate Newborn Care"
            subtitle="Huduma muhimu za awali baada ya kuzaliwa."
            tone="pink"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ToggleField
                label="Breastfeeding started"
                description="Mtoto ameanza kunyonya."
                checked={form.breastfeedingStarted}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    breastfeedingStarted: checked,
                    ...(checked
                      ? {}
                      : {
                          breastfeedingTime: "",
                        }),
                  }))
                }
              />

              <ToggleField
                label="Skin-to-skin"
                description="Skin-to-skin care imefanyika."
                checked={form.skinToSkin}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    skinToSkin: checked,
                  }))
                }
              />

              <ToggleField
                label="Vitamin K given"
                description="Vitamin K imetolewa."
                checked={form.vitaminKGiven}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    vitaminKGiven: checked,
                  }))
                }
              />

              <ToggleField
                label="BCG given"
                description="BCG vaccine imetolewa."
                checked={form.bcgGiven}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    bcgGiven: checked,
                  }))
                }
              />

              <ToggleField
                label="OPV given"
                description="OPV vaccine imetolewa."
                checked={form.opvGiven}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    opvGiven: checked,
                  }))
                }
              />
            </div>

            {form.breastfeedingStarted && (
              <div className="mt-5 max-w-sm">
                <FieldLabel>
                  Breastfeeding Time
                </FieldLabel>

                <input
                  type="time"
                  name="breastfeedingTime"
                  value={form.breastfeedingTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            )}
          </SectionCard>

          {/* Outcome */}
          <SectionCard
            icon={ShieldCheck}
            title="Outcome & Referral"
            subtitle="Outcome ya mtoto na kama anahitaji referral."
            tone="emerald"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel>
                  Newborn Outcome
                </FieldLabel>

                <select
                  name="newbornOutcome"
                  value={form.newbornOutcome}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="ALIVE">Alive</option>
                  <option value="STILLBIRTH">
                    Stillbirth
                  </option>
                  <option value="DECEASED">
                    Deceased
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Place of Care
                </FieldLabel>

                <input
                  type="text"
                  name="placeOfCare"
                  value={form.placeOfCare}
                  onChange={handleChange}
                  placeholder="Mfano: Labour Ward"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <ToggleField
                  label="Referral Required"
                  description="Weka tiki kama mtoto anahitaji kuhamishiwa huduma nyingine."
                  checked={form.referralRequired}
                  onChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      referralRequired: checked,
                      ...(checked
                        ? {}
                        : {
                            referralReason: "",
                          }),
                    }))
                  }
                />
              </div>

              {form.referralRequired && (
                <div className="sm:col-span-2">
                  <FieldLabel required>
                    Referral Reason
                  </FieldLabel>

                  <textarea
                    name="referralReason"
                    value={form.referralReason}
                    onChange={handleChange}
                    placeholder="Eleza sababu ya referral..."
                    className={textareaClass}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Clinical management */}
          <SectionCard
            icon={ClipboardList}
            title="Clinical Management"
            subtitle="Assessment, treatment na notes za kitabibu."
            tone="purple"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel>
                  Assessment
                </FieldLabel>

                <textarea
                  name="assessment"
                  value={form.assessment}
                  onChange={handleChange}
                  placeholder="Andika clinical assessment..."
                  className={textareaClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Treatment
                </FieldLabel>

                <textarea
                  name="treatment"
                  value={form.treatment}
                  onChange={handleChange}
                  placeholder="Andika treatment/care iliyotolewa..."
                  className={textareaClass}
                />
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>
                  Notes
                </FieldLabel>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Maelezo mengine muhimu..."
                  className={textareaClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Footer actions */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/maternity/newborn-records"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Ghairi
              </Link>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anza Upya
                </button>

                <button
                  type="submit"
                  disabled={saving || loadingLabour}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Inahifadhi...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Sajili Newborn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}