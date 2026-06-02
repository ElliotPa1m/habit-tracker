import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import styles from '../css/Dashboard.module.css'

export default function Dashboard() {
    const [habits, setHabits] = useState([])
    const [newHabitName, setNewHabitName] = useState('')
    const [loading, setLoading] = useState(true)
    const [completedToday, setCompletedToday] = useState([])
    const [allCompletions, setAllCompletions] = useState([])

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
            .select('habit_id, completed_date')

        if (error) console.error(error)
        else {
            setCompletedToday(
                data
                    .filter(c => c.completed_date === today)
                    .map(c => c.habit_id)
            )
            setAllCompletions(data)
        }
    }

    function calculateStreak(habitId) {
        const dates = allCompletions
            .filter(c => c.habit_id === habitId)
            .map(c => c.completed_date)

        let streak = 0
        const today = new Date()

        for (let i = 1; i <= 365; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            if (dates.includes(dateStr)) {
                streak++
            } else {
                break
            }
        }

        return streak
    }

    function getBestStreak() {
        if (habits.length === 0) return 0
        return Math.max(...habits.map(h => calculateStreak(h.id)))
    }

    function getThisWeekPercent() {
        if (habits.length === 0) return 0
        const today = new Date()
        let total = 0
        let completed = 0

        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            total += habits.length
            completed += allCompletions.filter(c => c.completed_date === dateStr).length
        }

        return Math.round((completed / total) * 100)
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
            else {
                setCompletedToday(completedToday.filter(id => id !== habitId))
                setAllCompletions(allCompletions.filter(c => !(c.habit_id === habitId && c.completed_date === today)))
            }
        } else {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('completions')
                .insert({ habit_id: habitId, user_id: user.id, completed_date: today })

            if (error) console.error(error)
            else {
                setCompletedToday([...completedToday, habitId])
                setAllCompletions([...allCompletions, { habit_id: habitId, completed_date: today }])
            }
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
                        <div className={styles.statLabel}>Best streak</div>
                        <div className={styles.statValue}>{getBestStreak()} days</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>This week</div>
                        <div className={styles.statValue}>{getThisWeekPercent()}%</div>
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
                        const streak = calculateStreak(habit.id)
                        return (
                            <div key={habit.id} className={`${styles.habit} ${done ? styles.habitDone : ''}`}>
                                <button className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ''}`} onClick={() => toggleCompletion(habit.id)}>
                                    {done ? '✓' : ''}
                                </button>
                                <span className={styles.habitName}>{habit.name}</span>
                                <span className={streak > 0 ? styles.streak : styles.streakZero}>
                                    {streak} day streak
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