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
  console.log("AUTH INIT START");
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("SESSION:", session);

    const currentUser = session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      console.log("Fetching role...");
      const companyId = await fetchRole(currentUser.id);
      console.log("companyId:", companyId);

      if (companyId) {
        console.log("Fetching company...");
        await fetchCompany(companyId);
      }
    }

    console.log("DONE → setLoading(false)");
    setLoading(false);
  };

  init();

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_, session) => {
      console.log("AUTH STATE CHANGE:", session);

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const companyId = await fetchRole(currentUser.id);
        if (companyId) await fetchCompany(companyId);
      } else {
        setRole(null);
        setCompany(null);
      }

      console.log("DONE LISTENER → setLoading(false)");
      setLoading(false);
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
