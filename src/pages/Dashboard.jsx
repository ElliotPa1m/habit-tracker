import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import styles from '../css/Dashboard.module.css'
import { useNavigate } from "react-router-dom"
import { checkAchievements } from '../lib/achievements'

const CATEGORIES = [
    { value: 'physical', label: 'Physical' },
    { value: 'health', label: 'Health' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'fun', label: 'Fun' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'emotional', label: 'Emotional' },
    { value: 'time', label: 'Time' },
    { value: 'economics', label: 'Economics' },
]

export default function Dashboard() {
    const [habits, setHabits] = useState([])
    const [newHabitName, setNewHabitName] = useState('')
    const [newHabitCategory, setNewHabitCategory] = useState('physical')
    const [loading, setLoading] = useState(true)
    const [completedToday, setCompletedToday] = useState([])
    const [allCompletions, setAllCompletions] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetchHabits()
        fetchCompletions()
        // requestNotificationPermission()
    }, [])

    useEffect(() => {
        if (habits.length > 0) unlockAchievements()
    }, [habits, allCompletions])

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
            .insert({ name: newHabitName.trim(), user_id: user.id, category: newHabitCategory })
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

    function getCategoryLabel(value) {
        return CATEGORIES.find(c => c.value === value)?.label || ''
    }

    async function unlockAchievements() {
        const { data: existing } = await supabase
            .from('achievements')
            .select('achievement_key')

        const unlockedKeys = existing?.map(a => a.achievement_key) || []
        const { data: { user } } = await supabase.auth.getUser()

        const toUnlock = checkAchievements(habits, allCompletions, unlockedKeys)

        if (toUnlock.length === 0) return

        await supabase
            .from('achievements')
            .insert(toUnlock.map(key => ({ user_id: user.id, achievement_key: key })))
    }

    async function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission()
        }
    }

    // async function sendTestNotification() {
    //     if (Notification.permission === 'granted') {
    //         const registration = await navigator.serviceWorker.getRegistration()
    //         if (registration) {
    //             registration.showNotification('Habit Tracker', {
    //                 body: "Don't forget to check off your habits today!",
    //                 icon: '/icon-192.png'
    //             })
    //         }
    //     }
    // }

    if (loading) return <p>Loading...</p>

    return (
        <div className={styles.page}>
            <nav className={styles.navbar}>
                <span className={styles.logo}>Habit Tracker</span>
                <div className={styles.navRight}>
                    <button className={styles.achievementsBtn} onClick={() => navigate('/achievements')}>Achievements</button>
                    <button className={styles.logoutBtn} onClick={signOut}>Log out</button>
                </div>
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

                    <select className={styles.categorySelect} value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value)}>
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
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
                                <span className={styles.categoryTag}>{getCategoryLabel(habit.category)}</span>
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