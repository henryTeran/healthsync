import { useNavigate } from "react-router-dom";
import { Appointments } from "../features/appointments/ui/Appointments";
import { AddAppointment } from "../features/appointments/ui/AddAppointment";
import { EditProfile} from "../pages/Profile/EditProfile";
import { Profile} from "../pages/Profile/Profile";


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
