import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import styles from '../css/Dashboard.module.css'

export default function Dashboard() {
    const [habits, setHabits] = useState([])
    const [newHabitName, setNewHabitName] = useState('')
    const [loading, setLoading] = useState(true)
    const [completedToday, setCompletedToday] = useState([])

    useEffect(() => {
        fetchHabits()
        fetchCompletions()
    }, [])

    async function fetchHabits() {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) console.error(error)
        else setHabits(data)
        setLoading(false)
    }

    async function fetchCompletions() {
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('completions')
            .select('habit_id')
            .eq('completed_date', today)

        if (error) console.error(error)
        else setCompletedToday(data.map(c => c.habit_id))
    }

    async function toggleCompletion(habitId) {
        const today = new Date().toISOString().split('T')[0]
        const isCompleted = completedToday.includes(habitId)

        if (isCompleted) {
            const { error } = await supabase
                .from('completions')
                .delete()
                .eq('habit_id', habitId)
                .eq('completed_date', today)

            if (error) console.error(error)
            else setCompletedToday(completedToday.filter(id => id !== habitId))
        } else {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('completions')
                .insert({ habit_id: habitId, user_id: user.id, completed_date: today })

            if (error) console.error(error)
            else setCompletedToday([...completedToday, habitId])
        }
    }

    async function addHabits(e) {
        e.preventDefault()
        if (!newHabitName.trim()) return

        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('habits')
            .insert({ name: newHabitName.trim(), user_id: user.id })
            .select()
            .single()

        if (error) console.error(error)
        else {
            setHabits([...habits, data])
            setNewHabitName('')
        }
    }

    async function deleteHabit(id) {
        const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', id)

        if (error) console.error(error)
        else setHabits(habits.filter(h => h.id !== id))
    }

    async function signOut() {
        await supabase.auth.signOut()
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className={styles.page}>
            <nav className={styles.navbar}>
                <span className={styles.logo}>Habit Tracker</span>
                <button className={styles.logoutBtn} onClick={signOut}>Log out</button>
            </nav>

            <div className={styles.body}>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>Today</div>
                        <div className={styles.statValue}>
                            {completedToday.length} / {habits.length}
                        </div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>Streak</div>
                        <div className={styles.statValue}>— days</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>This week</div>
                        <div className={styles.statValue}>— %</div>
                    </div>
                </div>

                <form onSubmit={addHabits} className={styles.addForm}>
                    <input
                        className={styles.addInput}
                        type="text"
                        placeholder="Add a new habit..."
                        value={newHabitName}
                        onChange={e => setNewHabitName(e.target.value)}
                    />
                    <button type="submit" className={styles.addBtn}>+ Add</button>
                </form>

                <div className={styles.sectionLabel}>Today's habits</div>

                {habits.length === 0 && <p className={styles.empty}>No habits yet — add one above!</p>}

                <div className={styles.habits}>
                    {habits.map(habit => {
                        const done = completedToday.includes(habit.id)
                        return (
                            <div key={habit.id} className={`${styles.habit} ${done ? styles.habitDone : ''}`}>
                                <button className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ''}`} onClick={() => toggleCompletion(habit.id)}>
                                    {done ? '✓' : ''}
                                </button>
                                <span className={styles.habitName}>{habit.icon} {habit.name}</span>
                                <span className={done ? styles.streak : styles.streakZero}>
                                    0 day streak
                                </span>
                                <button className={styles.deleteBtn} onClick={() => deleteHabit(habit.id)}>✕</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}