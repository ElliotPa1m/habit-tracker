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
        const {data, error} = await supabase
            .from('habits')
            .select('*')
            .order('created_at', { ascending: true})
        
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
        <div>
            <button onClick={signOut}>Log out</button>

            <h1>My habits</h1>

            <form onSubmit={addHabits}>
                <input
                    type="text"
                    placeholder="New habit..."
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                />
                <button type="submit">Add</button>
            </form>

            {habits.length === 0 && <p>No habits yet. Add one!</p>}

            <ul>
                {habits.map(habit => (
                    <li key={habit.id}>
                        <button onClick={() => toggleCompletion(habit.id)}>
                            {completedToday.includes(habit.id) ? '☑️' : '⬜'}
                        </button>
                        <span>{habit.icon} {habit.name}</span>
                        <button onClick={() => deleteHabit(habit.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}