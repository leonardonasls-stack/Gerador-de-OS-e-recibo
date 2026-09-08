import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, supabase } from '../services/supabase';
import { LogIn, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, nome);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro inesperado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("E-mail de recuperação de senha enviado!");
    } catch (err) {
      setError(err.message || "Erro ao tentar enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };


  const toggleMode = (registerMode) => {
    setIsRegistering(registerMode);
    setError('');
    setNome('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-[#1a5276]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a5276]">Gerador de OS</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isRegistering ? "Crie sua conta para continuar" : "Faça login para continuar"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              placeholder="••••••••"
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a5276] text-white py-2 rounded hover:bg-[#154360] transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
          >
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? "Aguarde..." : (isRegistering ? "Cadastrar" : "Entrar")}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={handleResetPassword}
              disabled={loading}
              className="text-sm text-[#1a5276] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        )}



        <div className="mt-8 text-center text-sm text-gray-600">
          {isRegistering ? (
            <p>
              Já tem uma conta?{' '}
              <button onClick={() => toggleMode(false)} className="text-[#1a5276] font-bold hover:underline">
                Faça login
              </button>
            </p>
          ) : (
            <p>
              Ainda não tem cadastro?{' '}
              <button onClick={() => toggleMode(true)} className="text-[#1a5276] font-bold hover:underline">
                Clique aqui!
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
