import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass dark:glass-dark p-8 md:p-12 rounded-3xl w-full max-w-md shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground">Join Automatically Ally</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-medium ml-1 text-foreground/80">Full Name</label>
            <input 
              type="text" 
              {...register('full_name')}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50"
              placeholder="Dr. Jane Doe"
            />
            {errors.full_name && <p className="text-destructive text-xs ml-1">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-sm font-medium ml-1 text-foreground/80">Email</label>
            <input 
              type="email" 
              {...register('email')}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50"
              placeholder="researcher@university.edu"
            />
            {errors.email && <p className="text-destructive text-xs ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-sm font-medium ml-1 text-foreground/80">Password</label>
            <input 
              type="password" 
              {...register('password')}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-destructive text-xs ml-1">{errors.password.message}</p>}
          </div>
          
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-medium ml-1 text-foreground/80">Confirm Password</label>
            <input 
              type="password" 
              {...register('confirm_password')}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50"
              placeholder="••••••••"
            />
            {errors.confirm_password && <p className="text-destructive text-xs ml-1">{errors.confirm_password.message}</p>}
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-accent to-blue-600 hover:from-accent/90 hover:to-blue-600/90 text-white font-medium py-3 rounded-xl shadow-lg shadow-accent/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <span>Sign Up</span>}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium transition-colors">
            Sign in instead
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
