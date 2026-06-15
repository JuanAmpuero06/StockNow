import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShoppingBag, Lock, Mail, UserPlus, ArrowRight, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'operator' | 'user'>('operator');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await register(email, password, role);
        alert('Registro exitoso. Ya puedes iniciar sesión. 🎉');
        setIsLoginView(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        'Ha ocurrido un error. Por favor, verifica tus datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 font-sans text-slate-100 overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md transform rounded-2xl border border-slate-800 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700/60">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-500 text-white shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
            StockNow Enterprise
          </h2>
          <p className="mt-2 text-sm text-slate-400 text-center">
            {isLoginView 
              ? 'Inicia sesión para gestionar inventarios y órdenes' 
              : 'Crea una cuenta en el sistema de gestión'}
          </p>
        </div>

        {/* Tabs for Login / Register */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800/80">
          <button
            onClick={() => { setIsLoginView(true); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              isLoginView 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Lock size={15} /> Iniciar Sesión
          </button>
          <button
            onClick={() => { setIsLoginView(false); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              !isLoginView 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <UserPlus size={15} /> Registrarse
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Role selection for registration */}
          {!isLoginView && (
            <div className="animate-slideDown">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Rol del Usuario
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'manager' | 'operator' | 'user')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white transition-all focus:border-emerald-500 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 appearance-none"
                >
                  <option value="operator">Operator (Venta y visualización)</option>
                  <option value="manager">Manager (Gestión de productos)</option>
                  <option value="user">User (Crear productos)</option>
                  <option value="admin">Admin (Acceso total)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:from-emerald-500 hover:to-teal-400 hover:shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                {isLoginView ? 'Ingresar al Dashboard' : 'Crear Cuenta'}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
