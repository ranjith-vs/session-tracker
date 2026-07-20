export interface Profile {
  id: string
  username: string
  created_at: string
}

export interface Exercise {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  start_time: string | null
  end_time: string | null
  total_duration_seconds: number | null
  notes: string | null
  created_at: string
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  rest_before_seconds: number
  created_at: string
  exercise?: Exercise
  sets?: ExerciseSet[]
}

export interface ExerciseSet {
  id: string
  session_exercise_id: string
  set_number: number
  reps: number | null
  weight: number | null
  time_elapsed_seconds: number | null
  rest_before_seconds: number
  remarks: string | null
  created_at: string
}

export interface Food {
  id: string
  user_id: string
  name: string
  calories_per_100g: number
  carbs_per_100g: number | null
  protein_per_100g: number | null
  fat_per_100g: number | null
  created_at: string
  updated_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  food_id: string
  date: string
  grams: number
  calories: number
  carbs: number | null
  protein: number | null
  fat: number | null
  created_at: string
  food?: Food
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight: number
  notes: string | null
  created_at: string
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
  session_exercises: (SessionExercise & {
    exercise: Exercise
    sets: ExerciseSet[]
  })[]
}
