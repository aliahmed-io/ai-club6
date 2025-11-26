"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  BarChart,
  Lock,
  CheckCircle2,
  TrendingUp,
  Download,
  Users,
  Sparkles,
  Armchair,
  ChevronRight,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { SimpleBarChart, DonutChart } from "./components/ui/Charts";
import { Filter } from "bad-words";

export default function App() {
  const [view, setView] = useState<"loading" | "start" | "survey" | "success" | "admin-login" | "admin-dashboard">("loading");
  const [isAdmin, setIsAdmin] = useState(false);

  // Survey State
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex Mutations & Queries
  const submitSurvey = useMutation(api.surveys.submit);
  const clearAll = useMutation(api.surveys.clearAll);
  const stats = useQuery(api.surveys.getStats);
  const recentResponses = useQuery(api.surveys.getRecent);

  // Check local storage for previous submission and draft
  useEffect(() => {
    const hasSubmitted = localStorage.getItem("survey_submitted_v2");
    if (hasSubmitted) {
      setView("success");
    } else {
      setView("start");

      // Load draft if exists
      const savedAnswers = localStorage.getItem("survey_answers_draft_v2");
      const savedStep = localStorage.getItem("survey_step_draft_v2");

      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (e) {
          console.error("Failed to parse saved answers", e);
        }
      }
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    if (!isSubmitting && view === 'survey') {
      localStorage.setItem("survey_answers_draft_v2", JSON.stringify(answers));
      localStorage.setItem("survey_step_draft_v2", currentStep.toString());
    }
  }, [answers, currentStep, isSubmitting, view]);

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error on typing
  };

  const validateStep = async (step: number) => {
    const { Filter } = await import("bad-words");
    // @ts-ignore
    const ArabicFilter = (await import("bad-word-ar")).default || (await import("bad-word-ar"));

    const filter = new Filter();
    // @ts-ignore
    const arFilter = new ArabicFilter("ar");

    let textToCheck = "";
    if (step === 0) textToCheck = answers.q1;
    if (step === 1) textToCheck = answers.q2;

    if (textToCheck) {
      const isEnglishProfane = filter.isProfane(textToCheck);
      // @ts-ignore
      const isArabicProfane = arFilter.check(textToCheck);

      if (isEnglishProfane || isArabicProfane) {
        setError("Please keep it clean! 🧼 We detected some language that might be inappropriate.");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleSubmit = async () => {
    // Final check
    const isValid = await validateStep(currentStep); // Check last step or re-check all if needed
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Generate a random user ID for now since we removed auth
      const userId = Math.random().toString(36).substring(7);
      await submitSurvey({ ...answers, userId });

      localStorage.setItem("survey_submitted_v2", "true");
      // Clear draft
      localStorage.removeItem("survey_answers_draft_v2");
      localStorage.removeItem("survey_step_draft_v2");

      setView("success");
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = (password: string) => {
    if (password === "EFFAT-AI-ADMIN") {
      setIsAdmin(true);
      setView("admin-dashboard");
    } else {
      alert("Incorrect password");
    }
  };

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-50 to-sky-100 font-sans text-slate-800 overflow-x-hidden transition-all duration-500">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto backdrop-blur-md bg-white/30 px-4 py-2 rounded-full border border-white/40 shadow-sm">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-700">GPT Habits</span>
        </div>
        <div className="pointer-events-auto">
          {/* Only show Admin Access on Start Page */}
          {view === "start" && (
            <button
              onClick={() => setView("admin-login")}
              className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors px-4 py-2"
            >
              Admin Access
            </button>
          )}
          {(isAdmin || view === "admin-login") && (
            <button
              onClick={() => {
                setIsAdmin(false);
                setView("start");
              }}
              className="text-xs font-medium text-indigo-600 bg-white/50 px-3 py-1 rounded-lg border border-indigo-200 hover:bg-white"
            >
              Back to Start
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* VIEW: START PAGE */}
          {view === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full text-center"
            >
              <div className="mb-12">
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md">
                  <span className="text-6xl">🤖</span>
                </div>
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 leading-tight">
                  The ChatGPT<br />Habits Survey
                </h1>
                <p className="text-xl text-slate-600 max-w-md mx-auto">
                  Discover how you compare to others in your AI usage. Anonymous. Quick. Fun.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setView("survey")}
                  className="w-full py-6 text-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 transition-all duration-300"
                >
                  Start Survey <Play className="w-5 h-5 fill-current" />
                </Button>
                <p className="text-sm text-slate-400">Takes less than 1 minute</p>
              </div>
            </motion.div>
          )}

          {view === "survey" && (
            <motion.div
              key="survey"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-700">
                  Question {currentStep + 1} of 5
                </h2>
              </div>

              <Card>
                {/* Error Popup */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600"
                    >
                      <div className="p-2 bg-red-100 rounded-full">
                        <span className="text-xl">🚫</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Hold up!</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                  <motion.div
                    className="bg-indigo-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Questions */}
                <div className="min-h-[300px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                      <motion.div
                        key="q1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="block mb-4">
                          <span className="text-5xl block mb-4">🤖</span>
                          <span className="text-xl font-bold text-slate-800">
                            What's the last thing you asked ChatGPT?
                          </span>
                        </label>
                        <textarea
                          className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-lg"
                          rows={4}
                          placeholder="e.g., How to center a div..."
                          value={answers.q1}
                          onChange={(e) =>
                            handleInputChange("q1", e.target.value)
                          }
                          autoFocus
                        />
                      </motion.div>
                    )}
                    {currentStep === 1 && (
                      <motion.div
                        key="q2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="block mb-4">
                          <span className="text-5xl block mb-4">😤</span>
                          <span className="text-xl font-bold text-slate-800">
                            What's the most annoying thing about ChatGPT?
                          </span>
                        </label>
                        <textarea
                          className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-lg"
                          rows={4}
                          placeholder="e.g., When it says 'As an AI language model'..."
                          value={answers.q2}
                          onChange={(e) =>
                            handleInputChange("q2", e.target.value)
                          }
                          autoFocus
                        />
                      </motion.div>
                    )}
                    {currentStep === 2 && (
                      <motion.div
                        key="q3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="block mb-6">
                          <span className="text-5xl block mb-4">🛋️</span>
                          <span className="text-xl font-bold text-slate-800">Do you feel like ChatGPT is your therapist sometimes?</span>
                        </label>
                        <div className="space-y-3">
                          {['Yes', 'No', 'Sometimes'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleInputChange('q3', opt)}
                              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between group ${answers.q3 === opt
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-md text-slate-600'
                                }`}
                            >
                              <span className="font-semibold text-lg">{opt}</span>
                              {answers.q3 === opt && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {currentStep === 3 && (
                      <motion.div
                        key="q4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="block mb-6">
                          <span className="text-5xl block mb-4">📅</span>
                          <span className="text-xl font-bold text-slate-800">How many times a day do you use ChatGPT?</span>
                          <span className="block text-sm text-slate-400 mt-1 font-normal">Be honest... 👀</span>
                        </label>
                        <div className="space-y-3">
                          {['1-3 times', '4-7 times', '8-15 times', '16-30 times', '30+ times'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleInputChange('q4', opt)}
                              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between ${answers.q4 === opt
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-md text-slate-600'
                                }`}
                            >
                              <span className="font-semibold text-lg">{opt}</span>
                              {answers.q4 === opt && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {currentStep === 4 && (
                      <motion.div
                        key="q5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="block mb-6">
                          <span className="text-5xl block mb-4">🤫</span>
                          <span className="text-xl font-bold text-slate-800">If ChatGPT was a person, would you trust it with your secrets?</span>
                        </label>
                        <div className="space-y-3">
                          {['Yes', 'No', 'Depends'].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleInputChange('q5', opt)}
                              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between ${answers.q5 === opt
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-md text-slate-600'
                                }`}
                            >
                              <span className="font-semibold text-lg">{opt}</span>
                              {answers.q5 === opt && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                  >
                    Back
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={
                        (currentStep === 0 && !answers.q1) ||
                        (currentStep === 1 && !answers.q2) ||
                        (currentStep === 2 && !answers.q3) ||
                        (currentStep === 3 && !answers.q4)
                      }
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!answers.q5 || isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Answers 🚀"}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {view === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Thanks for participating!
              </h2>
              <p className="text-lg text-slate-500 max-w-md mx-auto mb-8">
                Your answers have been anonymously recorded.
              </p>

              <div className="mt-8">
                <Button variant="ghost" onClick={() => setView("start")}>
                  Back to Home
                </Button>
              </div>
            </motion.div>
          )}

          {view === "admin-login" && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto w-full"
            >
              <Card className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Admin Dashboard
                </h2>
                <p className="text-slate-500 mb-6">
                  Enter the secret passcode to view stats.
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
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                  <Button className="w-full" type="submit">Unlock Dashboard</Button>
                </form>
              </Card>
            </motion.div>
          )}

          {view === "admin-dashboard" && stats && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    Survey Results
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4" /> {stats.total} Total Responses
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete ALL responses? This cannot be undone.")) {
                        if (confirm("Really? All data will be lost forever.")) {
                          await clearAll();
                          alert("All data cleared.");
                        }
                      }
                    }}
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                {/* Q3 Pie */}
                <Card>
                  <div className="flex items-center gap-2 mb-6">
                    <Armchair className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-700">
                      Therapist Vibes?
                    </h3>
                  </div>
                  <DonutChart data={stats.q3Data} />
                </Card>

                {/* Q5 Pie */}
                <Card>
                  <div className="flex items-center gap-2 mb-6">
                    <Lock className="w-5 h-5 text-pink-500" />
                    <h3 className="font-semibold text-slate-700">
                      Trust with Secrets?
                    </h3>
                  </div>
                  <DonutChart data={stats.q5Data} />
                </Card>

                {/* Q4 Bar */}
                <Card>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-700">
                      Usage Frequency
                    </h3>
                  </div>
                  <SimpleBarChart data={stats.q4Data} />
                </Card>

                {/* Total Submissions Card */}
                <Card className="flex flex-col items-center justify-center text-center py-10">
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-4xl">💖</span>
                  </div>
                  <h3 className="text-5xl font-black text-slate-800 mb-2">
                    {stats.total}
                  </h3>
                  <p className="text-xl font-bold text-slate-700 mb-1">
                    Amazing Humans!
                  </p>
                  <p className="text-slate-500">
                    Thank you all for sharing your habits! ✨
                  </p>
                </Card>
              </div>

              {/* Leaderboard / Responses List */}
              <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden flex flex-col max-h-[600px]">
                <div className="p-6 border-b border-white/40 bg-white/40 backdrop-blur-md sticky top-0 z-10">
                  <h3 className="font-bold text-lg text-slate-800">
                    Recent Responses
                  </h3>
                </div>

                <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {recentResponses?.map((response: any) => (
                    <div
                      key={response._id}
                      className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Text Answers */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">
                              Last Asked
                            </p>
                            <p className="text-slate-700 italic">
                              "{response.q1}"
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-pink-500 uppercase tracking-wide mb-1">
                              Most Annoying
                            </p>
                            <p className="text-slate-700">"{response.q2}"</p>
                          </div>
                        </div>

                        {/* Choice Tags */}
                        <div className="flex flex-wrap content-start gap-2 md:justify-end">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium border border-indigo-100">
                            🛋️ {response.q3}
                          </span>
                          <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-sm font-medium border border-sky-100">
                            📅 {response.q4}
                          </span>
                          <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium border border-purple-100">
                            🤫 {response.q5}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-right text-xs text-slate-400">
                        ID: {response._id.slice(0, 8)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(0, 0, 0, 0.1);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(0, 0, 0, 0.2);
                }
              `}</style>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
