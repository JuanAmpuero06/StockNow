import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShoppingBag, Lock, Mail, UserPlus, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'operator' | 'user'>('user');
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
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100 overflow-hidden">
      {/* Dynamic Background Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -50, 0],
          y: [0, 30, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
        className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]"
      />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-xl p-8 shadow-2xl">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/20 mb-4"
              >
                <ShoppingBag size={28} />
              </motion.div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-300 to-emerald-400 bg-clip-text text-transparent">
                StockNow Enterprise
              </h2>
              <p className="mt-2 text-sm text-zinc-400 text-center">
                {isLoginView 
                  ? 'Gestiona inventarios y órdenes con alto rendimiento' 
                  : 'Crea una cuenta en el sistema de gestión'}
              </p>
            </div>

            {/* Toggle View Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950/80 p-1 mb-6 border border-zinc-850">
              <button
                type="button"
                onClick={() => { setIsLoginView(true); setErrorMsg(null); }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                  isLoginView 
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <Lock size={14} /> Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginView(false); setErrorMsg(null); }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                  !isLoginView 
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <UserPlus size={14} /> Registrarse
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email-input"
                label="Correo Electrónico"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@stocknow.com"
                icon={<Mail size={16} />}
              />

              <Input
                id="password-input"
                label="Contraseña"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock size={16} />}
              />

              {/* Role select for signup */}
              <AnimatePresence>
                {!isLoginView && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Rol del Usuario
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-zinc-100 transition-all focus:border-emerald-500 focus:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                        >
                          <option value="user">Sucursal / Solicitante Interno (Requisiciones)</option>
                          <option value="operator">Operador (Ajustes y Despachos)</option>
                          <option value="manager">Gestor de Catálogo (CRUD Completo)</option>
                          <option value="admin">Administrador (Acceso Total)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full mt-2"
                rightIcon={<ArrowRight size={16} />}
              >
                {isLoginView ? 'Ingresar al Dashboard' : 'Crear Cuenta'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
