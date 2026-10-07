import { useEffect, useMemo, useState } from "react";
import {
AlertTriangle,
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
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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

function SectionCard({ icon: Icon, title, subtitle, children }) {
return ( <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"> <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4"> <div className="flex items-start gap-3"> <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"> <Icon size={20} /> </div>


      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>

        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  </div>

  <div className="p-5">{children}</div>
</section>


);
}

function FieldLabel({ children, required = false }) {
return ( <label className="mb-1.5 block text-sm font-semibold text-slate-700">
{children}
{required && <span className="ml-1 text-red-500">*</span>} </label>
);
}

function inputClass(hasError = false) {
return `w-full rounded-xl border ${
    hasError ? "border-red-400 bg-red-50/40" : "border-slate-200 bg-white"
  } px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10`;
}

function textareaClass() {
return "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10";
}

function normalizeNumber(value) {
if (value === "" || value === null || value === undefined) {
return null;
}

const number = Number(value);

return Number.isNaN(number) ? null : number;
}

function normalizePayload(form) {
return {
pregnancyId: Number(form.pregnancyId),


admissionDate: form.admissionDate || null,
admissionTime: form.admissionTime || null,
admissionReason: form.admissionReason.trim() || null,
labourOnset: form.labourOnset.trim() || null,
labourStage: form.labourStage || null,
membraneStatus: form.membraneStatus.trim() || null,
liquor: form.liquor.trim() || null,
cervicalDilation: form.cervicalDilation.trim() || null,
cervicalEffacement: form.cervicalEffacement.trim() || null,
fetalDescent: form.fetalDescent.trim() || null,
contractionFrequency: form.contractionFrequency.trim() || null,
contractionDuration: form.contractionDuration.trim() || null,

maternalWeight: normalizeNumber(form.maternalWeight),
maternalBpSystolic: normalizeNumber(form.maternalBpSystolic),
maternalBpDiastolic: normalizeNumber(form.maternalBpDiastolic),
maternalPulse: normalizeNumber(form.maternalPulse),
maternalTemperature: normalizeNumber(form.maternalTemperature),
maternalRespiratoryRate: normalizeNumber(form.maternalRespiratoryRate),
maternalCondition: form.maternalCondition.trim() || null,
painScore: normalizeNumber(form.painScore),
bleeding: form.bleeding.trim() || null,
complications: form.complications.trim() || null,

fetalHeartRate: normalizeNumber(form.fetalHeartRate),
fetalCondition: form.fetalCondition.trim() || null,
fetalPresentation: form.fetalPresentation.trim() || null,
fetalLie: form.fetalLie.trim() || null,
fetalPosition: form.fetalPosition.trim() || null,
fetalMovement: form.fetalMovement.trim() || null,

deliveryDate: form.deliveryDate || null,
deliveryTime: form.deliveryTime || null,
deliveryMode: form.deliveryMode || null,
deliveryIndication: form.deliveryIndication.trim() || null,
deliveryOutcome: form.deliveryOutcome.trim() || null,
deliveryComplications: form.deliveryComplications.trim() || null,

maternalOutcome: form.maternalOutcome.trim() || null,
postpartumBleeding: form.postpartumBleeding.trim() || null,
placentaStatus: form.placentaStatus.trim() || null,
estimatedBloodLoss: normalizeNumber(form.estimatedBloodLoss),

assessment: form.assessment.trim() || null,
diagnosis: form.diagnosis.trim() || null,
treatment: form.treatment.trim() || null,
medication: form.medication.trim() || null,
referral: form.referral.trim() || null,
notes: form.notes.trim() || null,


};
}

export default function RegisterLabourRecord() {
const navigate = useNavigate();
const [searchParams] = useSearchParams();

const requestedPregnancyId = searchParams.get("pregnancyId") || "";

const isPregnancyPreselected = Boolean(requestedPregnancyId);

const [form, setForm] = useState(() => ({
...initialForm,
pregnancyId: requestedPregnancyId,
}));

const [pregnancies, setPregnancies] = useState([]);
const [loadingPregnancies, setLoadingPregnancies] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [fieldErrors, setFieldErrors] = useState({});

useEffect(() => {
loadPregnancies();
}, []);

async function loadPregnancies() {
try {
setLoadingPregnancies(true);
setError("");


  const response = await api.get("/maternity/pregnancies");

  const data = Array.isArray(response.data) ? response.data : [];

  const activePregnancies = data.filter(
    (pregnancy) =>
      String(pregnancy.status || "").toUpperCase() === "ACTIVE"
  );

  setPregnancies(activePregnancies);

  if (requestedPregnancyId) {
    const requestedPregnancy = activePregnancies.find(
      (pregnancy) =>
        String(pregnancy.id) === String(requestedPregnancyId)
    );

    if (!requestedPregnancy) {
      setForm((previous) => ({
        ...previous,
        pregnancyId: "",
      }));

      setError(
        `Pregnancy #${requestedPregnancyId} haipatikani au si ACTIVE. Tafadhali rudi kwenye Pregnancy Profile na uchague pregnancy inayofaa.`
      );
    }
  }
} catch (err) {
  console.error("Failed to load pregnancies:", err);

  setError(
    err.response?.data?.message ||
      "Imeshindikana kupakia pregnancies zilizo active."
  );
} finally {
  setLoadingPregnancies(false);
}


}

const selectedPregnancy = useMemo(() => {
if (!form.pregnancyId) return null;


return (
  pregnancies.find(
    (pregnancy) => String(pregnancy.id) === String(form.pregnancyId)
  ) || null
);


}, [form.pregnancyId, pregnancies]);

function handleChange(event) {
const { name, value } = event.target;


if (name === "pregnancyId" && isPregnancyPreselected) {
  return;
}

setForm((previous) => ({
  ...previous,
  [name]: value,
}));

if (fieldErrors[name]) {
  setFieldErrors((previous) => {
    const next = { ...previous };
    delete next[name];
    return next;
  });
}

if (error) {
  setError("");
}


}

function validate() {
const errors = {};


if (!form.pregnancyId) {
  errors.pregnancyId = "Tafadhali chagua pregnancy.";
}

if (!form.admissionDate) {
  errors.admissionDate = "Admission date inahitajika.";
}

if (!form.admissionTime) {
  errors.admissionTime = "Admission time inahitajika.";
}

setFieldErrors(errors);

return Object.keys(errors).length === 0;


}

async function handleSubmit(event) {
event.preventDefault();


if (!validate()) {
  setError("Tafadhali jaza sehemu zote muhimu kabla ya kuhifadhi.");
  return;
}

if (!selectedPregnancy) {
  setError(
    "Pregnancy uliyochagua haipo au si ACTIVE. Tafadhali chagua pregnancy nyingine."
  );
  return;
}

try {
  setSaving(true);
  setError("");

  const payload = normalizePayload(form);

  const response = await api.post(
    "/maternity/labour-records",
    payload
  );

  const savedRecord = response.data;

  window.alert(
    `Labour Record imesajiliwa kwa mafanikio!\nLabour Record ID: ${savedRecord.id}`
  );

  navigate(`/maternity/labour-records/${savedRecord.id}`);
} catch (err) {
  console.error("Failed to create Labour record:", err);

  const message =
    err.response?.data?.message ||
    "Imeshindikana kusajili Labour Record.";

  setError(message);
} finally {
  setSaving(false);
}


}

function handleReset() {
const confirmed = window.confirm(
"Una uhakika unataka kufuta taarifa ulizoingiza kwenye form?"
);


if (!confirmed) return;

setForm({
  ...initialForm,
  pregnancyId: requestedPregnancyId,
});

setFieldErrors({});
setError("");


}

return ( <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-7xl">
{/* Header */} <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-rose-600 to-orange-500 text-white shadow-lg"> <div className="p-6 sm:p-8"> <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"> <div className="flex items-start gap-4"> <Link
               to="/maternity/labour-records"
               className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
               title="Rudi Labour Records"
             > <ArrowLeft size={20} /> </Link>


            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <HeartPulse size={14} />
                Labour & Delivery
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Sajili Labour Record
              </h1>

              <p className="mt-2 text-sm text-rose-100">
                Ingiza taarifa za labour na delivery ya mama.
              </p>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur sm:block">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className="text-sm font-semibold">
                Protected Clinical Record
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 shrink-0 text-red-600"
            size={20}
          />

          <div>
            <p className="text-sm font-bold text-red-800">
              Imeshindikana kuhifadhi taarifa
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pregnancy */}
      <SectionCard
        icon={UserRound}
        title="Mgonjwa & Pregnancy"
        subtitle={
          isPregnancyPreselected
            ? "Pregnancy imechaguliwa kutoka kwenye Pregnancy Profile na imefungwa ili kulinda uhusiano wa clinical record."
            : "Chagua pregnancy active ambayo Labour Record hii inahusiana nayo."
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel required>Pregnancy</FieldLabel>

            {loadingPregnancies ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={17} />
                Inapakia pregnancies...
              </div>
            ) : (
              <>
                <select
                  name="pregnancyId"
                  value={form.pregnancyId}
                  onChange={handleChange}
                  disabled={isPregnancyPreselected}
                  className={`${inputClass(fieldErrors.pregnancyId)} ${
                    isPregnancyPreselected
                      ? "cursor-not-allowed bg-blue-50 text-blue-800 ring-1 ring-blue-100"
                      : ""
                  }`}
                >
                  <option value="">-- Chagua Pregnancy --</option>

                  {pregnancies.map((pregnancy) => (
                    <option key={pregnancy.id} value={pregnancy.id}>
                      {pregnancy.patientName || "Unknown Patient"} —{" "}
                      {pregnancy.patientNumber || "No Number"} — Pregnancy #
                      {pregnancy.id}
                    </option>
                  ))}
                </select>

                {isPregnancyPreselected && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-700">
                    <ShieldCheck size={14} />
                    Pregnancy imechaguliwa kutoka kwenye Pregnancy Profile.
                  </div>
                )}
              </>
            )}

            {fieldErrors.pregnancyId && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.pregnancyId}
              </p>
            )}

            {!loadingPregnancies && pregnancies.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Hakuna ACTIVE pregnancy iliyopatikana. Sajili au activate
                pregnancy kwanza.
              </p>
            )}
          </div>

          <div>
            <FieldLabel>Selected Patient</FieldLabel>

            <div className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              {selectedPregnancy ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <UserRound size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedPregnancy.patientName || "Unknown Patient"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selectedPregnancy.patientNumber ||
                        "No Patient Number"}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      <span>Pregnancy #{selectedPregnancy.id}</span>

                      {isPregnancyPreselected && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">
                            Preselected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-slate-400">
                  Chagua pregnancy kwanza
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Admission */}
      <SectionCard
        icon={CalendarDays}
        title="Admission"
        subtitle="Taarifa za mama anapoingia Labour Ward."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel required>Admission Date</FieldLabel>
            <input
              type="date"
              name="admissionDate"
              value={form.admissionDate}
              onChange={handleChange}
              className={inputClass(fieldErrors.admissionDate)}
            />
            {fieldErrors.admissionDate && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.admissionDate}
              </p>
            )}
          </div>

          <div>
            <FieldLabel required>Admission Time</FieldLabel>
            <input
              type="time"
              name="admissionTime"
              value={form.admissionTime}
              onChange={handleChange}
              className={inputClass(fieldErrors.admissionTime)}
            />
            {fieldErrors.admissionTime && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.admissionTime}
              </p>
            )}
          </div>

          <div>
            <FieldLabel>Labour Onset</FieldLabel>
            <select
              name="labourOnset"
              value={form.labourOnset}
              onChange={handleChange}
              className={inputClass()}
            >
              <option value="">-- Chagua --</option>
              <option value="SPONTANEOUS">Spontaneous</option>
              <option value="INDUCED">Induced</option>
              <option value="AUGMENTED">Augmented</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          <div>
            <FieldLabel>Labour Stage</FieldLabel>
            <select
              name="labourStage"
              value={form.labourStage}
              onChange={handleChange}
              className={inputClass()}
            >
              <option value="">-- Chagua --</option>
              <option value="FIRST_STAGE">First Stage</option>
              <option value="SECOND_STAGE">Second Stage</option>
              <option value="THIRD_STAGE">Third Stage</option>
              <option value="FOURTH_STAGE">Fourth Stage</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div>
            <FieldLabel>Admission Reason</FieldLabel>
            <textarea
              name="admissionReason"
              value={form.admissionReason}
              onChange={handleChange}
              rows={3}
              placeholder="Sababu ya admission..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Membrane Status</FieldLabel>
            <textarea
              name="membraneStatus"
              value={form.membraneStatus}
              onChange={handleChange}
              rows={3}
              placeholder="Mfano: Intact / Ruptured..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Liquor</FieldLabel>
            <textarea
              name="liquor"
              value={form.liquor}
              onChange={handleChange}
              rows={3}
              placeholder="Taarifa kuhusu liquor..."
              className={textareaClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Labour progress */}
      <SectionCard
        icon={Stethoscope}
        title="Maendeleo ya Labour"
        subtitle="Cervical assessment na contraction monitoring."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Cervical Dilation</FieldLabel>
            <input
              type="text"
              name="cervicalDilation"
              value={form.cervicalDilation}
              onChange={handleChange}
              placeholder="Mfano: 5 cm"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Cervical Effacement</FieldLabel>
            <input
              type="text"
              name="cervicalEffacement"
              value={form.cervicalEffacement}
              onChange={handleChange}
              placeholder="Mfano: 70%"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Fetal Descent</FieldLabel>
            <input
              type="text"
              name="fetalDescent"
              value={form.fetalDescent}
              onChange={handleChange}
              placeholder="Mfano: Station -1"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Contraction Frequency</FieldLabel>
            <input
              type="text"
              name="contractionFrequency"
              value={form.contractionFrequency}
              onChange={handleChange}
              placeholder="Mfano: 3 in 10 min"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Contraction Duration</FieldLabel>
            <input
              type="text"
              name="contractionDuration"
              value={form.contractionDuration}
              onChange={handleChange}
              placeholder="Mfano: 40 sec"
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Maternal */}
      <SectionCard
        icon={HeartPulse}
        title="Taarifa za Mama"
        subtitle="Maternal vital signs na clinical condition."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Weight (kg)</FieldLabel>
            <input
              type="number"
              step="0.1"
              min="0"
              name="maternalWeight"
              value={form.maternalWeight}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>BP Systolic</FieldLabel>
            <input
              type="number"
              min="0"
              name="maternalBpSystolic"
              value={form.maternalBpSystolic}
              onChange={handleChange}
              placeholder="120"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>BP Diastolic</FieldLabel>
            <input
              type="number"
              min="0"
              name="maternalBpDiastolic"
              value={form.maternalBpDiastolic}
              onChange={handleChange}
              placeholder="80"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Pulse (bpm)</FieldLabel>
            <input
              type="number"
              min="0"
              name="maternalPulse"
              value={form.maternalPulse}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Temperature (°C)</FieldLabel>
            <input
              type="number"
              step="0.1"
              min="0"
              name="maternalTemperature"
              value={form.maternalTemperature}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Respiratory Rate</FieldLabel>
            <input
              type="number"
              min="0"
              name="maternalRespiratoryRate"
              value={form.maternalRespiratoryRate}
              onChange={handleChange}
              className={inputClass()}
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
              placeholder="0 - 10"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Bleeding</FieldLabel>
            <input
              type="text"
              name="bleeding"
              value={form.bleeding}
              onChange={handleChange}
              placeholder="Taarifa ya bleeding"
              className={inputClass()}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel>Maternal Condition</FieldLabel>
            <textarea
              name="maternalCondition"
              value={form.maternalCondition}
              onChange={handleChange}
              rows={3}
              placeholder="Hali ya mama..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Complications</FieldLabel>
            <textarea
              name="complications"
              value={form.complications}
              onChange={handleChange}
              rows={3}
              placeholder="Complications kama zipo..."
              className={textareaClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Fetal */}
      <SectionCard
        icon={Baby}
        title="Taarifa za Mtoto"
        subtitle="Fetal assessment wakati wa labour."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Fetal Heart Rate (bpm)</FieldLabel>
            <input
              type="number"
              min="0"
              name="fetalHeartRate"
              value={form.fetalHeartRate}
              onChange={handleChange}
              placeholder="140"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Fetal Condition</FieldLabel>
            <input
              type="text"
              name="fetalCondition"
              value={form.fetalCondition}
              onChange={handleChange}
              placeholder="Hali ya mtoto..."
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Presentation</FieldLabel>
            <input
              type="text"
              name="fetalPresentation"
              value={form.fetalPresentation}
              onChange={handleChange}
              placeholder="Mfano: Cephalic"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Lie</FieldLabel>
            <input
              type="text"
              name="fetalLie"
              value={form.fetalLie}
              onChange={handleChange}
              placeholder="Mfano: Longitudinal"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Position</FieldLabel>
            <input
              type="text"
              name="fetalPosition"
              value={form.fetalPosition}
              onChange={handleChange}
              placeholder="Mfano: LOA"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Fetal Movement</FieldLabel>
            <input
              type="text"
              name="fetalMovement"
              value={form.fetalMovement}
              onChange={handleChange}
              placeholder="Taarifa za movement..."
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Delivery */}
      <SectionCard
        icon={Baby}
        title="Delivery"
        subtitle="Taarifa za kujifungua."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Delivery Date</FieldLabel>
            <input
              type="date"
              name="deliveryDate"
              value={form.deliveryDate}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Delivery Time</FieldLabel>
            <input
              type="time"
              name="deliveryTime"
              value={form.deliveryTime}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Delivery Mode</FieldLabel>
            <select
              name="deliveryMode"
              value={form.deliveryMode}
              onChange={handleChange}
              className={inputClass()}
            >
              <option value="">-- Chagua --</option>
              <option value="SVD">
                Spontaneous Vaginal Delivery
              </option>
              <option value="NORMAL">Normal Vaginal Delivery</option>
              <option value="C_SECTION">Caesarean Section</option>
              <option value="ASSISTED">Assisted Vaginal Delivery</option>
              <option value="VACUUM">Vacuum Delivery</option>
              <option value="FORCEPS">Forceps Delivery</option>
            </select>
          </div>

          <div>
            <FieldLabel>Delivery Outcome</FieldLabel>
            <input
              type="text"
              name="deliveryOutcome"
              value={form.deliveryOutcome}
              onChange={handleChange}
              placeholder="Outcome..."
              className={inputClass()}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div>
            <FieldLabel>Delivery Indication</FieldLabel>
            <textarea
              name="deliveryIndication"
              value={form.deliveryIndication}
              onChange={handleChange}
              rows={3}
              placeholder="Indication ya delivery..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Delivery Complications</FieldLabel>
            <textarea
              name="deliveryComplications"
              value={form.deliveryComplications}
              onChange={handleChange}
              rows={3}
              placeholder="Complications..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Maelezo ya ziada..."
              className={textareaClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Postpartum */}
      <SectionCard
        icon={ShieldCheck}
        title="Baada ya Kujifungua"
        subtitle="Maternal postpartum assessment."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Maternal Outcome</FieldLabel>
            <input
              type="text"
              name="maternalOutcome"
              value={form.maternalOutcome}
              onChange={handleChange}
              placeholder="Mfano: Stable"
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Postpartum Bleeding</FieldLabel>
            <input
              type="text"
              name="postpartumBleeding"
              value={form.postpartumBleeding}
              onChange={handleChange}
              placeholder="Taarifa ya bleeding..."
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Placenta Status</FieldLabel>
            <input
              type="text"
              name="placentaStatus"
              value={form.placentaStatus}
              onChange={handleChange}
              placeholder="Placenta status..."
              className={inputClass()}
            />
          </div>

          <div>
            <FieldLabel>Estimated Blood Loss (mL)</FieldLabel>
            <input
              type="number"
              min="0"
              name="estimatedBloodLoss"
              value={form.estimatedBloodLoss}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Clinical */}
      <SectionCard
        icon={ClipboardList}
        title="Clinical Management"
        subtitle="Assessment, diagnosis na treatment."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel>Assessment</FieldLabel>
            <textarea
              name="assessment"
              value={form.assessment}
              onChange={handleChange}
              rows={4}
              placeholder="Clinical assessment..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Diagnosis</FieldLabel>
            <textarea
              name="diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
              rows={4}
              placeholder="Diagnosis..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Treatment</FieldLabel>
            <textarea
              name="treatment"
              value={form.treatment}
              onChange={handleChange}
              rows={4}
              placeholder="Treatment iliyotolewa..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Medication</FieldLabel>
            <textarea
              name="medication"
              value={form.medication}
              onChange={handleChange}
              rows={4}
              placeholder="Medication..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Referral</FieldLabel>
            <textarea
              name="referral"
              value={form.referral}
              onChange={handleChange}
              rows={4}
              placeholder="Referral information..."
              className={textareaClass()}
            />
          </div>

          <div>
            <FieldLabel>Additional Notes</FieldLabel>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Maelezo ya ziada..."
              className={textareaClass()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Bottom actions */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="text-emerald-600" size={17} />
            <span>
              Labour Record itahifadhiwa kama ACTIVE.
            </span>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Futa Form
            </button>

            <Link
              to="/maternity/labour-records"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loadingPregnancies}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Inahifadhi...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Sajili Labour Record
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