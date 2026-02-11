export type UserInfo = {
    name: string;
    industry: string;
    email: string;
}

export type FormInfo = {
    problemToSolve: string;
}

export type CurrentAnswer = string;

export type Steps = 'problem' | 'name' | 'industry' | 'email' | 'calculating' | 'done'

export type TransitionState = 'idle' | 'thinking' | 'fadingOut' | 'fadingIn'

export type TransitionStep = {
    state: TransitionState;
    duration: number;
  }

  export type AiResponse = {
    teaser: string;
    preview: string;
    pdf:{
      problem_reframe: string;
      why_gifting_works: string;
      strategy_shape: string;
      success_and_next_step: string;
    }
  }