// import React, { createContext, useEffect, useState, ReactNode } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useNavigate } from "react-router-dom";

// interface SignupData {
//   fullName: string;
//   phone?: string;
//   companyName: string;
//   gstNo?: string;
//   address?: string;
// }

// interface AuthContextType {
//   user: any;
//   company: any;
//   loading: boolean;
//   signup: (email: string, password: string, data: SignupData) => Promise<void>;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType | null>(null);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<any>(null);
//   const [company, setCompany] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();

//   // Restore session on app reload
//   useEffect(() => {
//     const init = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       setUser(session?.user || null);
//       setLoading(false);
//     };

//     init();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_, session) => setUser(session?.user || null)
//     );

//     return () => listener?.subscription.unsubscribe();
//   }, []);

//   // -------------------------
//   // SIGNUP
//   // -------------------------
//   const signup = async (email: string, password: string, data: SignupData) => {
//     setLoading(true);

//     const { error } = await supabase.auth.signUp({
//       email: email.trim().toLowerCase(),
//       password,
//     });

//     if (error) {
//       setLoading(false);
//       throw error;
//     }

//     alert("Signup successful! Please verify your email.");
//     setLoading(false);
//     navigate("/login");
//   };

//   // -------------------------
//   // LOGIN (INSERT OWNER + COMPANY AFTER EMAIL VERIFIED)
//   // -------------------------
//   const login = async (email: string, password: string) => {
//     setLoading(true);

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: email.trim().toLowerCase(),
//       password,
//     });

//     if (error) {
//       setLoading(false);
//       throw error;
//     }

//     const loggedUser = data.user;
//     setUser(loggedUser);

//     // ❗ Email NOT verified → Stop here
//     if (!loggedUser.email_confirmed_at) {
//       alert("Please verify your email first!");
//       setLoading(false);
//       return;
//     }

//     // ❗ Check if owner already exists (avoid duplicate insertion)
//     const { data: existingOwner } = await supabase
//       .from("owner")
//       .select("*")
//       .eq("owner_id", loggedUser.id)
//       .maybeSingle();

//     // If owner exists → Just redirect
//     if (existingOwner) {
//       setLoading(false);
//       navigate("/dashboard");
//       return;
//     }

//     // 👇 Owner does NOT exist → FIRST LOGIN AFTER VERIFICATION
//     try {
//       // Insert Company
//       const { data: comp, error: compErr } = await supabase
//         .from("company")
//         .insert({
//           company_name: data.user.user_metadata.companyName,
//           gst_no: data.user.user_metadata.gstNo || null,
//           address: data.user.user_metadata.address || null,
//         })
//         .select()
//         .single();

//       if (compErr) throw compErr;

//       // Insert Owner
//       const { error: ownerErr } = await supabase
//         .from("owner")
//         .insert({
//           owner_id: loggedUser.id,
//           company_id: comp.company_id,
//           full_name: data.user.user_metadata.fullName,
//           email: loggedUser.email,
//           phone: data.user.user_metadata.phone || null,
//         });

//       if (ownerErr) throw ownerErr;

//       // Update metadata
//       await supabase.auth.updateUser({
//         data: {
//           role: "owner",
//           company_id: comp.company_id,
//         },
//       });

//       setCompany(comp);
//       alert("Registration completed!");
//       navigate("/dashboard");

//     } catch (e: any) {
//       alert(e.message);
//     }

//     setLoading(false);
//   };

//   // -------------------------
//   // LOGOUT
//   // -------------------------
//   const logout = async () => {
//     setLoading(true);
//     await supabase.auth.signOut();
//     setUser(null);
//     setCompany(null);
//     setLoading(false);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         company,
//         loading,
//         signup,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface SignupData {
  fullName: string;
  phone?: string;
  companyName: string;
  gstNo?: string;
  address?: string;
}

interface AuthContextType {
  user: any;
  loading: boolean;
  role: string | null;
  company: any;
  signup: (...args: any) => Promise<void>;
  login: (...args: any) => Promise<any>;
  logout: () => Promise<void>;
  setCompany: (data: any) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);

  const navigate = useNavigate();

  // ---------------------------------------
  // Fetch Role (OWNER / SUPERVISOR)
  // ---------------------------------------
  const fetchRole = async (uid: string) => {
    // Check OWNER
    let { data: owner } = await supabase
      .from("owner")
      .select("role, company_id")
      .eq("owner_id", uid)
      .single();
    if (owner) {
      setRole(owner.role);
      return owner.company_id;
    }

    // Check SUPERVISOR
    let { data: sup } = await supabase
      .from("supervisor")
      .select("role, company_id")
      .eq("supervisor_id", uid)
      .single();
    if (sup) {
      setRole(sup.role);
      return sup.company_id;
    }

    setRole(null);
    return null;
  };

  // ---------------------------------------
  // Fetch Company Details
  // ---------------------------------------
  const fetchCompany = async (companyId: number) => {
    const { data, error } = await supabase
      .from("company")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (!error) {
      setCompany(data);
    }
  };

  // ---------------------------------------
  // Restore Session & Fetch Role + Company
  // ---------------------------------------
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        const companyId = await fetchRole(currentUser.id);
        if (companyId) await fetchCompany(companyId);
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const companyId = await fetchRole(currentUser.id);
          if (companyId) await fetchCompany(companyId);
        }
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  // ---------------------------------------
  // SIGNUP
  // ---------------------------------------
  const signup = async (email: string, password: string, data: SignupData) => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    alert("Please verify your email before logging in.");
    navigate("/verify");
    setLoading(false);
  };

  // ---------------------------------------
  // LOGIN
  // ---------------------------------------
  const login = async (email: string, password: string) => {
    setLoading(true);

    const { data: { user: loggedInUser }, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
      setLoading(false);
      throw error;
    }

    setUser(loggedInUser);

    // Fetch role & company after login
    const companyId = await fetchRole(loggedInUser.id);
    if (companyId) await fetchCompany(companyId);

    setLoading(false);
    return loggedInUser;
  };

  // ---------------------------------------
  // LOGOUT
  // ---------------------------------------
  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setCompany(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        company,
        signup,
        login,
        logout,
        setCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
