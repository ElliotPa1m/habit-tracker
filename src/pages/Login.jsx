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
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1>{isRegister ? 'Create account' : 'Log in'}</h1>
                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder='Password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : isRegister ? 'Register' : 'Log in'}
                </button>

                <button type="button" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? 'Already have an account? Log in!' : 'No account? Make one!'}
                </button>
            </form>
        </div>
    )
}