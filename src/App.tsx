import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import TopBar from "@/sections/TopBar"
import AvatarSection from "@/sections/AvatarSection"
import XPBar from "@/sections/XPBar"
import WorkoutLog from "@/sections/WorkoutLog"
import StatusPanel from "@/sections/StatusPanel"
import BottomNav from "@/sections/BottomNav"
import AuthPage from "@/sections/AuthPage"
import CharacterPage from "@/sections/CharacterPage"
import SocialHubPage from "@/sections/SocialHubPage"
import RankingPage from "@/sections/RankingPage"
import TrainingPage from "@/sections/TrainingPage"
import WorkoutPage from "@/sections/WorkoutPage"
import AchievementsPage from "@/sections/AchievementsPage"
import RoutinePage from "@/sections/RoutinePage"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { getCharacterGrowthImage, type CharacterId } from "@/assets/characters"
import { SELECTED_CHARACTER_STORAGE_KEY } from "@/utils/characterSelection"
import { mergeLocalDataToFirestore, saveTrainingEntries, saveUserProfile, subscribeToPendingFriendRequestCount, subscribeToUserTrainingData, type UserProfile } from "@/utils/firestoreSync"
import { initialRoutines, type Routine } from "@/sections/routineData"
import { sampleEntries, type TrainingEntry, type Big3Records, type Big3OneRMRecords, calculateBig3Records, calculateBig3OneRMRecords, type BodyPartXPMap, calculateBodyPartXPMap, calculateTotalXP, getLevelFromXP, LEVEL_THRESHOLDS, MAX_LEVEL, XP_PER_LEVEL } from "@/sections/TrainingPage"
import gorillaLv3Image from "@/assets/characters/gorilla_lv3.png"
import { applyTrainingCompletion, calculateWeeklyProgressSummary, getStoredWeeklyProgressState, loadWeeklyProgressFromFirestore, persistWeeklyProgressState, resolveWeeklyProgress, saveWeeklyProgressToFirestore, type WeeklyProgressState } from "@/utils/weeklyProgress"

const THEME_STORAGE_KEY = "gym-quest-theme"
const ROUTINES_STORAGE_KEY = "gym-quest-routines"
const MONTHLY_CHARACTER_HISTORY_STORAGE_KEY = "gym-quest-monthly-character-history"
const PROFILE_STORAGE_KEY = "gym-quest-profile"
const TRAINING_ENTRIES_STORAGE_KEY = "gym-quest-training-entries"
const SPLASH_SCREEN_DURATION_MS = 1800
const APP_VERSION = "v1.0"

type ThemeMode = "light" | "dark"

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light"
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredRoutines(): Routine[] {
  if (typeof window === "undefined") {
    return initialRoutines
  }

  const storedRoutines = window.localStorage.getItem(ROUTINES_STORAGE_KEY)
  if (!storedRoutines) {
    return initialRoutines
  }

  try {
    const parsedRoutines = JSON.parse(storedRoutines)
    return Array.isArray(parsedRoutines) ? parsedRoutines as Routine[] : initialRoutines
  } catch {
    return initialRoutines
  }
}

function getStoredTheme(): ThemeMode {
  return getPreferredTheme()
}

function getStoredProfile() {
  if (typeof window === "undefined") {
    return { weight: 70, height: 175 }
  }

  const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!storedProfile) {
    return { weight: 70, height: 175 }
  }

  try {
    const parsedProfile = JSON.parse(storedProfile)
    if (typeof parsedProfile?.weight === "number" && typeof parsedProfile?.height === "number") {
      return parsedProfile as { weight: number; height: number }
    }
  } catch {
    return { weight: 70, height: 175 }
  }

  return { weight: 70, height: 175 }
}

function getStoredTrainingEntries() {
  if (typeof window === "undefined") {
    return sampleEntries
  }

  const storedEntries = window.localStorage.getItem(TRAINING_ENTRIES_STORAGE_KEY)
  if (!storedEntries) {
    return sampleEntries
  }

  try {
    const parsedEntries = JSON.parse(storedEntries)
    return Array.isArray(parsedEntries) ? parsedEntries as TrainingEntry[] : sampleEntries
  } catch {
    return sampleEntries
  }
}

function getTrainingDaysCount(entries: TrainingEntry[]) {
  return new Set(
    entries.map((entry) => entry.dateKey ?? `${entry.dateLabel}-${entry.daysAgo ?? 0}`),
  ).size
}

function createLocalUserProfile(displayName: string | null | undefined, xp: number, level: number, trainingEntries: TrainingEntry[]): UserProfile {
  return {
    displayName: displayName?.trim() || "GORU GYM USER",
    level,
    xp,
    trainingDays: getTrainingDaysCount(trainingEntries),
  }
}

// Sample player data
const PLAYER = {
  name: "WARRIOR",
  level: 12,
  currentXP: 685,
  maxXP: 1000,
  streakDays: 14,
  stats: {
    strength:   18,
    endurance:  16,
    stamina:    17,
    focus:      14,
    discipline: 15,
    attack:     28,
    defense:    24,
    vitality:   210,
    recovery:   26,
    agility:    19,
  },
  motivationMessage: "Every rep is a step toward greatness.",
}

type NavTab = "home" | "routine" | "training" | "character" | "social" | "ranking" | "achievements" | "auth"

interface HomeTrainingSummary {
  date: string
  exerciseCount: number
  setCount: number
  totalWeight: number
}

type GorillaMood = "praise" | "taunt"

interface MonthlyCharacterHistoryEntry {
  monthKey: string
  monthLabel: string
  level: number
  xp: number
  workoutCount: number
  trainingDays: number
}

interface StoredMonthlyCharacterHistoryEntry {
  maxLevel: number
  totalXP: number
  trainingDays: number
}

function getTodayTrainingSummary(entries: TrainingEntry[]): HomeTrainingSummary | null {
  const todayEntries = entries.filter((entry) => entry.dateLabel === "today")

  if (todayEntries.length === 0) {
    return null
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    exerciseCount: todayEntries.length,
    setCount: todayEntries.reduce((total, entry) => total + entry.sets.length, 0),
    totalWeight: todayEntries.reduce(
      (total, entry) => total + entry.sets.reduce((setTotal, set) => setTotal + set.weight * (set.reps ?? 0), 0),
      0,
    ),
  }
}

function getTodayTrainingStatus(entries: TrainingEntry[]): GorillaMood {
  return entries.some((entry) => entry.dateLabel === "today") ? "praise" : "taunt"
}

function getNextLevelXp(level: number) {
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return level >= MAX_LEVEL ? currentLevelXP + XP_PER_LEVEL : (LEVEL_THRESHOLDS[level] ?? currentLevelXP + XP_PER_LEVEL)
}

function getEntryDate(entry: TrainingEntry) {
  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (entry.dateLabel) {
    case "today":
      return baseDate
    case "yesterday":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1)
    case "daysAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0))
    case "weekAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7)
  }
}

function getMonthlyCharacterLevel(trainingDays: number) {
  if (trainingDays >= 25) return 5
  if (trainingDays >= 19) return 4
  if (trainingDays >= 13) return 3
  if (trainingDays >= 7) return 2
  return 1
}

function getMonthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getMonthlyTrainingDays(entries: TrainingEntry[], monthKey: string) {
  const uniqueDays = new Set(
    entries
      .map((entry) => getEntryDate(entry))
      .filter((entryDate) => getMonthKeyFromDate(entryDate) === monthKey)
      .map((entryDate) => entryDate.toISOString().slice(0, 10)),
  )

  return uniqueDays.size
}

function getMonthlyCharacterHistory(entries: TrainingEntry[]): MonthlyCharacterHistoryEntry[] {
  const formatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" })
  const monthlyMap = entries.reduce<Map<string, { xp: number; workoutCount: number; date: Date; trainingDays: Set<string> }>>((map, entry) => {
    const entryDate = getEntryDate(entry)
    const monthKey = getMonthKeyFromDate(entryDate)
    const current = map.get(monthKey) ?? { xp: 0, workoutCount: 0, date: new Date(entryDate.getFullYear(), entryDate.getMonth(), 1), trainingDays: new Set<string>() }
    current.xp += Math.round(entry.sets.reduce((total, set) => total + set.weight * (set.reps ?? 0), 0) * 0.1)
    current.workoutCount += 1
    current.trainingDays.add(entryDate.toISOString().slice(0, 10))
    map.set(monthKey, current)
    return map
  }, new Map())

  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, value]) => {
      return {
        monthKey,
        monthLabel: formatter.format(value.date),
        level: getMonthlyCharacterLevel(value.trainingDays.size),
        xp: value.xp,
        workoutCount: value.workoutCount,
        trainingDays: value.trainingDays.size,
      }
    })
}

function getStoredMonthlyCharacterHistory(): Record<string, StoredMonthlyCharacterHistoryEntry> {
  if (typeof window === "undefined") {
    return {}
  }

  const storedHistory = window.localStorage.getItem(MONTHLY_CHARACTER_HISTORY_STORAGE_KEY)
  if (!storedHistory) {
    return {}
  }

  try {
    const parsedHistory = JSON.parse(storedHistory)
    return parsedHistory && typeof parsedHistory === "object" ? parsedHistory as Record<string, StoredMonthlyCharacterHistoryEntry> : {}
  } catch {
    return {}
  }
}

function buildMonthlyCharacterHistoryRecord(entries: MonthlyCharacterHistoryEntry[]) {
  return entries.reduce<Record<string, StoredMonthlyCharacterHistoryEntry>>((record, entry) => {
    record[entry.monthKey] = {
      maxLevel: entry.level,
      totalXP: entry.xp,
      trainingDays: entry.trainingDays,
    }
    return record
  }, {})
}

function getMergedMonthlyCharacterHistory(
  storedHistory: Record<string, StoredMonthlyCharacterHistoryEntry>,
  computedHistory: MonthlyCharacterHistoryEntry[],
) {
  const formatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" })
  const mergedMap = new Map<string, MonthlyCharacterHistoryEntry>()

  Object.entries(storedHistory).forEach(([monthKey, entry]) => {
    const [year, month] = monthKey.split("-").map(Number)
    const monthDate = new Date(year, (month ?? 1) - 1, 1)
    mergedMap.set(monthKey, {
      monthKey,
      monthLabel: formatter.format(monthDate),
      level: entry.maxLevel,
      xp: entry.totalXP,
      workoutCount: 0,
      trainingDays: entry.trainingDays,
    })
  })

  computedHistory.forEach((entry) => {
    mergedMap.set(entry.monthKey, entry)
  })

  return Array.from(mergedMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

function AppContent() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState<ThemeMode>(getPreferredTheme)
  const [showSplashScreen, setShowSplashScreen] = useState(true)
  const [activeTab, setActiveTab] = useState<NavTab>("home")
  const [workoutActive, setWorkoutActive] = useState(false)
  const [profile, setProfile] = useState(getStoredProfile)
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>(getStoredTrainingEntries)
  const initialBig3Records = useMemo<Big3Records>(() => calculateBig3Records(sampleEntries), [])
  const initialBig3OneRMRecords = useMemo<Big3OneRMRecords>(() => calculateBig3OneRMRecords(sampleEntries), [])
  const initialXP = useMemo(() => calculateTotalXP(sampleEntries), [])
  const initialBodyPartXP = useMemo<BodyPartXPMap>(() => calculateBodyPartXPMap(sampleEntries), [])
  const [big3Records, setBig3Records] = useState<Big3Records>(initialBig3Records)
  const [big3OneRMRecords, setBig3OneRMRecords] = useState<Big3OneRMRecords>(initialBig3OneRMRecords)
  const [xp, setXp] = useState(initialXP)
  const [bodyPartXP, setBodyPartXP] = useState<BodyPartXPMap>(initialBodyPartXP)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => createLocalUserProfile(user?.displayName, initialXP, getLevelFromXP(initialXP), getStoredTrainingEntries()))
  const [routines, setRoutines] = useState<Routine[]>(getStoredRoutines)
  const [pendingStartRoutine, setPendingStartRoutine] = useState<Routine | null>(null)
  const [selectedTrainingDateKey, setSelectedTrainingDateKey] = useState<string | null>(null)
  const [selectedCharacter] = useState<CharacterId>("gorilla")
  const [levelUpOverlayLevel, setLevelUpOverlayLevel] = useState<number | null>(null)
  const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0)
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressState>(getStoredWeeklyProgressState)
  const [showWeeklyGoalModal, setShowWeeklyGoalModal] = useState(false)
  const level = useMemo(() => getLevelFromXP(xp), [xp])
  const nextLevelXp = useMemo(() => getNextLevelXp(level), [level])
  const todayTrainingSummary = useMemo(() => getTodayTrainingSummary(trainingEntries), [trainingEntries])
  const todayTrainingStatus = useMemo(() => getTodayTrainingStatus(trainingEntries), [trainingEntries])
  const computedMonthlyHistory = useMemo(() => getMonthlyCharacterHistory(trainingEntries), [trainingEntries])
  const [storedMonthlyHistory, setStoredMonthlyHistory] = useState<Record<string, StoredMonthlyCharacterHistoryEntry>>(getStoredMonthlyCharacterHistory)
  const currentMonthKey = getMonthKeyFromDate(new Date())
  const monthlyCharacterLevel = useMemo(() => getMonthlyCharacterLevel(getMonthlyTrainingDays(trainingEntries, currentMonthKey)), [currentMonthKey, trainingEntries])
  const monthlyHistory = useMemo(
    () => getMergedMonthlyCharacterHistory(storedMonthlyHistory, computedMonthlyHistory),
    [computedMonthlyHistory, storedMonthlyHistory],
  )
  const resolvedWeeklyProgress = useMemo(() => resolveWeeklyProgress(trainingEntries, weeklyProgress), [trainingEntries, weeklyProgress])
  const weeklyProgressSummary = useMemo(() => calculateWeeklyProgressSummary(trainingEntries, resolvedWeeklyProgress), [resolvedWeeklyProgress, trainingEntries])
  const previousLevelRef = useRef(level)
  const isApplyingRemoteSnapshotRef = useRef(false)
  const lastSyncedTrainingEntriesRef = useRef<string>("")
  const lastSyncedProfileRef = useRef<string>("")

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplashScreen(false), SPLASH_SCREEN_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(SELECTED_CHARACTER_STORAGE_KEY, selectedCharacter)
  }, [selectedCharacter])

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    window.localStorage.setItem(TRAINING_ENTRIES_STORAGE_KEY, JSON.stringify(trainingEntries))
  }, [trainingEntries])

  useEffect(() => {
    window.localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines))
  }, [routines])

  useEffect(() => {
    persistWeeklyProgressState(resolvedWeeklyProgress)
    if (JSON.stringify(resolvedWeeklyProgress) !== JSON.stringify(weeklyProgress)) {
      setWeeklyProgress(resolvedWeeklyProgress)
    }
  }, [resolvedWeeklyProgress, weeklyProgress])

  useEffect(() => {
    const nextHistory = buildMonthlyCharacterHistoryRecord(computedMonthlyHistory)
    setStoredMonthlyHistory((currentHistory) => {
      const mergedHistory = { ...currentHistory, ...nextHistory }
      window.localStorage.setItem(MONTHLY_CHARACTER_HISTORY_STORAGE_KEY, JSON.stringify(mergedHistory))
      return mergedHistory
    })
  }, [computedMonthlyHistory])

  useEffect(() => {
    if (level > previousLevelRef.current) {
      setLevelUpOverlayLevel(level)
    }
    previousLevelRef.current = level
  }, [level])

  useEffect(() => {
    if (levelUpOverlayLevel === null) return
    const timer = window.setTimeout(() => setLevelUpOverlayLevel(null), 3000)
    return () => window.clearTimeout(timer)
  }, [levelUpOverlayLevel])

  useEffect(() => {
    if (!user) {
      setPendingFriendRequestCount(0)
      return
    }

    return subscribeToPendingFriendRequestCount(user.uid, setPendingFriendRequestCount)
  }, [user])

  useEffect(() => {
    setBig3Records(calculateBig3Records(trainingEntries))
    setBig3OneRMRecords(calculateBig3OneRMRecords(trainingEntries))
    setXp(calculateTotalXP(trainingEntries))
    setBodyPartXP(calculateBodyPartXPMap(trainingEntries))
  }, [trainingEntries])

  useEffect(() => {
    if (!user) {
      setUserProfile((current) => ({
        ...current,
        level,
        xp,
        trainingDays: getTrainingDaysCount(trainingEntries),
      }))
      return
    }

    setUserProfile((current) => ({
      ...current,
      displayName: current.displayName || user.displayName?.trim() || "GORU GYM USER",
      level,
      xp,
      trainingDays: getTrainingDaysCount(trainingEntries),
    }))
  }, [level, trainingEntries, user, xp])

  useEffect(() => {
    if (!user) {
      lastSyncedTrainingEntriesRef.current = ""
      lastSyncedProfileRef.current = ""
      return
    }

    let isMounted = true

    const syncUserData = async () => {
      const remoteWeeklyProgress = await loadWeeklyProgressFromFirestore(user)
      if (remoteWeeklyProgress) {
        setWeeklyProgress(remoteWeeklyProgress)
      }
      const mergedData = await mergeLocalDataToFirestore(user, {
        trainingEntries,
        profile: {
          ...userProfile,
          ...weeklyProgress,
        },
      })

      if (!isMounted) {
        return
      }

      isApplyingRemoteSnapshotRef.current = true
      setTrainingEntries(mergedData.trainingEntries)
      lastSyncedTrainingEntriesRef.current = JSON.stringify(mergedData.trainingEntries)
      lastSyncedProfileRef.current = JSON.stringify(mergedData.profile)
      setUserProfile((current) => ({ ...current, ...mergedData.profile }))
      window.setTimeout(() => {
        isApplyingRemoteSnapshotRef.current = false
      }, 0)
    }

    void syncUserData()

    const unsubscribe = subscribeToUserTrainingData(
      user.uid,
      (payload) => {
        if (!isMounted) {
          return
        }

        isApplyingRemoteSnapshotRef.current = true
        setTrainingEntries(payload.trainingEntries)
        lastSyncedTrainingEntriesRef.current = JSON.stringify(payload.trainingEntries)
        lastSyncedProfileRef.current = JSON.stringify(payload.profile)
        setUserProfile((current) => ({ ...current, ...payload.profile }))
        setWeeklyProgress((current) => ({
          ...current,
          weeklyGoal: payload.profile.weeklyGoal ?? current.weeklyGoal,
          currentStreak: payload.profile.currentStreak ?? current.currentStreak,
          weeklyXP: payload.profile.weeklyXP ?? current.weeklyXP,
          streakFreezeAvailable: payload.profile.streakFreezeAvailable ?? current.streakFreezeAvailable,
          weekStartDate: payload.profile.weekStartDate ?? current.weekStartDate,
        }))
        window.setTimeout(() => {
          isApplyingRemoteSnapshotRef.current = false
        }, 0)
      },
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [trainingEntries, user, userProfile])

  useEffect(() => {
    if (!user || isApplyingRemoteSnapshotRef.current) {
      return
    }

    const serializedEntries = JSON.stringify(trainingEntries)
    if (serializedEntries === lastSyncedTrainingEntriesRef.current) {
      return
    }

    lastSyncedTrainingEntriesRef.current = serializedEntries
    void saveTrainingEntries(user.uid, trainingEntries)
  }, [trainingEntries, user])

  useEffect(() => {
    if (!user) {
      return
    }

    const nextProfile = {
      ...userProfile,
      displayName: userProfile.displayName || user.displayName?.trim() || "GORU GYM USER",
      level,
      xp,
      trainingDays: getTrainingDaysCount(trainingEntries),
      weeklyGoal: resolvedWeeklyProgress.weeklyGoal,
      currentStreak: resolvedWeeklyProgress.currentStreak,
      weeklyXP: resolvedWeeklyProgress.weeklyXP,
      streakFreezeAvailable: resolvedWeeklyProgress.streakFreezeAvailable,
      weekStartDate: resolvedWeeklyProgress.weekStartDate,
    }
    const serializedProfile = JSON.stringify(nextProfile)
    if (serializedProfile === lastSyncedProfileRef.current) {
      return
    }

    lastSyncedProfileRef.current = serializedProfile
    void saveUserProfile(user.uid, nextProfile)
    void saveWeeklyProgressToFirestore(user, resolvedWeeklyProgress)
  }, [level, resolvedWeeklyProgress, trainingEntries, user, xp])

  const handleTrainingSaved = (targetDateKey: string) => {
    setWeeklyProgress((current) => applyTrainingCompletion(trainingEntries, current, targetDateKey).nextState)
  }

  const handleReturnFromWorkout = () => {
    setWorkoutActive(false)
    setActiveTab("home")
  }

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")
  }

  const handleBackupImportComplete = () => {
    setTheme(getStoredTheme())
    setRoutines(getStoredRoutines())
    setStoredMonthlyHistory(getStoredMonthlyCharacterHistory())
  }

  const renderMainContent = () => {
    if (workoutActive) {
      return (
        <WorkoutPage
          workoutsThisWeek={4}
          currentStreak={PLAYER.streakDays}
          onReturnToGuild={handleReturnFromWorkout}
          onWorkoutStateChange={setWorkoutActive}
        />
      )
    }

    if (activeTab === "routine") {
      return (
        <RoutinePage
          routines={routines}
          onRoutinesChange={setRoutines}
          onStartRoutine={(routine) => {
            setPendingStartRoutine(routine)
            setActiveTab("training")
          }}
        />
      )
    }

    if (activeTab === "character") {
      return (
        <CharacterPage
          xp={xp}
          bodyPartXP={bodyPartXP}
          monthlyHistory={monthlyHistory}
          monthlyCharacterLevel={monthlyCharacterLevel}
          selectedCharacter={selectedCharacter}
          big3OneRMRecords={big3OneRMRecords}
          onBackupImportComplete={handleBackupImportComplete}
        />
      )
    }

    if (activeTab === "ranking") {
      return <RankingPage socialBadgeCount={pendingFriendRequestCount} />
    }

    if (activeTab === "social") {
      return (
        <SocialHubPage
          profile={userProfile}
          onProfileChange={setUserProfile}
          socialBadgeCount={pendingFriendRequestCount}
        />
      )
    }

    if (activeTab === "training") {
      return (
        <TrainingPage
          entries={trainingEntries}
          onEntriesChange={setTrainingEntries}
          big3Records={big3Records}
          onBig3RecordsChange={setBig3Records}
          xp={xp}
          level={level}
          onXpChange={setXp}
          bodyPartXP={bodyPartXP}
          onBodyPartXPChange={setBodyPartXP}
          routines={routines}
          pendingStartRoutine={pendingStartRoutine}
          onPendingStartRoutineConsumed={() => setPendingStartRoutine(null)}
          selectedDateKey={selectedTrainingDateKey}
          onTrainingSaved={handleTrainingSaved}
        />
      )
    }

    if (activeTab === "achievements") {
      return <AchievementsPage trainingEntries={trainingEntries} big3Records={big3Records} />
    }

    if (activeTab === "auth") {
      return <AuthPage />
    }

    return (
      <>
        <AvatarSection
          level={level}
          characterName={PLAYER.name}
          selectedCharacter={selectedCharacter}
          monthlyCharacterLevel={monthlyCharacterLevel}
          todayTrainingStatus={todayTrainingStatus}
          weight={profile.weight}
          height={profile.height}
          xp={xp}
          nextLevelXp={nextLevelXp}
          onSaveProfile={setProfile}
        />
        <XPBar
          level={level}
          xp={xp}
        />
        <WorkoutLog
          onClick={() => {
            setSelectedTrainingDateKey(null)
            setActiveTab("training")
          }}
          onCtaClick={() => setActiveTab("routine")}
          todaySummary={todayTrainingSummary}
          trainingEntries={trainingEntries}
          selectedDateKey={selectedTrainingDateKey}
          onDateSelect={(dateKey) => {
            setSelectedTrainingDateKey(dateKey)
            setActiveTab("training")
          }}
        />
        <StatusPanel
          stats={PLAYER.stats}
          big3Records={big3Records}
          big3OneRMRecords={big3OneRMRecords}
          motivationMessage={t("home.motivation")}
          weeklyProgress={weeklyProgressSummary}
          onOpenGoalSettings={() => setShowWeeklyGoalModal(true)}
        />
        {showWeeklyGoalModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm rounded-[28px] border border-[#F5A623]/30 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:bg-[#111111]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B7791F]">週間目標</div>
              <h3 className="mt-2 text-xl font-black text-[#0a0a0a] dark:text-white">週に何回トレーニングする？</h3>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 7 }, (_, index) => index + 1).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      setWeeklyProgress((current) => ({ ...current, weeklyGoal: goal }))
                      setShowWeeklyGoalModal(false)
                    }}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${weeklyProgressSummary.weeklyGoal === goal ? "border-[#F5A623] bg-[#F5A623] text-[#0a0a0a]" : "border-slate-200 bg-[#FFF8E7] text-[#8A5A00] dark:border-[#333333] dark:bg-[#171717] dark:text-[#FFD27A]"}`}
                  >
                    週{goal}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setShowWeeklyGoalModal(false)} className="mt-4 w-full rounded-2xl bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white dark:bg-[#F5A623] dark:text-[#0a0a0a]">
                閉じる
              </button>
            </div>
          </div>
        )}
        <div className="h-4 bg-[var(--color-bg)] dark:bg-[var(--color-dark-bg)]" />
      </>
    )
  }

  return (
    <div
      className="flex min-h-screen items-start justify-center bg-[var(--color-bg)] transition-colors duration-200 dark:bg-[var(--color-dark-bg)]"
    >
      <div
        className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-bg)] shadow-[0_24px_60px_rgba(17,17,17,0.12)] transition-colors duration-200 dark:bg-[var(--color-dark-bg)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <TopBar
          theme={theme}
          onThemeToggle={toggleTheme}
          authActionLabel={user ? "ログアウト" : "ログイン"}
          onAuthAction={() => {
            if (user) {
              void logout()
              return
            }
            setActiveTab("auth")
          }}
        />

        <main className="flex-1 overflow-y-auto pb-24" id="main-content">
          {renderMainContent()}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} socialBadgeCount={pendingFriendRequestCount} />

        <AnimatePresence>
          {showSplashScreen ? (
            <motion.div
              className="absolute inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0.72 }}
                animate={{ opacity: [0.58, 0.9, 0.68] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 50% 38%, rgba(245,166,35,0.34) 0%, rgba(245,166,35,0.14) 24%, rgba(245,166,35,0.05) 42%, rgba(10,10,10,0.96) 74%)",
                }}
              />
              <motion.div
                className="absolute left-1/2 top-[18%] h-40 w-40 -translate-x-1/2 rounded-full bg-[#F5A623]/20 blur-3xl"
                animate={{ scale: [0.9, 1.18, 0.96], opacity: [0.35, 0.72, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F5A623]/15"
                animate={{ scale: [0.92, 1.04, 0.96], opacity: [0.2, 0.42, 0.22] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F5A623]/25"
                animate={{ scale: [1, 1.08, 1], opacity: [0.24, 0.5, 0.24] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="relative z-10 flex h-full w-full flex-col items-center justify-between px-7 pb-8 pt-14 text-center"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-[#F5A623]/80"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Ultimate Training Quest
                  </motion.div>
                  <motion.div
                    className="bg-gradient-to-r from-[#F5A623] via-[#FFD27A] to-[#FFF4D6] bg-clip-text text-[2.7rem] font-black tracking-[0.34em] text-transparent"
                    animate={{
                      textShadow: [
                        "0 0 18px rgba(245,166,35,0.18)",
                        "0 0 34px rgba(245,166,35,0.34)",
                        "0 0 18px rgba(245,166,35,0.18)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    GORU GYM
                  </motion.div>
                  <motion.div
                    className="mt-3 text-sm font-semibold tracking-[0.22em] text-white/88"
                    animate={{ opacity: [0.72, 1, 0.72], y: [0, -1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    筋トレで育てろ。
                  </motion.div>
                </div>

                <motion.div
                  className="relative flex flex-1 items-center justify-center"
                  animate={{ scale: [1, 1.025, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute h-72 w-72 rounded-full bg-[#F5A623]/18 blur-3xl"
                    animate={{ scale: [0.92, 1.12, 0.96], opacity: [0.3, 0.7, 0.34] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute h-80 w-80 rounded-full border border-[#F5A623]/20"
                    animate={{ rotate: [0, 8, 0], scale: [0.96, 1.04, 0.98] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="relative flex h-72 w-72 items-center justify-center rounded-full border border-[#F5A623]/40 bg-white/[0.03] shadow-[0_0_80px_rgba(245,166,35,0.22)] backdrop-blur-[2px]"
                    animate={{
                      boxShadow: [
                        "0 0 48px rgba(245,166,35,0.18)",
                        "0 0 92px rgba(245,166,35,0.34)",
                        "0 0 48px rgba(245,166,35,0.18)",
                      ],
                    }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.img
                      src={gorillaLv3Image}
                      alt="GORU GYM Gorilla"
                      className="h-60 w-60 object-contain drop-shadow-[0_0_28px_rgba(245,166,35,0.42)]"
                      animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </motion.div>

                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    className="h-px w-28 bg-gradient-to-r from-transparent via-[#F5A623] to-transparent"
                    animate={{ opacity: [0.35, 1, 0.35], scaleX: [0.9, 1.08, 0.9] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="text-[0.65rem] font-medium uppercase tracking-[0.38em] text-white/45">
                    Powered by GORU
                  </div>
                  <div className="text-[0.65rem] font-semibold tracking-[0.28em] text-[#F5A623]/72">
                    {APP_VERSION}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {levelUpOverlayLevel !== null ? (
            <motion.div
              className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,212,0,0.28) 0%, rgba(255,196,0,0.18) 34%, rgba(11,11,11,0.94) 100%)",
                  backdropFilter: "blur(6px)",
                }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: [0.8, 1.08, 1], opacity: [0, 0.95, 0.7] }}
                exit={{ scale: 1.15, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(255,221,64,0.72) 24%, rgba(255,196,0,0.3) 48%, rgba(255,255,255,0) 72%)",
                  filter: "blur(8px)",
                }}
              />
              {Array.from({ length: 10 }).map((_, index) => (
                <motion.div
                  key={`level-up-ray-${index}`}
                  className="absolute left-1/2 top-1/2 origin-bottom rounded-full"
                  initial={{ opacity: 0, scaleY: 0.4, rotate: index * 36 }}
                  animate={{ opacity: [0, 0.85, 0], scaleY: [0.4, 1.15, 0.7], rotate: index * 36 + 10 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: 1, ease: "easeInOut", delay: index * 0.03 }}
                  style={{
                    width: "10px",
                    height: "180px",
                    marginLeft: "-5px",
                    marginTop: "-180px",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,212,0,0.88) 45%, rgba(255,255,255,0) 100%)",
                    boxShadow: "0 0 24px rgba(255,212,0,0.55)",
                  }}
                />
              ))}
              {Array.from({ length: 14 }).map((_, index) => (
                <motion.div
                  key={`level-up-spark-${index}`}
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{
                    x: Math.cos((index / 14) * Math.PI * 2) * (110 + (index % 3) * 24),
                    y: Math.sin((index / 14) * Math.PI * 2) * (110 + (index % 4) * 18),
                    opacity: [0, 1, 0],
                    scale: [0.4, 1.2, 0.2],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 + index * 0.04 }}
                  style={{
                    background: index % 2 === 0 ? "#FFD400" : "#FFF07A",
                    boxShadow: "0 0 18px rgba(255,255,255,0.9)",
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <motion.div
                  className="relative flex w-full max-w-[320px] flex-col items-center rounded-[2rem] border border-[rgba(255,212,0,0.45)] bg-white/10 px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]"
                  initial={{ opacity: 0, scale: 0.82, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  style={{
                    backdropFilter: "blur(14px)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,212,0,0.22) 100%)",
                  }}
                >
                  <motion.div
                    className="absolute inset-x-8 top-0 h-px"
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,244,168,0.95), transparent)" }}
                  />
                  <motion.img
                    src={getCharacterGrowthImage(selectedCharacter, monthlyCharacterLevel)}
                    alt="Level up character"
                    className="relative z-10 mb-4 h-32 w-32 rounded-full border border-[rgba(255,212,0,0.7)] object-cover shadow-[0_0_40px_rgba(255,212,0,0.45)]"
                    initial={{ scale: 0.8, rotate: -8 }}
                    animate={{ scale: [0.9, 1.06, 1], rotate: [0, 4, 0] }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                  <motion.div
                    className="text-xs font-semibold uppercase tracking-[0.45em] text-[var(--color-gold-light)]"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Celebration
                  </motion.div>
                  <div className="mt-2 bg-gradient-to-r from-[var(--color-gold-light)] via-white to-[var(--color-gold)] bg-clip-text text-4xl font-black tracking-[0.18em] text-transparent">
                    LEVEL UP!
                  </div>
                  <div className="mt-3 text-sm font-medium text-[var(--color-gold-light)]">Lv.</div>
                  <div className="text-6xl font-black leading-none text-white drop-shadow-[0_0_18px_rgba(255,212,0,0.65)]">
                    {levelUpOverlayLevel}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

