"use client"
import { useEffect, useRef, useState } from 'react';
import { UserInfo, FormInfo, CurrentAnswer, Steps, TransitionState, AiResponse } from './lib/types';
import { useRouter } from 'next/navigation';

import './globals.css';

// ===================================================
// 📈 SCALING
// ===================================================
// This component is built to scale easily.
// To add a new step (e.g. 'phone', 'company'):
//
// 1. TYPES → add the new step to the Steps type:
//    type Steps = 'problem' | 'name' | 'industry' | 'email' | 'calculating' | 'phone' | 'done'
//
// 2. STATE → if it's user data, add it to UserInfo:
//    type UserInfo = { name: string; email: string; phone: string }
//    If it's form/product data, add it to FormInfo:
//    type FormInfo = { problemToSolve: string; company: string }
//
// 3. LABELS → just add a new key to inputLabel:
//    const inputLabel: Record<InputStep, string> = {
//      problem: '...',
//      name: '...',
//      email: '...',
//      phone: 'Can I grab your phone number?',  ← new
//    }
//
// 4. PLACEHOLDERS → same thing:
//    const placeholders: Record<InputStep, string> = {
//      ...
//      phone: 'Enter your phone number...',  ← new
//    }
//
// 5. HANDLE SUBMIT → add a new case to both switches:
//    case 'email':
//      setUserInfo((prev) => ({ ...prev, email: value }));
//      break;
//    case 'phone':                                        ← new
//      setUserInfo((prev) => ({ ...prev, phone: value }));
//      break;
//
//    AND the step change switch:
//    case 'email': setSteps('phone'); break;    ← changed (was 'done')
//    case 'phone': setSteps('done'); break;     ← new
//
// 6. INPUT TYPE → update if needed:
//    steps === 'email' ? 'email' :
//    steps === 'phone' ? 'tel' :     ← new
//    'text'
//
// The transition animation handles itself —
// no changes needed there. It just plays
// between whatever steps exist.
// ===================================================

type TransitionStep = {
  state: TransitionState;
  duration: number;
}

const transitionSequence: TransitionStep[] = [
  { state: 'thinking', duration: 1200 },   // dots show
  { state: 'fadingOut', duration: 300 },    // fades out
  { state: 'fadingIn', duration: 300 },     // fades in
  { state: 'idle', duration: 0 },           // done
];

const stepOrder: Steps[] = [
  'problem',
  'name',
  'industry',
  'email',
  'calculating',
  'done',
];

const inputStepOrder = ['problem', 'name', 'industry', 'email'] as const;
type InputStep = typeof inputStepOrder[number];
const inputSteps = new Set<InputStep>(inputStepOrder);
const isInputStep = (step: Steps): step is InputStep => inputSteps.has(step as InputStep);

export default function Home() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', industry: '', email: '' });
  const [formInfo, setFormInfo] = useState<FormInfo>({ problemToSolve: '' });
  const [steps, setSteps] = useState<Steps>('problem');
  const [currentAnswer, setCurrentAnswer] = useState<CurrentAnswer>('');
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [aiResponse, setAiResponse] = useState<AiResponse>({teaser: '', preview: '', pdf:{
    problem_reframe:'',
    why_gifting_works:'',
    strategy_shape:'',
    success_and_next_step:''}});
  const [emailError, setEmailError] = useState<string>('');

  const timeoutIdsRef = useRef<number[]>([]);
  const router = useRouter();

  const clearTransitionTimers = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  const scheduleTimeout = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutIdsRef.current.push(id);
  };

  useEffect(() => () => clearTransitionTimers(), []);

  // ===================================================
  // ⚡ TRANSITION ENGINE
  // ===================================================
  // Loops through the sequence array and schedules
  // each state change with a stacking delay.
  // totalDelay adds up so each timeout fires
  // at the right time in the sequence.
  // ===================================================
  const transitionDelay = 1200 + 300;

  const getNextStep = (current: Steps) => {
    const idx = stepOrder.indexOf(current);
    return stepOrder[idx + 1] ?? current;
  };

  const runTransition = (sequence: TransitionStep[]) => {
    let totalDelay = 0;
    sequence.forEach((step) => {
      scheduleTimeout(() => {
        setTransitionState(step.state);
      }, totalDelay);
      totalDelay += step.duration;
    });
  };

  // ANSWER PROBLEM VIA ML
  const handleAiGeneration = async (email: string): Promise<AiResponse | null> => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formInfo,
          userInfo: { ...userInfo, email }  // ← use the fresh email value
         }), // ← add userInfo
      });
      const json = await res.json();
      if (!json?.ok) {
        throw new Error(json?.error ?? "Generate failed");
      }
      console.log('TESTING MOCK',json.data)
      const { teaser, preview, pdf } = json.data ?? {};
      if (!teaser || !preview) {
        throw new Error("Generate returned empty data");
      }
      const nextResponse = { teaser, preview, pdf };
      setAiResponse(nextResponse);
      return nextResponse;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const sendEmail = async (email: string, response: AiResponse | null) => {
    const payload = response;
    if (!email || !formInfo.problemToSolve || !payload?.teaser || !payload?.preview) {
      console.log("input information is invalid or undefined");
      return;
    }
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userInfo: { ...userInfo, email },
          formInfo,
          aiResponse: payload,
         }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ===================================================
  // 📤 HANDLE SUBMIT
  // ===================================================
  // 1. Saves the current answer to the right state
  // 2. Clears the input
  // 3. Kicks off the transition animation
  // 4. Changes the step halfway through fadeOut
  //    so the user never sees the old input flash
  // ===================================================
  const handleInputChange = async (value: string) => {
    if (!value.trim()) return;
    clearTransitionTimers();

    if (steps === 'email' && !isValidEmail(value)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setEmailError('');
    

    // THIS IS THE SUBMISSION POINT
    if (steps === 'email') {
      setUserInfo((prev) => ({ ...prev, email: value }));
      setCurrentAnswer('');
      runTransition(transitionSequence);
      scheduleTimeout(() => setSteps('calculating'), transitionDelay);

      const aiData = await handleAiGeneration(value);
      await sendEmail(value, aiData);

      clearTransitionTimers();
      runTransition(transitionSequence);
      scheduleTimeout(() => setSteps('done'), transitionDelay);
      return;
    }

    switch (steps) {
      case 'problem':
        setFormInfo({ problemToSolve: value });
        break;
      case 'name':
        setUserInfo((prev) => ({ ...prev, name: value }));
        break;
      case 'industry':
        setUserInfo((prev) => ({ ...prev, industry: value }));
        break;
    }

    setCurrentAnswer('');
    runTransition(transitionSequence);

    scheduleTimeout(() => {
      setSteps(getNextStep(steps));
    }, transitionDelay);
  }

  const inputLabel: Record<InputStep, string> = {
    problem: "Tell me what you’re trying to solve — I’ll tailor this for you.",
    name: "Got it. Who should I personalize this for?",
    industry: "Which industry are you in? This helps me tune the results.",
    email: "Almost done. Where should I send your custom results?",
  };

  const placeholders: Record<InputStep, string> = {
    problem: 'Describe your problem...',
    name: 'Enter your name...',
    industry: 'What Industry are you in...',
    email: 'Enter your email...',
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value);  

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 w-full bg-[#0d1116]/95 border-b border-gray-700/60">
        <div className="mx-auto w-full px-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/gestureNavLogo.png"              
              alt="Real.AI" 
              className="h-30 w-auto object-contain block"
              />
          </div>
          <div className='w-full flex justify-around px-10'>
            <a
              className="text-md text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Home
            </a>
            <a
              className="text-md text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              About
            </a>
                        <a
              className="text-md text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              About
            </a>
          </div>
          <div className='flex w-1/10'>
            <a
              href="https://calendly.com/adlopez034/30min"
              target="_blank"
              rel="noopener noreferrer"
              className=" flex w-md rounded-lg bg-black px-5 py-5 text-sm font-semibold text-white border border-white/10 hover:border-white/30 hover:bg-white hover:text-black transition-all duration-200 cursor-pointer"
            >
              Book Demo →
            </a>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex items-center justify-center px-4 py-10 mt-10">
        <div className="w-full max-w-xl space-y-6">
          {/* INFO CARD */}
          <div className="rounded-2xl border border-gray-700/50 bg-[#0d1116] p-6">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Real.AI Configurator
            </div>
            <h2 className="text-xl text-white font-semibold mb-3">
              Build a campaign preview in minutes
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Answer a few quick questions and we’ll generate a preview PDF that shows positioning,
              structure, and creative direction — tailored to your problem.
            </p>
            <div className="mt-4 text-xs text-gray-500">
              No credit card required. Results delivered in seconds.
            </div>
          </div>

          {/* INPUT CARD */}
          <div className="relative w-full">
            <div className="absolute inset-0 bg-blue-500 opacity-5 blur-xl rounded-2xl" />

            <div className="relative p-5 rounded-2xl border border-gray-700/50 bg-[#0d1116] min-h-[20px]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                transitionState === 'thinking' ? 'bg-yellow-400' :
                steps === 'done' ? 'bg-green-400' : 'bg-blue-400'
              }`} />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Real.AI Configurator</span>
            </div>

            {/* LABEL + INPUT WRAPPER — handles fade in/out together */}
            {isInputStep(steps) && (
              <div>
                {/* Label — always visible */}
                <label className="block text-gray-200 text-sm mb-3">{inputLabel[steps]}</label>

                {/* Input box */}
                <div className={`flex items-center gap-2 p-1.5 rounded-xl border border-gray-700/50 bg-[#0a0c10] ${
                  transitionState === 'fadingOut' ? 'fade-out' :
                  transitionState === 'fadingIn' ? 'fade-in' : ''
                }`}>
                  {/* DOTS — show only when thinking */}
                  {transitionState === 'thinking' ? (
                    <div className="flex items-center gap-2 pl-3 py-2">
                      <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                  ) : (
                    <input
                      type={steps === 'email' ? 'email' : 'text'}
                      value={currentAnswer}
                      onChange={(e) => {
                        setCurrentAnswer(e.target.value);
                        if (steps === 'email') setEmailError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && currentAnswer.trim()) {
                          if (steps === 'email' && !isValidEmail(currentAnswer)) {
                            setEmailError('Please enter a valid email');
                            return;
                          }
                          handleInputChange(currentAnswer);
                        }
                      }}
                      placeholder={placeholders[steps]}
                      autoFocus
                      className="flex-1 bg-transparent text-white text-sm pl-3 py-2 focus:outline-none placeholder-gray-600"
                    />
                  )}
                  {/* Arrow button — hidden when thinking */}
                  {transitionState !== 'thinking' && (
                    <button
                      onClick={() => handleInputChange(currentAnswer)}
                      disabled={!currentAnswer.trim()}
                      className="group w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </button>
                  )}
                </div>
                {steps === 'email' && emailError && (
                  <div className="mt-2 text-xs text-red-400">{emailError}</div>
                )}
              </div>
            )}
            {steps === 'calculating' && (
              <div className={transitionState === 'fadingIn' ? 'fade-in' : ''}>
                <label className="block text-gray-200 text-sm mb-3">Generating your custom solution…</label>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-700/50 bg-[#0a0c10]">
                  <div className="flex items-center gap-2">
                    <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="dot-animate w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>
                  <span className="text-gray-400 text-sm">This usually takes a few seconds…</span>
                </div>
              </div>
            )}
            {/* DONE */}
            {/* HERE LETS PROVIDE A TASTE OF WHAT THE SOUTION IS SO WE GET THEM TO
                  CHECK OUT THE PDF OR STRAIGHT TO MAKING A CALENDLY MEETING */}
            {steps === 'done' && transitionState !== 'thinking' && (
              <div className={transitionState === 'fadingIn' ? 'fade-in' : ''}>
                {/* Success Badge */}
                <div className='flex items-center gap-2 mb-4'>
                  <div className='w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center'>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className='text-green-400 text-xs font-medium uppercase tracking-wider'>Solution Generated</span>
                </div>

                {/* Main Message */}
                <div className='space-y-3 mb-6'>
                  <p className="text-gray-100 text-base leading-relaxed">
                    Hey <span className='text-white text-lg'>{userInfo.name}!</span>
                  </p>
                  <p className="text-gray-100 text-base leading-relaxed">
                    {aiResponse.teaser}
                  </p>
                  <p className="text-gray-400 text-sm">
                    📧 Check <span className='text-blue-400'>{userInfo.email}</span> for the full breakdown and more.
                  </p>
                </div>
                
                {/* Divider */}
                <div className='w-full h-px bg-linear-to-r from-transparent via-gray-700 to-transparent mb-6' />

                {/* CTA Section */}
                <div className='p-4 rounded-xl bg-[#0a0c10] border border-gray-700/50'>
                  <p className='text-gray-300 text-sm mb-3'>
                    Want a deeper dive? Schedule a call with our team to explore implementation strategies.
                  </p>
                  <a
                      href="https://calendly.com/adlopez034/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="button"
                      aria-label="Schedule a meeting"
                      className="
                        w-full
                        inline-flex
                        items-center
                        justify-center
                        group
                        relative
                        overflow-hidden
                        px-5
                        py-2.5
                        rounded-lg
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        hover:from-blue-500
                        hover:to-blue-400
                        transition-all
                        duration-200
                        shadow-lg
                        shadow-blue-500/20
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-400
                        focus:ring-offset-2
                        focus:ring-offset-[#0a0c10]
                      "
                    >
                      <span className="relative z-10 text-white text-sm font-medium flex items-center gap-2">
                        Schedule a Meeting
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </a>

                </div>
                <button
                  onClick={() => {
                    setFormInfo({ problemToSolve: '' });
                    setUserInfo({ name: '', industry: '', email: '' });
                    setAiResponse({ teaser: '', preview: '', pdf:{
                      problem_reframe:'',
                      why_gifting_works:'',
                      strategy_shape:'',
                      success_and_next_step:'',
                    }})
                    setSteps('problem');
                  }}
                  className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200 underline underline-offset-4 cursor-pointer"
                >
                  Have Another Problem?
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
     
    </div>
);
}
