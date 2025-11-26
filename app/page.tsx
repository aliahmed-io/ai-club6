"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  BarChart,
  Lock,
  CheckCircle2,
  TrendingUp,
  Users,
  Sparkles,
  Armchair,
  Play,
  Clock,
  Send,
  AlertCircle,
  Heart,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { SimpleBarChart, DonutChart } from "./components/ui/Charts";

// Timer Component
function Timer({ questionStartTime, timerDuration }: { questionStartTime: number; timerDuration: number }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const elapsed = currentTime - questionStartTime;
  const timeRemaining = Math.max(0, timerDuration * 1000 - elapsed);
  const seconds = Math.ceil(timeRemaining / 1000);
  const percentage = (seconds / timerDuration) * 100;

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={seconds <= 10 ? "#ef4444" : "#6366f1"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${seconds <= 10 ? 'text-red-500' : 'text-indigo-600'}`}>
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<"loading" | "start" | "live-quiz" | "admin-login" | "admin-dashboard">("loading");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Current answer state
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Convex Mutations & Queries
  const liveSession = useQuery(api.surveys.getLiveSession);
  const submitLiveAnswer = useMutation(api.surveys.submitLiveAnswer);
  const startSession = useMutation(api.surveys.startSession);
  const startQuestion = useMutation(api.surveys.startQuestion);
  const nextQuestion = useMutation(api.surveys.nextQuestion);
  const endSession = useMutation(api.surveys.endSession);
  const clearAll = useMutation(api.surveys.clearAll);
  const resetGame = useMutation(api.surveys.resetGame);
  const toggleFavorite = useMutation(api.surveys.toggleFavorite);
  const deleteAnswer = useMutation(api.surveys.deleteAnswer);
  const liveAnswers = useQuery(api.surveys.getLiveAnswers,
    isAdmin && liveSession && liveSession.currentQuestion !== undefined ? { questionNumber: liveSession.currentQuestion } : "skip"
  );
  const userAnswer = useQuery(api.surveys.getUserAnswer,
    liveSession && liveSession.currentQuestion !== undefined && liveSession.currentQuestion >= 0 && userId
      ? { userId, questionNumber: liveSession.currentQuestion }
      : "skip"
  );

  // Initialize userId from localStorage (client-side only)
  useEffect(() => {
    let id = localStorage.getItem("quiz_user_id");
    if (!id) {
      id = Math.random().toString(36).substring(7);
      localStorage.setItem("quiz_user_id", id);
    }
    setUserId(id);
  }, []);

  // Initialize view
  useEffect(() => {
    if (view === "loading") {
      setView("start");
    }
  }, [view]);

  // Update current answer when user has already answered
  useEffect(() => {
    if (userAnswer) {
      setCurrentAnswer(userAnswer.answer);
    } else {
      setCurrentAnswer("");
    }
  }, [userAnswer]);

  // Timer update - refresh every 100ms for smooth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  // Auto-advance when timer expires (admin only)
  useEffect(() => {
    if (isAdmin && liveSession && liveSession.isActive && liveSession.currentQuestion >= 0) {
      if (liveSession.timeRemaining <= 0 && liveSession.currentQuestion < 4) {
        // Small delay before auto-advancing
        const timeout = setTimeout(() => {
          nextQuestion();
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [liveSession?.timeRemaining, isAdmin, liveSession?.currentQuestion]);

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !liveSession) return;

    try {
      await submitLiveAnswer({
        questionNumber: liveSession.currentQuestion,
        answer: currentAnswer,
        userId,
      });
    } catch (error: any) {
      const errorMessage = error.message || error.toString();

      // Handle profanity filter - suppress console error
      if (errorMessage.includes("appropriate language")) {
        showError("⚠️ Please use appropriate language.");
        return;
      }

      // Handle timeout - suppress console error
      if (errorMessage.includes("Time is up")) {
        showError("⏰ Time is up! Answer not submitted.");
        return;
      }

      console.error("Error submitting answer:", error);
      showError("❌ Failed to submit answer. Please try again.");
    }
  };

  const handleAdminLogin = (password: string) => {
    if (password === "EFFAT-AI-ADMIN") {
      setIsAdmin(true);
      setView("admin-dashboard");
    } else {
      showError("Incorrect password");
    }
  };

  const getQuestionContent = (questionNum: number) => {
    const questions = [
      { emoji: "🤖", text: "What's the last thing you asked ChatGPT?", type: "text" },
      { emoji: "😤", text: "What's the most annoying thing about ChatGPT?", type: "text" },
      { emoji: "🛋️", text: "Do you feel like ChatGPT is your therapist sometimes?", type: "text" },
      { emoji: "📅", text: "How many times a day do you use ChatGPT?", type: "mcq", options: ["1-3 times", "4-7 times", "8-15 times", "16-30 times", "30+ times"] },
      { emoji: "🤫", text: "If ChatGPT was a person, would you trust it with your secrets?", type: "text" },
    ];
    return questions[questionNum];
  };

  const isTimerExpired = !!(liveSession && liveSession.timeRemaining <= 0);
  const hasAnswered = !!userAnswer;

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {/* Error Toast */}
        {errorMsg && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-[90%] max-w-md">
            <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-red-400/50 backdrop-blur-sm">
              <span className="text-2xl">⚠️</span>
              <p className="font-bold text-lg">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/30 border-t-white mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-white text-lg font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans text-slate-800 overflow-x-hidden transition-all duration-500">
      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-[90%] max-w-md">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-red-400/50 backdrop-blur-sm">
            <span className="text-2xl">⚠️</span>
            <p className="font-bold text-lg">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto backdrop-blur-lg bg-white/60 px-3 sm:px-4 py-2 rounded-2xl border border-white/60 shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          <span className="font-bold text-slate-700 text-sm sm:text-base">GPT Habits Live</span>
        </div>
        <div className="pointer-events-auto">
          {view === "start" && (
            <button
              onClick={() => setView("admin-login")}
              className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors px-3 sm:px-4 py-2 backdrop-blur-lg bg-white/40 rounded-xl"
            >
              Admin
            </button>
          )}
          {(isAdmin || view === "admin-login") && (
            <button
              onClick={() => {
                setIsAdmin(false);
                setView("start");
              }}
              className="text-xs font-medium text-indigo-600 bg-white/70 backdrop-blur-lg px-3 py-1.5 sm:py-2 rounded-xl border border-indigo-200 hover:bg-white shadow-sm"
            >
              Back
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12 max-w-4xl min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* VIEW: START PAGE */}
          {view === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full text-center px-4"
            >
              <div className="mb-8 sm:mb-12">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                  <span className="text-5xl sm:text-6xl">🤖</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4 leading-tight px-4">
                  Live ChatGPT<br />Habits Quiz
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-md mx-auto px-4">
                  Join the live session! Answer questions in real-time with a 30-second timer.
                </p>
              </div>

              <div className="space-y-4 px-4">
                <Button
                  onClick={() => setView("live-quiz")}
                  className="w-full py-5 sm:py-6 text-lg sm:text-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/60 hover:scale-105 transition-all duration-300 rounded-2xl"
                >
                  Join Live Quiz <Play className="w-5 h-5 fill-current ml-2" />
                </Button>
                <p className="text-sm text-slate-400">Wait for the admin to start the session</p>
              </div>
            </motion.div>
          )}

          {/* VIEW: LIVE QUIZ */}
          {view === "live-quiz" && (
            <motion.div
              key="live-quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto w-full"
            >
              <Card>
                {(!liveSession || !liveSession.isActive) && (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-2 sm:mb-3 px-4">
                      Waiting Room
                    </h2>
                    <p className="text-slate-500 text-lg px-4">
                      The session hasn't started yet. Please wait for the host.
                    </p>
                  </div>
                )}

                {liveSession && liveSession.isActive && liveSession.currentQuestion === -1 && (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Armchair className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-3 px-4">
                      You're In! 🎉
                    </h2>
                    <p className="text-slate-600 text-lg px-4 max-w-md mx-auto">
                      Sit back and relax. The host will start the first question in a moment.
                    </p>
                    <div className="mt-8 flex justify-center gap-2">
                      <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}

                {liveSession?.isActive && liveSession.currentQuestion >= 0 && liveSession.currentQuestion <= 4 && (
                  <div>
                    <div className="mb-6 text-center">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-700">
                        Question {liveSession.currentQuestion + 1} of 5
                      </h2>
                    </div>

                    {liveSession.timeRemaining > 0 && liveSession.questionStartTime && (
                      <Timer
                        questionStartTime={liveSession.questionStartTime}
                        timerDuration={liveSession.timerDuration}
                      />
                    )}

                    {isTimerExpired && (
                      <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm sm:text-base font-medium">
                          Time's up! Waiting for next question...
                        </p>
                      </div>
                    )}

                    {hasAnswered && !isTimerExpired && (
                      <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 text-green-700">
                        <CheckCircle2 className="w-5 h-6 flex-shrink-0" />
                        <p className="text-sm sm:text-base font-medium">
                          Answer submitted! You can update it until time runs out.
                        </p>
                      </div>
                    )}

                    <div className="min-h-[300px] flex flex-col justify-center">
                      {(() => {
                        const q = getQuestionContent(liveSession.currentQuestion);
                        return (
                          <div>
                            <label className="block mb-6">
                              <span className="text-5xl sm:text-6xl block mb-4 sm:mb-6 text-center">{q.emoji}</span>
                              <span className="text-lg sm:text-xl font-bold text-slate-800 block text-center px-2">
                                {q.text}
                              </span>
                            </label>

                            {q.type === "text" && (
                              <textarea
                                className="w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-base sm:text-lg"
                                rows={5}
                                placeholder="Type your answer here..."
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                disabled={isTimerExpired}
                              />
                            )}

                            {q.type === "mcq" && q.options && (
                              <div className="space-y-3">
                                {q.options.map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setCurrentAnswer(opt)}
                                    disabled={isTimerExpired}
                                    className={`w-full p-4 sm:p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between touch-manipulation ${currentAnswer === opt
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md hover:border-indigo-200 text-slate-600'
                                      } ${isTimerExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <span className="font-semibold text-base sm:text-lg">{opt}</span>
                                    {currentAnswer === opt && <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            )}

                            {!isTimerExpired && (
                              <Button
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim()}
                                className="w-full mt-6"
                              >
                                {hasAnswered ? "Update Answer" : "Submit Answer"} <Send className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* VIEW: ADMIN LOGIN */}
          {view === "admin-login" && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto w-full px-4"
            >
              <Card className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  Admin Dashboard
                </h2>
                <p className="text-slate-500 mb-6 text-sm sm:text-base">
                  Enter the secret passcode to control the live session.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdminLogin((e.target as any).password.value);
                  }}
                >
                  <input
                    name="password"
                    type="password"
                    placeholder="Passcode"
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-base sm:text-lg"
                  />
                  <Button className="w-full" type="submit">Unlock Dashboard</Button>
                </form>
              </Card>
            </motion.div>
          )}

          {/* VIEW: ADMIN DASHBOARD */}
          {view === "admin-dashboard" && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Live Session Control
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1 text-sm sm:text-base">
                    <Users className="w-4 h-4" />
                    {liveSession?.isActive ? "Session Active" : "Session Inactive"}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="secondary"
                    className={`flex-1 md:flex-initial transition-all duration-200 ${resetConfirm ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                    onClick={async () => {
                      if (resetConfirm) {
                        try {
                          await resetGame();
                          setResetConfirm(false);
                        } catch (error) {
                          console.error("Failed to reset game:", error);
                          showError("Failed to reset game.");
                        }
                      } else {
                        setResetConfirm(true);
                        setTimeout(() => setResetConfirm(false), 3000);
                      }
                    }}
                  >
                    {resetConfirm ? "Confirm Reset?" : "Reset Game"}
                  </Button>
                </div>
              </div>

              {/* Session Controls */}
              <Card className="mb-6">
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-4">Session Controls</h3>
                <div className="flex flex-wrap gap-3">
                  {!liveSession?.isActive && (
                    <Button onClick={() => startSession()} className="flex-1 sm:flex-initial">
                      <Play className="w-4 h-4" /> Start Session
                    </Button>
                  )}

                  {liveSession?.isActive && (
                    <>
                      {liveSession.currentQuestion === -1 && (
                        <Button onClick={() => startQuestion({ questionNumber: 0 })} className="flex-1 sm:flex-initial">
                          Start Question 1
                        </Button>
                      )}

                      {liveSession.currentQuestion >= 0 && liveSession.currentQuestion < 4 && (
                        <Button onClick={() => nextQuestion()} className="flex-1 sm:flex-initial">
                          Next Question ({liveSession.currentQuestion + 2})
                        </Button>
                      )}

                      <Button variant="ghost" onClick={() => endSession()} className="flex-1 sm:flex-initial">
                        End Session
                      </Button>
                    </>
                  )}
                </div>

                {liveSession?.isActive && liveSession.currentQuestion >= 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100">
                    <p className="text-sm sm:text-base font-medium text-indigo-900 mb-2">
                      Current Question: {liveSession.currentQuestion + 1} of 5
                    </p>
                    {liveSession.questionStartTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-indigo-700 font-medium">Time Remaining:</span>
                        <div className="scale-50 origin-left -ml-2 -my-4">
                          <Timer
                            questionStartTime={liveSession.questionStartTime}
                            timerDuration={liveSession.timerDuration}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Live Answers */}
              {liveSession && liveSession.currentQuestion !== undefined && liveSession.currentQuestion >= 0 && (
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-800">
                      Live Answers - Question {liveSession.currentQuestion + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showFavoritesOnly}
                          onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Show Favorites Only
                      </label>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-500 mb-4">
                    {liveAnswers?.length || 0} responses received
                  </p>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {liveAnswers
                      ?.filter((a: any) => !showFavoritesOnly || a.isFavorited)
                      .map((answer: any) => (
                        <div
                          key={answer._id}
                          className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border-2 border-slate-200 hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 font-medium text-sm sm:text-base break-words">{answer.answer}</p>
                              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                                User: {answer.userId.slice(0, 6)}... • {new Date(answer.submittedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await toggleFavorite({ answerId: answer._id });
                                  } catch (error) {
                                    console.error("Failed to toggle favorite:", error);
                                    showError("Failed to update favorite status");
                                  }
                                }}
                                className={`p-2 rounded-lg transition-all ${answer.isFavorited
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-red-500'
                                  }`}
                                title={answer.isFavorited ? "Unfavorite" : "Favorite"}
                              >
                                <Heart className={`w-4 h-4 ${answer.isFavorited ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  console.log("Delete clicked for:", answer._id, "Current confirm ID:", deleteConfirmId);
                                  if (deleteConfirmId === answer._id) {
                                    console.log("Executing delete...");
                                    try {
                                      await deleteAnswer({ answerId: answer._id });
                                      console.log("Delete successful");
                                      setDeleteConfirmId(null);
                                    } catch (error) {
                                      console.error("Failed to delete answer:", error);
                                      showError("Failed to delete answer");
                                    }
                                  } else {
                                    console.log("Setting confirm state");
                                    setDeleteConfirmId(answer._id);
                                    setTimeout(() => setDeleteConfirmId(null), 3000);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-all ${deleteConfirmId === answer._id
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'
                                  }`}
                                title={deleteConfirmId === answer._id ? "Confirm Delete" : "Delete answer"}
                              >
                                {deleteConfirmId === answer._id ? <CheckCircle2 className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                              </button>

                            </div>
                          </div>
                        </div>
                      ))}

                    {(!liveAnswers || liveAnswers.length === 0) && (
                      <p className="text-center text-slate-400 py-8 text-sm sm:text-base">
                        No answers yet. Waiting for responses...
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div >
  );
}
