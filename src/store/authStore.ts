import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, User } from '../types';
import { supabase } from '../lib/supabase';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        try {
          console.log('Starting login process...');
          
          // Sign in with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            console.error('Auth error:', authError);
            throw new Error(authError.message);
          }

          if (authData.user) {
            console.log('User authenticated, creating/updating user profile...');
            
            // Create user object from auth data
            const user: User = {
              id: authData.user.id,
              name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
              email: authData.user.email || '',
              avatar: authData.user.user_metadata?.avatar_url || null,
            };
            
            console.log('Setting user state...');
            set({ user, isAuthenticated: true });
            
            // Ensure user profile exists in database using upsert
            try {
              console.log('Upserting user profile...');
              const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .upsert([{
                  id: authData.user.id,
                  email: authData.user.email,
                  name: user.name,
                  preferences: {
                    theme: 'dark',
                    language: 'en',
                    primaryColor: 'blue',
                    fontSize: 'medium',
                    notifications: {
                      email: true,
                      push: true,
                      reactions: true,
                      updates: false,
                      marketing: false
                    }
                  },
                  is_active: true,
                  last_login: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }], { 
                  onConflict: 'id',
                  ignoreDuplicates: false 
                })
                .select('id, email, name, preferences')
                .single();

              if (profileError) {
                console.error('Profile upsert failed:', profileError);
                throw new Error('Failed to create/update user profile');
              }

              if (userProfile) {
                // Update user object with profile data
                const updatedUser: User = {
                  id: authData.user.id,
                  name: userProfile.name || user.name,
                  email: userProfile.email || user.email,
                  avatar: user.avatar,
                };
                set({ user: updatedUser, isAuthenticated: true });
              }
                
            } catch (profileError) {
              console.error('Profile operation failed:', profileError);
              throw new Error('Failed to create user profile. Please try again.');
            }
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      
      register: async (email: string, password: string, name: string) => {
        try {
          console.log('Starting registration process...');
          
          // First, sign up with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          });

          if (authError) {
            console.error('Auth error:', authError);
            throw new Error(authError.message);
          }

          if (authData.user) {
            console.log('User registered, creating user profile...');
            
            // Create user object
            const user: User = {
              id: authData.user.id,
              name: name,
              email: email,
              avatar: null,
            };
            
            console.log('Setting user state...');
            set({ user, isAuthenticated: true });

            // Create user profile using upsert to handle any conflicts
            try {
              console.log('Upserting user profile...');
              const { error: profileError } = await supabase
                .from('users')
                .upsert([{
                  id: authData.user.id, // Use Supabase auth user ID
                  email: email,
                  name: name,
                  preferences: {
                    theme: 'dark',
                    language: 'en',
                    primaryColor: 'blue',
                    fontSize: 'medium',
                    notifications: {
                      email: true,
                      push: true,
                      reactions: true,
                      updates: false,
                      marketing: false
                    }
                  },
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }], { 
                  onConflict: 'id',
                  ignoreDuplicates: false 
                });

              if (profileError) {
                console.error('Profile upsert failed:', profileError);
                throw new Error('Failed to create user profile');
              }
            } catch (profileError) {
              console.error('Profile creation failed:', profileError);
              throw new Error('Failed to create user profile. Please try again.');
            }
          }
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
          // Clear persisted state
          localStorage.removeItem('auth-storage');
          // Redirect to home page
          window.location.href = '/';
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Initialize auth state from Supabase session
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  const { isAuthenticated } = useAuthStore.getState();
  
  if (session?.user && !isAuthenticated) {
    // User is signed in but our store doesn't know about it
    console.log('User signed in, updating store and ensuring profile exists...');
    
    const userData: User = {
      id: session.user.id,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      avatar: session.user.user_metadata?.avatar_url || null,
    };
    
    // Ensure user profile exists when auth state changes
    try {
      await supabase
        .from('users')
        .upsert([{
          id: session.user.id,
          email: session.user.email,
          name: userData.name,
          preferences: {
            theme: 'dark',
            language: 'en',
            primaryColor: 'blue',
            fontSize: 'medium',
            notifications: {
              email: true,
              push: true,
              reactions: true,
              updates: false,
              marketing: false
            }
          },
          is_active: true,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
    } catch (error) {
      console.warn('Failed to upsert user profile during auth state change:', error);
    }
    
    useAuthStore.setState({ user: userData, isAuthenticated: true });
  } else if (!session?.user && isAuthenticated) {
    // User is signed out
    console.log('User signed out, clearing store...');
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }
});