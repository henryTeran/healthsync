import PropTypes from "prop-types";
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
  const doctorName = `Dr ${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "Dr Non renseigné";
  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient non renseigné";
  const documentDate = formatSwissDate(prescription?.creationDate || new Date().toISOString());
  const issuePlace = displayValue(prescription?.metadata?.place || doctor?.state || doctor?.country, "Lieu non renseigné");
  const postalLine = [doctor?.postalCode, doctor?.state || doctor?.country].filter(Boolean).join(" ");
  const footerAddress = [doctor?.address, postalLine, doctor?.country || "Suisse"].filter(Boolean).join(" • ");
  const medications = prescription?.medications || [];
  const clinicalInfo = {
    allergies: prescription?.clinicalInfo?.allergies || patient?.allergies,
    history: prescription?.clinicalInfo?.history,
    diagnosis: prescription?.clinicalInfo?.diagnosis,
    notes: prescription?.clinicalInfo?.notes || prescription?.clinicalNotes,
  };
  const ePrescription = prescription?.ePrescription || {};

  return (
    <MedicalDocumentA4>
      <div className="space-y-5 text-neutral-900">
        <header className="border-b-2 border-neutral-900 pb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-7 space-y-1">
              <p className="text-xl font-semibold leading-tight">{doctorName}</p>
              <p className="text-sm text-neutral-800">{displayValue(doctor?.specialty || doctor?.department, "Spécialité non renseignée")}</p>
              <p className="text-sm text-neutral-800">{displayValue(doctor?.clinicName || doctor?.organization, "Cabinet / établissement non renseigné")}</p>
              <p className="text-sm text-neutral-800">{displayValue(doctor?.address, "Adresse non renseignée")}</p>
              <p className="text-sm text-neutral-800">{displayValue(postalLine, "Localisation non renseignée")}</p>
              <p className="text-sm text-neutral-800">Tél: {displayValue(doctor?.mobileNumber || doctor?.phone)}</p>
              <p className="text-sm text-neutral-800">Email: {displayValue(doctor?.email, "Non renseigné")}</p>
            </div>
            <div className="md:col-span-5 text-left md:text-right">
              <p className="text-2xl font-semibold tracking-[0.16em]">ORDONNANCE</p>
              <div className="mt-2 text-sm leading-6">
                <p><span className="text-neutral-600">N° Prescription:</span> {displayValue(prescription?.id)}</p>
                <p><span className="text-neutral-600">Date d’émission:</span> {documentDate}</p>
                <p><span className="text-neutral-600">Lieu:</span> {issuePlace}</p>
                <p><span className="text-neutral-600">N° dossier:</span> {displayValue(prescription?.metadata?.medicalRecordNumber || patient?.recordNumber, "Non attribué")}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="border border-neutral-300 p-4">
          <h5 className="text-[11px] tracking-[0.18em] uppercase text-neutral-600 font-semibold">Identité patient</h5>
          <div className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2 text-sm leading-6">
            <p><span className="text-neutral-600">Nom complet:</span> {patientName}</p>
            <p><span className="text-neutral-600">Date de naissance:</span> {formatSwissDate(patient?.birthDate || patient?.dateOfBirth)}</p>
            <p><span className="text-neutral-600">Sexe:</span> {displayValue(patient?.sex || patient?.gender)}</p>
            <p><span className="text-neutral-600">ID patient:</span> {displayValue(patient?.patientId || patient?.id || prescription?.patientId)}</p>
            <p className="sm:col-span-2"><span className="text-neutral-600">Adresse:</span> {displayValue(patient?.address)}</p>
          </div>
        </section>

        <section className="border border-neutral-300 p-4">
          <h5 className="text-[11px] tracking-[0.18em] uppercase text-neutral-600 font-semibold">Métadonnées e-ordonnance Suisse</h5>
          <div className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2 text-sm leading-6">
            <p><span className="text-neutral-600">Standard:</span> {displayValue(ePrescription?.standard, "CH-ERX")}</p>
            <p><span className="text-neutral-600">Version:</span> {displayValue(ePrescription?.chmedVersion, "CHMED16A_R2")}</p>
            <p><span className="text-neutral-600">Référence:</span> {displayValue(ePrescription?.reference)}</p>
            <p><span className="text-neutral-600">Checksum dataset:</span> {displayValue(ePrescription?.datasetChecksum)}</p>
            <p><span className="text-neutral-600">Date d&apos;émission:</span> {displayValue(ePrescription?.issuedAt, documentDate)}</p>
            <p><span className="text-neutral-600">Validité:</span> {displayValue(ePrescription?.validUntil)}</p>
            <p><span className="text-neutral-600">Type:</span> {displayValue(ePrescription?.issueType)}</p>
            <p><span className="text-neutral-600">Répétitions:</span> {displayValue(String(ePrescription?.repeatsAllowed ?? 0), "0")}</p>
            <p><span className="text-neutral-600">Substitution:</span> {ePrescription?.substitutionAllowed ? "Autorisée" : "Non autorisée"}</p>
            <p><span className="text-neutral-600">Urgence:</span> {ePrescription?.emergencyPrescription ? "Oui" : "Non"}</p>
            <p><span className="text-neutral-600">Stupéfiants exclus:</span> {ePrescription?.narcoticsExcludedDeclaration ? "Oui" : "Non"}</p>
            <p className="break-all"><span className="text-neutral-600">Token signé:</span> {displayValue(ePrescription?.signedRegisteredToken)}</p>
            <p className="sm:col-span-2"><span className="text-neutral-600">Indication thérapeutique:</span> {displayValue(ePrescription?.therapeuticPurpose)}</p>
            <p><span className="text-neutral-600">N° AVS:</span> {displayValue(ePrescription?.patientAdministrative?.avsNumber)}</p>
            <p><span className="text-neutral-600">Assureur:</span> {displayValue(ePrescription?.patientAdministrative?.insuranceName)}</p>
            <p><span className="text-neutral-600">N° assurance:</span> {displayValue(ePrescription?.patientAdministrative?.insuranceNumber)}</p>
            <p><span className="text-neutral-600">GLN:</span> {displayValue(ePrescription?.prescriber?.gln)}</p>
            <p><span className="text-neutral-600">RCC / ID pro:</span> {displayValue(ePrescription?.prescriber?.rcc || ePrescription?.prescriber?.professionalId)}</p>
            <p className="sm:col-span-2 break-all"><span className="text-neutral-600">Payload eRx:</span> {displayValue(ePrescription?.qrPayload)}</p>
          </div>
        </section>

        <PrescriptionClinicalInfo clinicalInfo={clinicalInfo} />

        <section className="border border-neutral-300 p-4">
          <h5 className="text-[11px] tracking-[0.18em] uppercase text-neutral-600 font-semibold">Traitements prescrits</h5>
          {medications.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-neutral-400 bg-neutral-50">
                    <th className="px-2 py-2 text-left font-semibold">Médicament</th>
                    <th className="px-2 py-2 text-left font-semibold">Dosage / Forme</th>
                    <th className="px-2 py-2 text-left font-semibold">Posologie / Fréquence</th>
                    <th className="px-2 py-2 text-left font-semibold">Durée / Qté</th>
                    <th className="px-2 py-2 text-left font-semibold">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((medication, index) => (
                    <tr key={`${medication?.id || medication?.name || index}-${index}`} className="border-b border-neutral-200 align-top">
                      <td className="px-2 py-2 font-medium">{displayValue(medication?.name, "Médicament non renseigné")}</td>
                      <td className="px-2 py-2">{displayValue(medication?.dosage)} / {displayValue(medication?.pharmaceuticalForm || medication?.form)}</td>
                      <td className="px-2 py-2">{displayValue(medication?.posology || medication?.instruction)} / {displayValue(medication?.frequency)}</td>
                      <td className="px-2 py-2">{displayValue(medication?.duration)} / {displayValue(medication?.quantity)}</td>
                      <td className="px-2 py-2">{displayValue(medication?.specialInstructions || medication?.notes || medication?.indication)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm italic text-neutral-600">Aucun traitement renseigné pour cette ordonnance.</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 pt-1">
          <div className="text-sm leading-6">
            <p><span className="text-neutral-600">Lieu et date:</span> {issuePlace}, le {documentDate}</p>
            <p><span className="text-neutral-600">RCC / ID professionnel:</span> {displayValue(doctor?.rcc || doctor?.professionalId, "Non renseigné")}</p>
          </div>
          <div className="text-sm md:text-right">
            <p className="text-neutral-600">Signature du médecin</p>
            <div className="mt-10 border-t border-neutral-500 pt-2 inline-block min-w-[220px] text-left md:text-right">
              <p className="font-medium">{doctorName}</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-300 pt-3 text-xs leading-5 text-neutral-600">
          <p>{displayValue(footerAddress, "Coordonnées cabinet non renseignées")}</p>
          <p>{displayValue(doctor?.website || doctor?.email, "Contact non renseigné")}</p>
          <p>Document médical professionnel. Toute modification thérapeutique requiert une réévaluation médicale.</p>
        </footer>
      </div>
    </MedicalDocumentA4>
  );
};

PrescriptionDocumentPreview.propTypes = {
  prescription: PropTypes.object,
  patient: PropTypes.object,
  doctor: PropTypes.object,
};

export const ContactLine = ({ icon, text }) => (
  <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
    {icon}
    <span>{text}</span>
  </p>
);

ContactLine.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
};

export const ProfileInfoBlock = ({ name, email, phone, location }) => (
  <section className="rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 space-y-2">
    <p className="text-sm font-semibold text-neutral-900">{name}</p>
    {email ? <ContactLine icon={<Mail className="h-4 w-4 text-medical-500" />} text={email} /> : null}
    {phone ? <ContactLine icon={<Phone className="h-4 w-4 text-medical-500" />} text={phone} /> : null}
    {location ? <ContactLine icon={<MapPin className="h-4 w-4 text-medical-500" />} text={location} /> : null}
  </section>
);

ProfileInfoBlock.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string,
  phone: PropTypes.string,
  location: PropTypes.string,
};
