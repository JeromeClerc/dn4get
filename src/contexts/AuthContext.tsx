import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'user-default',
  email: 'expert.dev@dn4get.io',
  display_name: 'Lead Consultant IT',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  phone_number: '+41 79 123 45 67',
  phone_notifications_enabled: true,
  email_notifications_enabled: true,
  push_notifications_enabled: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('dn4get_demo_user');
      return saved ? JSON.parse(saved) : DEMO_USER;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Récupérer la session courante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Écouter les changements d'état d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const mapSupabaseUser = async (sbUser: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      const profileData: UserProfile = {
        id: sbUser.id,
        email: sbUser.email || '',
        display_name:
          profile?.display_name ||
          sbUser.user_metadata?.full_name ||
          sbUser.user_metadata?.name ||
          sbUser.email?.split('@')[0] ||
          'Utilisateur',
        avatar_url:
          profile?.avatar_url ||
          sbUser.user_metadata?.avatar_url ||
          sbUser.user_metadata?.picture,
        phone_number: profile?.phone_number || sbUser.phone,
        phone_notifications_enabled: profile?.phone_notifications_enabled ?? true,
        email_notifications_enabled: profile?.email_notifications_enabled ?? true,
        push_notifications_enabled: profile?.push_notifications_enabled ?? true,
      };

      setUser(profileData);
    } catch (e) {
      console.error('Erreur chargement profil utilisateur:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      setUser(DEMO_USER);
      localStorage.setItem('dn4get_demo_user', JSON.stringify(DEMO_USER));
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Erreur connexion Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      localStorage.removeItem('dn4get_demo_user');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (!isSupabaseConfigured) {
      localStorage.setItem('dn4get_demo_user', JSON.stringify(updated));
      return;
    }

    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  return ctx;
};
