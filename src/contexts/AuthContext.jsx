import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../providers/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: currentUser.uid, ...userDoc.data() });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

//  Hook personnalisé pour utiliser facilement AuthContext
export const useAuth = () => useContext(AuthContext);
