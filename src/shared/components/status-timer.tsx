import { useEffect, useState } from "react"

interface StatusTimerProps {
    timestamp: any // Firestore Timestamp or Date
    className?: string
}

export function StatusTimer({ timestamp, className = "" }: StatusTimerProps) {
    const [elapsed, setElapsed] = useState<string>("00:00")

    useEffect(() => {
        if (!timestamp) {
            setElapsed("00:00")
            return
        }

        const updateTimer = () => {
            // Handle Firestore timestamp (seconds/nanoseconds) or Date object
            const startDate = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
            const now = new Date()
            const diffInSeconds = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 1000))

            const hours = Math.floor(diffInSeconds / 3600)
            const minutes = Math.floor((diffInSeconds % 3600) / 60)
            const seconds = diffInSeconds % 60

            const parts = []
            if (hours > 0) parts.push(hours.toString().padStart(2, '0'))
            parts.push(minutes.toString().padStart(2, '0'))
            parts.push(seconds.toString().padStart(2, '0'))

            setElapsed(parts.join(':'))
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [timestamp])

    return (
        <span className={`font-mono text-[10px] opacity-70 ${className}`}>
            {elapsed}
        </span >
    )
}
