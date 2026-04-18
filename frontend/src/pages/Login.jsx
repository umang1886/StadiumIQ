import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import api from '../lib/api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await api.post('/api/auth/register', { email, password, display_name: displayName })
      }
      const res = await api.post('/api/auth/login', { email, password })
      login(res.data.user, res.data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 relative overflow-hidden px-4 py-12">
      {/* Background abstract polygons */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rotate-12 bg-white blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] -rotate-12 bg-black blur-[120px] rounded-full" />
        <div className="absolute top-[40%] left-[80%] w-[30%] h-[30%] bg-cyan-300 blur-[100px] rounded-full mix-blend-overlay" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] min-h-[600px] bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] relative z-10 py-12 px-8 sm:px-12 flex flex-col justify-center animate-slide-up border border-white/50">
        
        {/* Title */}
        <h2 className="text-[2.5rem] font-extrabold tracking-wide mb-10 w-full text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 drop-shadow-sm">
          {isRegister ? 'Register' : 'Login'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex-1 flex flex-col">
          {isRegister && (
            <div className="mb-8 relative shrink-0 group">
              <label className="block text-xs font-bold text-gray-500 mb-2 group-focus-within:text-blue-500 transition-colors">Display Name</label>
              <div className="flex items-center border-b-[1.5px] border-gray-200 pb-2 focus-within:border-blue-500 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-300 text-sm py-1 font-medium"
                  placeholder="Type your display name"
                />
              </div>
            </div>
          )}

          <div className="mb-8 relative shrink-0 group">
            <label className="block text-xs font-bold text-gray-500 mb-2 group-focus-within:text-blue-500 transition-colors">Email Address</label>
            <div className="flex items-center border-b-[1.5px] border-gray-200 pb-2 focus-within:border-blue-500 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-300 text-sm py-1 font-medium"
                placeholder="Type your email"
              />
            </div>
          </div>

          <div className="mb-2 relative shrink-0 group">
            <label className="block text-xs font-bold text-gray-500 mb-2 group-focus-within:text-blue-500 transition-colors">Password</label>
            <div className="flex items-center border-b-[1.5px] border-gray-200 pb-2 focus-within:border-blue-500 transition-colors relative">
              <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-300 text-sm pr-10 py-1 font-medium"
                placeholder="Type your password"
              />
            </div>
            {!isRegister && (
              <div className="text-right mt-4">
                <a href="#" className="text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">Forgot password?</a>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl px-4 py-3 text-xs font-bold animate-shake text-center mt-6 shrink-0 shadow-sm shadow-red-500/10">
              {error}
            </div>
          )}

          <div className="mt-auto pt-10 shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 rounded-full hover:shadow-[0_8px_20px_rgba(6,_182,_212,_0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all outline-none flex justify-center items-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              ) : (
                <span className="uppercase tracking-[0.25em] text-sm relative z-10 drop-shadow-md">
                  {isRegister ? 'Register' : 'Login'}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Social Logins */}
        <div className="mt-8 text-center shrink-0 w-full animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4">
            Or {isRegister ? 'Sign Up' : 'Login'} Using
          </p>
          <div className="flex justify-center gap-4">
            <button type="button" className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg shadow-[#1877F2]/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1877F2]/40 transition-all font-bold text-lg">
              f
            </button>
            <button type="button" className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center shadow-lg shadow-[#1DA1F2]/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1DA1F2]/40 transition-all">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </button>
            <button type="button" className="w-10 h-10 rounded-full bg-[#EA4335] text-white flex items-center justify-center shadow-lg shadow-[#EA4335]/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#EA4335]/40 transition-all font-bold text-lg">
              G
            </button>
          </div>
        </div>

        <div className="mt-12 text-center w-full shrink-0">
          <p className="text-xs text-gray-400 mb-3 block font-medium">
            {isRegister ? 'Already have an account?' : 'Have not account yet?'}
          </p>
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="uppercase tracking-[0.1em] text-xs font-bold text-gray-800 hover:text-blue-600 transition-colors bg-transparent border-none outline-none drop-shadow-sm"
          >
            {isRegister ? 'SIGN IN' : 'SIGN UP'}
          </button>
        </div>

      </div>
    </div>
  )
}
