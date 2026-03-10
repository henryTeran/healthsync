import { AppRouter } from "./app/router/AppRouter";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "./shared/ui/LoadingSpinner";
import { useAuth } from "./contexts/AuthContext";

const App = () => {
  const { loading, authReady } = useAuth();

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppRouter />
    </>
  );
};

export default App;
