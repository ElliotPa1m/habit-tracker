import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ACHIEVEMENTS } from "../lib/achievements";
import styles from '../css/Achievements.module.css';

export default function Achievements() {
    const [unlockedKeys, setUnlockedKeys] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchAchievements()
    }, [])

    async function fetchAchievements() {
        const { data, error } = await supabase
            .from('achievements')
            .select('achievement_key, unlocked_at')

        if (error) console.error(error)
        else setUnlockedKeys(data.map(a => a.achievement_key))
        setLoading(false)
    }

    if (loading) return <p>Loading...</p>

    const groups = [...new Set(ACHIEVEMENTS.map(a => a.group))]

    return (
        <div className={styles.page}>
            <nav className={styles.navbar}>
                <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
                <span className={styles.logo}>Achievements</span>
                <span className={styles.counter}>{unlockedKeys.length} / {ACHIEVEMENTS.length}</span>
            </nav>

            <div className={styles.body}>
                <div className={styles.groupsGrid}>
                    {groups.map(group => (
                        <div key={group} className={styles.group}>
                            <div className={styles.groupLabel}>{group}</div>
                            <div className={styles.grid}>
                                {ACHIEVEMENTS.filter(a => a.group === group).map(achievement => {
                                    const unlocked = unlockedKeys.includes(achievement.key)
                                    return (
                                        <div key={achievement.key} className={`${styles.card} ${unlocked ? styles.cardUnlocked : styles.cardLocked}`}>
                                            <span className={styles.icon}>{unlocked ? achievement.icon : '🔒'}</span>
                                            <div className={styles.info}>
                                                <div className={styles.label}>{unlocked ? achievement.label : '???'}</div>
                                                <div className={styles.description}>
                                                    {unlocked ? achievement.description : 'Keep going to unlock this'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}