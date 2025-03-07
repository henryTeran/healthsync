import { useNavigate } from "react-router-dom";
import { Appointments} from "../pages/Appointment/Appointments";
import { AddAppointment}  from "../pages/Appointment/AddAppointment";
import { EditProfile} from "../pages/Profile/EditProfile";
import { Profile} from "../pages/Profile/Profile";
import { DoctorProfile } from "./Profile/Doctor/DoctorProfile";


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


export const ProfileWrapper = (props) => {
  const navigate = useNavigate();
  return <Profile {...props} navigate={navigate} />;
};
export const DoctorProfileWrapper = (props) => {
  const navigate = useNavigate();
  return <DoctorProfile {...props} navigate={navigate} />;
};
