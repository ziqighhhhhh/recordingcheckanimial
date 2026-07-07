export interface WordAssessment {
  word: string;
  status: "good" | "struggled" | "omitted";
}

export interface ProblemWord {
  word: string;
  ipa: string;
  explanation: string;
}

export interface AssessmentResult {
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  wordAssessments: WordAssessment[];
  problemWords: ProblemWord[];
  coachFeedback: string;
}

export interface PracticeText {
  title: string;
  text: string;
  trickyWords: {
    word: string;
    reason: string;
  }[];
}

export type PracticeTopic = "Daily Life" | "Travel" | "Business" | "Restaurant" | "Self-Introduction" | "Custom";

export interface HistoryItem {
  id: string;
  timestamp: string;
  referenceText: string;
  transcribedText: string;
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
}
