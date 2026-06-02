import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from '../css/Login.module.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = isRegister
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password })

        if (error) setError(error.message)
        setLoading(false)
    }

    return (
        <div className={styles.page}>
            <nav className={styles.navbar}>
                <span className={styles.logo}>Habit Tracker</span>
            </nav>

            <div className={styles.body}>
                <div className={styles.card}>
                    <h1 className={styles.title}>
                        {isRegister ? 'Create account' : 'Welcome back'}
                    </h1>
                    <p className={styles.subtitle}>
                        {isRegister ? 'Start tracking your habits today' : 'Log in to your account'}
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>Email</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Password</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Loading...' : isRegister ? 'Create account' : 'Log in'}
                        </button>
                    </form>

                    <button className={styles.switchBtn} onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    )
}