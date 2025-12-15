import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

interface SignupData {
  fullName: string;
  phone?: string;
  companyName: string;
  gstNo?: string;
  address?: string;
}

interface AuthContextType {
  user: any;
  role: string | null;
  company: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------- HELPERS ----------------------------- */

  const fetchRole = async (uid: string) => {
    console.log("➡️ fetchRole:", uid);

    const { data: owner } = await supabase
      .from("owner")
      .select("company_id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (owner) {
      setRole("OWNER");
      return owner.company_id;
    }

    const { data: supervisor } = await supabase
      .from("supervisor")
      .select("company_id")
      .eq("supervisor_id", uid)
      .maybeSingle();

    if (supervisor) {
      setRole("SUPERVISOR");
      return supervisor.company_id;
    }

    setRole(null);
    return null;
  };

  const fetchCompany = async (companyId: number) => {
    console.log("🏢 fetchCompany:", companyId);

    const { data } = await supabase
      .from("company")
      .select("*")
      .eq("company_id", companyId)
      .single();

    setCompany(data);
  };

  const ensureOwnerAndCompany = async (user: any) => {
    console.log("🧩 ensureOwnerAndCompany");

    console.log("🔍 Checking owner...");

    const { data: owner } = await supabase
      .from("owner")
      .select("company_id")
      .eq("owner_id", user.id)
      .maybeSingle();

      console.log("📦 Owner result:", owner);

    if (owner) return owner.company_id;

    const meta = user.user_metadata;

    console.log("🔍 Creating company and owner...");

    const { data: company, error: compErr } = await supabase
      .from("company")
      .insert({
        company_name: meta.companyName,
        gst_no: meta.gstNo || null,
        address: meta.address || null,
      })
      .select()
      .single();

      console.log("📦 Company result:", company, compErr);

    if (compErr) throw compErr;

    const { error: ownerErr } = await supabase.from("owner").insert({
      owner_id: user.id,
      company_id: company.company_id,
      full_name: meta.fullName,
      email: user.email,
      phone: meta.phone || null,
    });

    if (ownerErr) throw ownerErr;

    return company.company_id;
  };

  /* ----------------------------- AUTH LISTENER ----------------------------- */

  useEffect(() => {
    console.log("🚀 AUTH LISTENER INITIALIZED");

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔔 AUTH EVENT:", event);

        if (!session?.user) {
          setUser(null);
          setRole(null);
          setCompany(null);
          setLoading(false);
          return;
        }
        
        fetchRole(session.user.id).then(fetchCompany);
        setUser(session.user);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ----------------------------- LOGIN ----------------------------- */

  const login = async (email: string, password: string) => {
    console.log("🔐 LOGIN start:", email);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    const user = data.user;

    if (!user.email_confirmed_at) {
      setLoading(false);
      throw new Error("Please verify your email before logging in.");
    }

    setUser(user);

    const companyId = await ensureOwnerAndCompany(user);
    const roleCompanyId = await fetchRole(user.id);

    if (roleCompanyId) {
      await fetchCompany(roleCompanyId);
    }

    setLoading(false);
    console.log("✅ LOGIN COMPLETE");
    return user;
  };
/* ----------------------------- SIGNUP ----------------------------- */
const signup = async (
  email: string,
  password: string,
  data: {
    fullName: string;
    phone?: string;
    companyName: string;
    gstNo?: string;
    address?: string;
  }
) => {
  setLoading(true);
  console.log("🆕 SIGNUP start:", email);

  try {
    // 1️⃣ Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      throw authError || new Error("Auth user creation failed");
    }

    const userId = authData.user.id;
    console.log("✅ Auth user created:", userId);

    // 2️⃣ Insert Company only if not exists
    let companyId: string;
    const { data: existingCompany } = await supabase
      .from('company')
      .select('*')
      .eq('company_name', data.companyName)
      .maybeSingle();

    if (existingCompany) {
      companyId = existingCompany.company_id;
      console.log("🏢 Company already exists:", companyId);
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('company')
        .insert({
          company_name: data.companyName,
          gst_no: data.gstNo || null,
          address: data.address || null,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      companyId = newCompany.company_id;
      console.log("🏢 Company created:", companyId);
    }

    // 3️⃣ Insert Owner only if not exists
    const { data: existingOwner } = await supabase
      .from('owner')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingOwner) {
      console.log("👑 Owner already exists");
    } else {
      const { data: newOwner, error: ownerError } = await supabase
        .from('owner')
        .insert({
          owner_id: userId,
          company_id: companyId,
          full_name: data.fullName,
          email: email.trim().toLowerCase(),
          phone: data.phone || null,
        })
        .select()
        .maybeSingle();

      if (ownerError) throw ownerError;
      console.log("👑 Owner created:", newOwner);
    }

    console.log("🎉 Signup complete for:", email);
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  } finally {
    setLoading(false);
  }
};


  /* ----------------------------- LOGOUT ----------------------------- */

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, company, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
