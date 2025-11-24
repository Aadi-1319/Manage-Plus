import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TYPES
// ============================================================

interface SignupData {
  fullName: string;
  companyName: string;
  gstNo?: string;
  address?: string;
  role: "owner";
}

interface AuthContextType {
  user: any;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    data: SignupData
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);


// ============================================================
// PROVIDER COMPONENT
// ============================================================

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Keep session alive on refresh
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // SIGNUP (OWNER ONLY)
  // ============================================================
  const signup = async (
    email: string,
    password: string,
    data: SignupData
  ) => {
    // 1️⃣ Create Supabase Auth User
    const {
      data: { user },
      error: signupError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) throw signupError;

    if (!user) throw new Error("Signup failed — no user returned.");

    const ownerId = user.id;

    // 2️⃣ Insert Company
    const { data: companyRow, error: companyError } = await supabase
      .from("company")
      .insert([
        {
          company_name: data.companyName,
          gst_no: data.gstNo || null,
          address: data.address || null,
        },
      ])
      .select()
      .single();

    if (companyError) throw companyError;

    const companyId = companyRow.company_id;

    // 3️⃣ Insert Owner row
    const { error: ownerInsertError } = await supabase
      .from("owner")
      .insert([
        {
          owner_id: ownerId,
          company_id: companyId,
          full_name: data.fullName,
        },
      ]);

    if (ownerInsertError) throw ownerInsertError;

    // 4️⃣ Update user metadata (VERY IMPORTANT for RLS)
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        role: "owner",
        company_id: companyId,
      },
    });

    if (metadataError) throw metadataError;
  };

  // ============================================================
  // LOGIN
  // ============================================================
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ============================================================
  // FINAL PROVIDER RETURN
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

