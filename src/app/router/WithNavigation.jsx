import { useNavigate } from "react-router-dom";
import { Appointments } from "../../features/appointments/ui/Appointments";
import { AddAppointment } from "../../features/appointments/ui/AddAppointment";
import { EditProfile } from "../../features/profile/ui/EditProfile";

export const AppointmentsWrapper = (props) => {
  const navigate = useNavigate();
  return <Appointments {...props} navigate={navigate} />;
};

export const AddAppointmentWrapper = (props) => {
  const navigate = useNavigate();
  return <AddAppointment {...props} navigate={navigate} />;
};

export const EditProfileWrapper = () => {
  const navigate = useNavigate();
  return <EditProfile navigate={navigate} />;
};
