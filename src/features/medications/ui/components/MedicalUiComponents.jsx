import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserCircle2,
} from "lucide-react";

const DEFAULT_AVATAR = "/default-avatar.png";

const statusStyles = {
  brouillon: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  draft: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  validé: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  valide: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  validated: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  envoyé: "bg-medical-100 text-medical-700 border border-medical-200",
  envoye: "bg-medical-100 text-medical-700 border border-medical-200",
  sent: "bg-medical-100 text-medical-700 border border-medical-200",
  "en attente": "bg-amber-100 text-amber-700 border border-amber-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  actif: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  terminé: "bg-neutral-200 text-neutral-700 border border-neutral-300",
  terminee: "bg-neutral-200 text-neutral-700 border border-neutral-300",
  completed: "bg-neutral-200 text-neutral-700 border border-neutral-300",
};

const normalizeStatus = (status) =>
  String(status || "en attente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const withDefaultAvatar = (event) => {
  if (event?.currentTarget?.src?.endsWith(DEFAULT_AVATAR)) return;
  event.currentTarget.src = DEFAULT_AVATAR;
};

const formatSwissDate = (value) => {
  if (!value) return "Date inconnue";

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("fr-CH", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return "Date inconnue";
};

export const MedicalStatusBadge = ({ status, className = "" }) => {
  const normalized = normalizeStatus(status);
  const badgeClass = statusStyles[normalized] || "bg-neutral-100 text-neutral-700 border border-neutral-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass} ${className}`}>
      {status || "En attente"}
    </span>
  );
};

export const PrescriptionStatusBadge = ({ status, className = "" }) => {
  const fallback = status || "en attente";
  return <MedicalStatusBadge status={fallback} className={className} />;
};

PrescriptionStatusBadge.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
};

MedicalStatusBadge.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
};

export const PageHeader = ({ title, subtitle, actions, metrics }) => (
  <header className="rounded-[20px] border border-neutral-100 bg-white shadow-sm p-6 lg:p-8">
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500 max-w-3xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>

    {metrics?.length ? (
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4">
            <p className="text-xs text-neutral-500">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
          </article>
        ))}
      </div>
    ) : null}
  </header>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
};

export const StepProgress = ({ steps, currentStep }) => (
  <section className="rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4">
    <div className="flex gap-3 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isDone = index <= currentStep;

        return (
          <div key={step} className="flex items-center gap-2 shrink-0">
            {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-neutral-300" />}
            <span className={`text-xs font-medium ${isDone ? "text-neutral-900" : "text-neutral-400"}`}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-7 bg-neutral-200" /> : null}
          </div>
        );
      })}
    </div>
  </section>
);

StepProgress.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentStep: PropTypes.number.isRequired,
};

export const PatientCard = ({
  patient,
  selected,
  onSelect,
  compact = false,
  showDetails = true,
}) => {
  const fullName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(patient)}
      className={`w-full text-left rounded-[20px] border p-4 transition ${
        selected
          ? "border-medical-300 bg-medical-50"
          : "border-neutral-100 bg-white hover:border-medical-200 hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={patient?.photoURL || DEFAULT_AVATAR}
          onError={withDefaultAvatar}
          alt={fullName}
          className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-xl object-cover border border-neutral-200`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">{fullName}</p>
          <p className="text-xs text-neutral-500">Âge: {patient?.age || "—"}</p>
          {showDetails ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patient?.allergies ? (
                <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">Allergies</span>
              ) : (
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">RAS</span>
              )}
              <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">Suivi actif</span>
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
};

PatientCard.propTypes = {
  patient: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  compact: PropTypes.bool,
  showDetails: PropTypes.bool,
};

export const DoctorCard = ({ doctor, selected, onSelect, prescriptionsCount = 0 }) => {
  const fullName = `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "Médecin";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-[20px] border p-4 transition ${
        selected
          ? "border-medical-300 bg-medical-50"
          : "border-neutral-100 bg-white hover:border-medical-200 hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={doctor?.photoURL || DEFAULT_AVATAR}
          onError={withDefaultAvatar}
          alt={fullName}
          className="h-12 w-12 rounded-xl object-cover border border-neutral-200"
        />
        <div>
          <p className="text-sm font-semibold text-neutral-900">Dr {fullName}</p>
          <p className="text-xs text-neutral-500">{doctor?.department || "Médecine générale"}</p>
          <p className="mt-1 text-xs text-neutral-500">{prescriptionsCount} ordonnance(s)</p>
        </div>
      </div>
    </button>
  );
};

DoctorCard.propTypes = {
  doctor: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  prescriptionsCount: PropTypes.number,
};

export const PrescriptionCard = ({
  title,
  subtitle,
  status,
  selected,
  onSelect,
  medicationsCount,
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-[20px] border p-4 text-left transition ${
      selected
        ? "border-medical-300 bg-medical-50"
        : "border-neutral-100 bg-white hover:border-medical-200 hover:bg-neutral-50"
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      </div>
      <MedicalStatusBadge status={status} />
    </div>
    <p className="mt-3 text-xs text-neutral-500">{medicationsCount} médicament(s)</p>
  </button>
);

PrescriptionCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  status: PropTypes.string,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  medicationsCount: PropTypes.number,
};

export const MedicationItem = ({
  medication,
  onEdit,
  onDelete,
  onViewDetails,
  onContactDoctor,
  onReportProblem,
  actions = true,
  readonlyActions = false,
}) => (
  <article className="rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{medication?.name || "Médicament"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">{medication?.dosage || "Dosage"}</span>
          <span className="inline-flex rounded-full bg-medical-100 px-2.5 py-1 text-[11px] font-medium text-medical-700">{medication?.frequency || "Fréquence"}</span>
          <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700">{medication?.duration || "Durée"}</span>
          {medication?.startDate ? (
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Début: {new Date(medication.startDate).toLocaleDateString("fr-FR")}</span>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-3 text-xs">Éditer</button>
          <button type="button" onClick={onDelete} className="h-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 text-xs">Supprimer</button>
        </div>
      ) : null}
    </div>
    {readonlyActions ? (
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-3 text-xs"
        >
          Voir le détail
        </button>
        <button
          type="button"
          onClick={onContactDoctor}
          className="h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-3 text-xs"
        >
          Contacter le médecin
        </button>
        <button
          type="button"
          onClick={onReportProblem}
          className="h-9 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 text-xs"
        >
          Signaler un problème
        </button>
      </div>
    ) : null}
  </article>
);

MedicationItem.propTypes = {
  medication: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onViewDetails: PropTypes.func,
  onContactDoctor: PropTypes.func,
  onReportProblem: PropTypes.func,
  actions: PropTypes.bool,
  readonlyActions: PropTypes.bool,
};

export const PrescriptionPreviewCard = ({ title, subtitle, children, actions }) => (
  <PrescriptionPreviewPanel title={title} subtitle={subtitle} actions={actions}>
    {children}
  </PrescriptionPreviewPanel>
);

PrescriptionPreviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
};

export const TimelineEventCard = ({
  title,
  date,
  status,
  description,
  author,
  medicationsCount,
  onSelect,
  selected,
}) => (
  <article
    onClick={onSelect}
    className={`cursor-pointer rounded-[20px] border p-4 transition ${
      selected
        ? "border-medical-300 bg-medical-50"
        : "border-neutral-100 bg-white hover:border-medical-200 hover:bg-neutral-50"
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <MedicalStatusBadge status={status} />
    </div>
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {date}</span>
      {author ? <span className="inline-flex items-center gap-1"><UserCircle2 className="h-3.5 w-3.5" /> {author}</span> : null}
      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {medicationsCount} médicaments</span>
    </div>
    {description ? <p className="mt-3 text-sm text-neutral-600">{description}</p> : null}
  </article>
);

TimelineEventCard.propTypes = {
  title: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  status: PropTypes.string,
  description: PropTypes.string,
  author: PropTypes.string,
  medicationsCount: PropTypes.number,
  onSelect: PropTypes.func,
  selected: PropTypes.bool,
};

export const EmptyStateMedical = ({ title, description, action }) => (
  <section className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[20px] bg-white border border-neutral-100">
      <FileText className="h-6 w-6 text-neutral-400" />
    </div>
    <h4 className="text-base font-semibold text-neutral-900">{title}</h4>
    <p className="text-sm text-neutral-500 mt-1">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </section>
);

EmptyStateMedical.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
};

export const PrescriptionEmptyState = ({ title, description, action }) => (
  <div className="mx-auto w-full max-w-[720px] rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50/80 px-8 py-12 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <FileText className="h-7 w-7 text-neutral-400" />
    </div>
    <h4 className="text-base font-semibold text-neutral-900">{title}</h4>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

PrescriptionEmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
};

export const PrescriptionPreviewPanel = ({ title, subtitle, status, children, actions, sticky = false }) => (
  <section
    className={`rounded-[20px] border border-neutral-100 bg-white p-6 shadow-sm ${sticky ? "xl:sticky xl:top-24" : ""}`}
  >
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-neutral-900 font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {status ? <MedicalStatusBadge status={status} /> : null}
        <div className="flex h-10 w-10 items-center justify-center rounded-[20px] border border-neutral-100 bg-neutral-50 text-medical-600">
          <FileText className="h-5 w-5" />
        </div>
      </div>
    </div>

    <div>{children}</div>

    {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
  </section>
);

PrescriptionPreviewPanel.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  status: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  sticky: PropTypes.bool,
};

export const MedicalDocumentA4 = ({ children, className = "" }) => (
  <div
    data-pdf-document="true"
    className={`mx-auto w-full max-w-[794px] border border-neutral-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)] ${className}`}
  >
    <div className="px-10 py-10">{children}</div>
  </div>
);

MedicalDocumentA4.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export const PrescriptionHeader = ({
  doctorName,
  address,
  postalLine,
  phone,
  city,
  documentDate,
}) => (
  <>
    <div className="flex flex-col gap-8 border-b border-neutral-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5 text-neutral-700">
        <p className="text-2xl font-semibold text-neutral-900">{doctorName}</p>
        {address ? <p className="text-sm">{address}</p> : null}
        {postalLine ? <p className="text-sm">{postalLine}</p> : null}
        {phone ? <p className="text-sm">Tél. {phone}</p> : null}
      </div>

      <div className="text-sm text-neutral-600 sm:text-right">
        <p>{city ? `${city}, le ${documentDate}` : `Le ${documentDate}`}</p>
      </div>
    </div>

    <div className="py-8 text-center">
      <h2 className="text-xl font-semibold tracking-[0.35em] text-neutral-900">ORDONNANCE</h2>
    </div>
  </>
);

PrescriptionHeader.propTypes = {
  doctorName: PropTypes.string.isRequired,
  address: PropTypes.string,
  postalLine: PropTypes.string,
  phone: PropTypes.string,
  city: PropTypes.string,
  documentDate: PropTypes.string.isRequired,
};

export const PrescriptionMedicationLine = ({ medication, index }) => (
  <div className="border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
    <div className="flex items-start gap-3">
      <span className="pt-0.5 text-sm font-medium text-neutral-500">{index + 1}.</span>
      <div className="min-w-0 flex-1 space-y-1 text-sm leading-6 text-neutral-700">
        <p className="font-semibold text-neutral-900">{medication?.name || "Médicament"} {medication?.dosage || ""}</p>
        <p>{medication?.instruction || medication?.indication || "Prendre selon la prescription médicale."}</p>
        <p>
          Fréquence : <span className="font-medium text-neutral-900">{medication?.frequency || "À préciser"}</span>
          {" · "}
          Durée : <span className="font-medium text-neutral-900">{medication?.duration || "À préciser"}</span>
        </p>
      </div>
    </div>
  </div>
);

PrescriptionMedicationLine.propTypes = {
  medication: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

export const PrescriptionSignatureBlock = ({ doctorName, footerAddress, footerPhone, footerWebsite }) => (
  <>
    <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
      <div>
        <p className="text-sm text-neutral-500">Signature et cachet</p>
        <div className="mt-10 border-t border-neutral-400 pt-2 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">{doctorName}</p>
        </div>
      </div>
    </div>

    <div className="mt-12 border-t border-neutral-300 pt-4 text-xs leading-5 text-neutral-500">
      {footerAddress ? <p>{footerAddress}</p> : null}
      <div className="flex flex-wrap gap-x-4">
        {footerPhone ? <span>{footerPhone}</span> : null}
        {footerWebsite ? <span>{footerWebsite}</span> : null}
      </div>
    </div>
  </>
);

PrescriptionSignatureBlock.propTypes = {
  doctorName: PropTypes.string.isRequired,
  footerAddress: PropTypes.string,
  footerPhone: PropTypes.string,
  footerWebsite: PropTypes.string,
};

const displayValue = (value, fallback = "Non renseigné") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
};

const normalizeArrayField = (value, fallback = "Non renseigné") => {
  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    return value.join(", ");
  }
  return displayValue(value, fallback);
};

export const PrescriptionClinicalInfo = ({ clinicalInfo }) => (
  <section className="border border-neutral-300 p-4">
    <h5 className="text-[11px] tracking-[0.18em] uppercase text-neutral-600 font-semibold">Informations cliniques</h5>
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm leading-6">
      <div>
        <p className="text-neutral-600">Allergies</p>
        <p className="mt-1 text-neutral-900">{normalizeArrayField(clinicalInfo?.allergies, "Aucune allergie déclarée")}</p>
      </div>
      <div>
        <p className="text-neutral-600">Antécédents</p>
        <p className="mt-1 text-neutral-900">{displayValue(clinicalInfo?.history, "Non renseigné")}</p>
      </div>
      <div>
        <p className="text-neutral-600">Diagnostic / indication</p>
        <p className="mt-1 text-neutral-900">{displayValue(clinicalInfo?.diagnosis, "Non renseigné")}</p>
      </div>
      <div>
        <p className="text-neutral-600">Notes complémentaires</p>
        <p className="mt-1 text-neutral-900">{displayValue(clinicalInfo?.notes, "Aucune")}</p>
      </div>
    </div>
  </section>
);

PrescriptionClinicalInfo.propTypes = {
  clinicalInfo: PropTypes.shape({
    allergies: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    history: PropTypes.string,
    diagnosis: PropTypes.string,
    notes: PropTypes.string,
  }),
};

export const PrescriptionDocumentPreview = ({ prescription, patient, doctor }) => {
  const doctorName = `Dr ${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "Dr \u2014";
  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "\u2014";
  const documentDate = formatSwissDate(prescription?.creationDate || new Date().toISOString());
  const ePrescription = prescription?.ePrescription || {};
  const medications = prescription?.medications || [];
  const clinicalInfo = {
    allergies: prescription?.clinicalInfo?.allergies || patient?.allergies,
    diagnosis: prescription?.clinicalInfo?.diagnosis,
    notes: prescription?.clinicalInfo?.notes || prescription?.clinicalNotes,
  };

  const qrPayload =
    ePrescription?.signedRegisteredToken ||
    ePrescription?.qrPayload ||
    ePrescription?.reference ||
    prescription?.id ||
    "ERX-NO-TOKEN";

  const issuedAt = formatSwissDate(ePrescription?.issuedAt || prescription?.creationDate);
  const validUntil = formatSwissDate(ePrescription?.validUntil);
  const isChronic =
    ePrescription?.issueType === "CHRONIC" || Number(ePrescription?.repeatsAllowed) > 0;
  const isSigned = Boolean(ePrescription?.signedRegisteredToken);

  const prescriberGln = ePrescription?.prescriber?.gln || doctor?.gln;
  const prescriberRcc =
    ePrescription?.prescriber?.rcc ||
    ePrescription?.prescriber?.professionalId ||
    doctor?.rcc ||
    doctor?.professionalId;
  const prescriberZsr = ePrescription?.prescriber?.zsr || doctor?.zsr;

  const avsNumber = ePrescription?.patientAdministrative?.avsNumber || patient?.avsNumber;
  const insuranceName =
    ePrescription?.patientAdministrative?.insuranceName || patient?.insuranceName;
  const insuranceNumber =
    ePrescription?.patientAdministrative?.insuranceNumber || patient?.insuranceNumber;

  return (
    <MedicalDocumentA4>
      {/* ── EN-TÊTE BRANDING E-REZEPT SUISSE ── */}
      <div className="-mx-10 -mt-10 mb-6 flex items-center justify-between bg-slate-900 px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-600 text-xl font-bold leading-none text-white">
            +
          </div>
          <div>
            <p className="text-base font-semibold leading-tight tracking-wide text-white">
              E-Rezept Schweiz
            </p>
            <p className="text-[11px] leading-tight text-slate-400">
              Ordonnance électronique · CHMED16A_R2
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-widest text-white">ORDONNANCE</p>
          {isChronic ? (
            <span className="mt-1 inline-block rounded-full bg-blue-500 px-3 py-0.5 text-[11px] font-semibold tracking-wide text-white">
              Ordonnance répétée
            </span>
          ) : (
            <span className="mt-1 inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-semibold tracking-wide text-white">
              Ordonnance unique
            </span>
          )}
        </div>
      </div>

      {/* ── PRESCRIPTEUR + QR CODE ── */}
      <div className="mb-5 grid grid-cols-12 gap-4 border-b border-neutral-200 pb-5">
        <div className="col-span-7 space-y-1 text-sm">
          <p className="text-lg font-semibold text-neutral-900">{doctorName}</p>
          <p className="text-neutral-700">
            {displayValue(doctor?.specialty || doctor?.department)}
          </p>
          <p className="text-neutral-700">
            {displayValue(doctor?.clinicName || doctor?.organization)}
          </p>
          <p className="text-neutral-700">{displayValue(doctor?.address)}</p>
          <p className="text-neutral-700">
            {[doctor?.postalCode, doctor?.state, doctor?.country].filter(Boolean).join(" ")}
          </p>
          {(doctor?.mobileNumber || doctor?.phone) && (
            <p className="text-neutral-600">Tél. {doctor?.mobileNumber || doctor?.phone}</p>
          )}
          <div className="mt-2 space-y-0.5 border-t border-neutral-200 pt-2 font-mono text-xs">
            {prescriberGln && (
              <p>
                <span className="font-sans text-neutral-500">GLN </span>
                {prescriberGln}
              </p>
            )}
            {prescriberRcc && (
              <p>
                <span className="font-sans text-neutral-500">RCC </span>
                {prescriberRcc}
              </p>
            )}
            {prescriberZsr && (
              <p>
                <span className="font-sans text-neutral-500">ZSR </span>
                {prescriberZsr}
              </p>
            )}
          </div>
        </div>

        <div className="col-span-5 flex flex-col items-center gap-2">
          <div className="rounded-lg border-2 border-neutral-300 bg-white p-2 shadow-sm">
            <QRCodeSVG value={qrPayload} size={128} level="M" includeMargin={false} />
          </div>
          <p className="max-w-[160px] break-all px-1 text-center font-mono text-[9px] leading-tight text-neutral-500">
            {ePrescription?.reference || prescription?.id || "—"}
          </p>
          <p className="text-[10px] text-neutral-500">Scannez ce code en pharmacie</p>
        </div>
      </div>

      {/* ── PATIENT ── */}
      <div className="mb-4 rounded border border-neutral-300 bg-neutral-50 px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Patient
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <p>
            <span className="text-neutral-500">Nom / Prénom :</span>{" "}
            <span className="font-semibold text-neutral-900">{patientName}</span>
          </p>
          <p>
            <span className="text-neutral-500">Naissance :</span>{" "}
            {formatSwissDate(patient?.birthDate || patient?.dateOfBirth)}
          </p>
          <p>
            <span className="text-neutral-500">Sexe :</span>{" "}
            {displayValue(patient?.sex || patient?.gender)}
          </p>
          <p>
            <span className="text-neutral-500">N° AVS :</span>{" "}
            <span className="font-mono">{displayValue(avsNumber)}</span>
          </p>
          {insuranceName && (
            <p>
              <span className="text-neutral-500">Assureur :</span> {insuranceName}
            </p>
          )}
          {insuranceNumber && (
            <p>
              <span className="text-neutral-500">N° assurance :</span>{" "}
              <span className="font-mono">{insuranceNumber}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── MÉTADONNÉES ORDONNANCE ── */}
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded border border-neutral-200 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            {"Date d'émission"}
          </p>
          <p className="mt-1 font-medium text-neutral-900">{issuedAt}</p>
        </div>
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
            {"Valable jusqu'au"}
          </p>
          <p className="mt-1 font-semibold text-red-700">{validUntil}</p>
        </div>
        <div className="rounded border border-neutral-200 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Répétitions
          </p>
          <p className="mt-1 font-medium text-neutral-900">
            {Number(ePrescription?.repeatsAllowed ?? 0) > 0
              ? `${ePrescription?.repeatsAllowed}×`
              : "—"}
          </p>
        </div>
      </div>

      {/* ── TRAITEMENTS PRESCRITS ── */}
      <div className="mb-4 overflow-hidden rounded border border-neutral-300">
        <div className="border-b border-neutral-300 bg-slate-900 px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white">
            Traitements prescrits
          </p>
        </div>
        {medications.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {medications.map((med, idx) => (
              <div
                key={`${med?.id || med?.name || idx}`}
                className="flex gap-3 px-4 py-3 text-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-semibold text-neutral-900">
                    {displayValue(med?.name)}{" "}
                    <span className="font-normal text-neutral-600">
                      {displayValue(med?.dosage, "")}
                    </span>
                  </p>
                  {(med?.pharmaceuticalForm || med?.form) && (
                    <p className="text-neutral-700">
                      <span className="text-neutral-500">Forme : </span>
                      {med?.pharmaceuticalForm || med?.form}
                    </p>
                  )}
                  {(med?.posology || med?.instruction || med?.frequency) && (
                    <p className="text-neutral-700">
                      <span className="text-neutral-500">Posologie : </span>
                      {med?.posology || med?.instruction || med?.frequency}
                    </p>
                  )}
                  {(med?.duration || med?.quantity) && (
                    <p className="text-neutral-700">
                      <span className="text-neutral-500">Durée / Qté : </span>
                      {[med?.duration, med?.quantity].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  {(med?.specialInstructions || med?.notes || med?.indication) && (
                    <p className="italic text-neutral-600">
                      {med?.specialInstructions || med?.notes || med?.indication}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right font-mono text-[10px] text-neutral-500">
                  {med?.atcCode && <p>ATC: {med.atcCode}</p>}
                  {med?.eanCode && <p>EAN: {med.eanCode}</p>}
                  {med?.controlledSubstance && (
                    <p className="font-sans font-semibold text-red-600">⚠ Stupéfiant</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm italic text-neutral-500">
            Aucun traitement renseigné.
          </p>
        )}
      </div>

      {/* ── INDICATION / INFOS CLINIQUES ── */}
      {(ePrescription?.therapeuticPurpose || clinicalInfo?.diagnosis || clinicalInfo?.allergies) && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700">
            Informations cliniques
          </p>
          {ePrescription?.therapeuticPurpose && (
            <p>
              <span className="text-amber-700">Indication : </span>
              {ePrescription.therapeuticPurpose}
            </p>
          )}
          {clinicalInfo?.diagnosis && (
            <p>
              <span className="text-amber-700">Diagnostic : </span>
              {clinicalInfo.diagnosis}
            </p>
          )}
          {clinicalInfo?.allergies && (
            <p>
              <span className="text-amber-700">Allergies : </span>
              {normalizeArrayField(clinicalInfo.allergies, "Aucune")}
            </p>
          )}
        </div>
      )}

      {/* ── SIGNATURE + SÉCURITÉ ── */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div
          className={`rounded border-2 px-4 py-3 ${
            isSigned
              ? "border-emerald-400 bg-emerald-50"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            {isSigned ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Signé électroniquement
              </span>
            ) : (
              <span className="text-sm font-medium text-neutral-500">
                En attente de signature
              </span>
            )}
          </div>
          {ePrescription?.registration?.registrationId && (
            <p className="text-xs text-neutral-600">
              <span className="text-neutral-500">ID enregistrement : </span>
              <span className="font-mono">{ePrescription.registration.registrationId}</span>
            </p>
          )}
          {ePrescription?.datasetChecksum && (
            <p className="break-all text-xs text-neutral-600">
              <span className="text-neutral-500">Checksum : </span>
              <span className="font-mono">{ePrescription.datasetChecksum}</span>
            </p>
          )}
          {ePrescription?.substitutionAllowed !== undefined && (
            <p
              className={`mt-2 text-xs font-medium ${
                ePrescription.substitutionAllowed ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {ePrescription.substitutionAllowed
                ? "✓ Substitution autorisée"
                : "✗ Substitution refusée"}
            </p>
          )}
          {ePrescription?.emergencyPrescription && (
            <p className="mt-1 text-xs font-semibold text-orange-600">
              {"⚡ Ordonnance d'urgence"}
            </p>
          )}
        </div>

        <div className="rounded border border-neutral-200 px-4 py-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Prescripteur
          </p>
          <p className="mt-1 font-medium text-neutral-900">{doctorName}</p>
          <p className="text-neutral-600">{displayValue(doctor?.specialty)}</p>
          <p className="text-neutral-600">
            {[
              displayValue(doctor?.address, ""),
              [doctor?.postalCode, doctor?.state].filter(Boolean).join(" "),
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <div className="mt-6 border-t border-neutral-400 pt-1">
            <p className="text-[10px] text-neutral-500">
              {displayValue(
                prescription?.metadata?.place || doctor?.state,
                "Suisse"
              )}
              , le {documentDate}
            </p>
          </div>
        </div>
      </div>

      {/* ── PIED DE PAGE ── */}
      <div className="-mx-10 -mb-10 flex items-center justify-between border-t-2 border-neutral-200 bg-slate-900 px-10 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600 text-xs font-bold leading-none text-white">
            +
          </div>
          <span>
            E-Rezept Schweiz · CHMED16A_R2 · Ce document doit être présenté
            électroniquement en pharmacie.
          </span>
        </div>
        <p className="font-mono text-[10px] text-slate-500">
          {ePrescription?.reference || prescription?.id || "—"}
        </p>
      </div>
    </MedicalDocumentA4>
  );
};
