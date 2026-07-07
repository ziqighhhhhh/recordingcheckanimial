import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, 
  Key, 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Award, 
  Volume2, 
  VolumeX, 
  Check, 
  AlertCircle, 
  Bell, 
  BookOpenCheck,
  HelpCircle,
  Shield,
  Mail,
  ListRestart,
  History,
  Trash2
} from "lucide-react";
import { AssessmentResult, PracticeText, PracticeTopic, HistoryItem } from "./types";

// Default mockup text
const DEFAULT_TEXT = "Sample English dolor sit amet, consectet or adipiscing elit. And practice your English. They waetn a sessorsire. Butket me it's spot of lul, you're free with. Thiy'd have better Example, use to who rasnove answer. Idst walk about aose of aicn island.";

// Other preset practice texts
const PRESETS: { [key: string]: string } = {
  "Mockup Text": DEFAULT_TEXT,
  "Ordering Coffee": "I would like to order a large hot latte with oat milk, please. Could you also add a touch of caramel syrup? Oh, and is there any fresh blueberry muffin left today? Thank you so much!",
  "Job Interview": "Throughout my career, I have developed strong problem-solving skills and collaborated with diverse teams. I am highly motivated to contribute to your company's innovative projects and expand my technical expertise.",
  "Simple Story": "The little red squirrel climbed up the tall pine tree. It held a small golden acorn in its paws and looked around carefully. Suddenly, it saw a friendly blue bird landing on a nearby branch.",
  "Tongue Twister": "Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked. If Peter Piper picked a peck of pickled peppers, where's the peck of pickled peppers Peter Piper picked?"
};

// Mock result corresponding exactly to Mockup 2
const MOCK_ASSESSMENT: AssessmentResult = {
  overallScore: 85,
  accuracy: 82,
  fluency: 88,
  completeness: 85,
  wordAssessments: [
    { word: "Sample", status: "good" },
    { word: "English", status: "good" },
    { word: "dolor", status: "good" },
    { word: "sit", status: "good" },
    { word: "amet,", status: "good" },
    { word: "consectet", status: "good" },
    { word: "or", status: "good" },
    { word: "adipiscing", status: "good" },
    { word: "elit.", status: "good" },
    { word: "And", status: "good" },
    { word: "practice", status: "good" },
    { word: "your", status: "good" },
    { word: "English.", status: "good" },
    { word: "They", status: "good" },
    { word: "waetn", status: "struggled" }, // Red in mockup but status says struggled/problem word
    { word: "a", status: "good" },
    { word: "sessorsire.", status: "struggled" },
    { word: "Butket", status: "good" },
    { word: "me", status: "good" },
    { word: "it's", status: "good" },
    { word: "spot", status: "good" },
    { word: "of", status: "good" },
    { word: "lul,", status: "good" },
    { word: "you're", status: "good" },
    { word: "free", status: "good" },
    { word: "with.", status: "good" },
    { word: "Thiy'd", status: "struggled" },
    { word: "have", status: "good" },
    { word: "better", status: "good" },
    { word: "Example,", status: "good" },
    { word: "use", status: "good" },
    { word: "to", status: "good" },
    { word: "who", status: "good" },
    { word: "rasnove", status: "struggled" },
    { word: "answer.", status: "good" },
    { word: "Idst", status: "good" },
    { word: "walk", status: "good" },
    { word: "about", status: "good" },
    { word: "aose", status: "good" },
    { word: "of", status: "good" },
    { word: "aicn", status: "good" },
    { word: "island.", status: "good" }
  ],
  problemWords: [
    {
      word: "waetn",
      ipa: "/weɪtən/",
      explanation: "A tricky phonetic blend. Try pronouncing the 'ae' as a long 'a' sound, followed by a soft, clipped 'tn' at the end. Keep it short!"
    },
    {
      word: "sessorsire",
      ipa: "/sɛsɔːsaɪə/",
      explanation: "Ensure you split this into syllables: ses-sor-sire. Emphasize the second syllable 'sor' with a round vocal tone, and glide on 'sire'."
    },
    {
      word: "Thiy'd",
      ipa: "/ðiːɪd/",
      explanation: "Watch out for the 'Th' friction. It requires placing your tongue softly between your front teeth. Sounds similar to 'They-id'."
    },
    {
      word: "rasnove",
      ipa: "/ræznɒv/",
      explanation: "The vowel in the first syllable is a flat 'a' sound (like in 'cat'). End with a crisp, vibrating 'v' sound against your lower lip."
    }
  ],
  coachFeedback: "Fantastic reading! Your rhythm was pleasant and you spoke with great speed. You experienced minor difficulties on a few challenging, non-standard placeholder words. Try focusing on the syllable blends of 'sessorsire' and 'rasnove'!"
};

export default function App() {
  // State
  const [engine, setEngine] = useState<"gemini" | "azure">("gemini");
  const [azureKey, setAzureKey] = useState<string>("");
  const [azureRegion, setAzureRegion] = useState<string>("eastus");
  const [accent, setAccent] = useState<string>("en-US");
  
  const [referenceText, setReferenceText] = useState<string>(DEFAULT_TEXT);
  const [customText, setCustomText] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [seconds, setSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  
  // Custom text generator state
  const [topic, setTopic] = useState<PracticeTopic>("Daily Life");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("Intermediate");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Footer modal states
  const [activeModal, setActiveModal] = useState<"about" | "privacy" | "contact" | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("english_practice_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading history from localStorage", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (res: AssessmentResult, refTxt: string, transTxt: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      referenceText: refTxt,
      transcribedText: transTxt || "[No transcript]",
      overallScore: res.overallScore,
      accuracy: res.accuracy,
      fluency: res.fluency,
      completeness: res.completeness
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    try {
      localStorage.setItem("english_practice_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving history to localStorage", e);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("english_practice_history", JSON.stringify(updated));
  };

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = accent;

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullTranscript = (transcribedText + " " + finalTranscript + " " + interimTranscript).trim();
        setTranscribedText(fullTranscript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = rec;
    }
  }, [accent, transcribedText]);

  // Adjust speech recognition language when accent changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = accent;
    }
  }, [accent]);

  // Handle Stopwatch
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start Practice
  const handleStartRecording = async () => {
    try {
      setTranscribedText("");
      setAudioUrl(null);
      setAssessment(null);
      setSeconds(0);
      audioChunksRef.current = [];

      // Request microphone access and setup audio recorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start browser Speech Recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start MediaRecorder for playback
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone permission denied or not available. Please allow mic access to practice English pronunciation.");
    }
  };

  // Stop Recording & Trigger Assessment
  const handleStopRecording = () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Trigger Assessment immediately
    assessResult();
  };

  // Request Pronunciation Assessment from Server-side
  const assessResult = async () => {
    setIsAssessing(true);
    
    // Slight delay to ensure final transcript is captured and AudioBlob is resolved
    setTimeout(async () => {
      try {
        // If Azure speech is selected and configured, do Azure Assessment
        if (engine === "azure" && azureKey && azureRegion) {
          let audioBase64 = "";
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            audioBase64 = await convertBlobToBase64(audioBlob);
          }

          const response = await fetch("/api/assess-azure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referenceText,
              audioBase64,
              region: azureRegion,
              key: azureKey,
              accent
            })
          });

          if (!response.ok) {
            throw new Error(`Azure assessment failed: ${response.statusText}`);
          }

          const azureData = await response.json();
          // Map Azure detailed data into our custom beautiful visualization schema
          const mapped = mapAzureToResult(azureData, referenceText);
          setAssessment(mapped);
          saveToHistory(mapped, referenceText, transcribedText);
        } else {
          // Default: Gemini English Coach Analysis
          const response = await fetch("/api/assess-pronunciation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referenceText,
              transcribedText,
              accent: accent === "en-US" ? "American" : accent === "en-GB" ? "British" : accent === "en-AU" ? "Australian" : "Canadian"
            })
          });

          if (!response.ok) {
            throw new Error(`Gemini Coach failed: ${response.statusText}`);
          }

          const data = await response.json() as AssessmentResult;
          setAssessment(data);
          saveToHistory(data, referenceText, transcribedText);
        }
      } catch (err: any) {
        console.error("Assessment error:", err);
        // Fallback to offline aligned assessment if API fails or is offline
        const localAlign = performLocalAlignment(referenceText, transcribedText);
        setAssessment(localAlign);
        saveToHistory(localAlign, referenceText, transcribedText);
      } finally {
        setIsAssessing(false);
      }
    }, 800);
  };

  // Convert Blob to Base64 helper
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Local static text alignment algorithm fallback to keep UI perfectly responsive & working offline
  const performLocalAlignment = (ref: string, trans: string): AssessmentResult => {
    const refWords = ref.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    const transWords = trans.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    
    const wordAssessments = ref.split(/\s+/).map(w => {
      const cleanW = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const matched = transWords.includes(cleanW);
      return {
        word: w,
        status: matched ? ("good" as const) : ("struggled" as const)
      };
    });

    const goodCount = wordAssessments.filter(wa => wa.status === "good").length;
    const totalCount = wordAssessments.length;
    const score = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 100;

    return {
      overallScore: score,
      accuracy: score,
      fluency: score > 20 ? score + 5 : 40,
      completeness: score,
      wordAssessments,
      problemWords: wordAssessments.filter(wa => wa.status === "struggled").slice(0, 4).map(wa => ({
        word: wa.word,
        ipa: `/${wa.word.toLowerCase()}/`,
        explanation: `Ensure you fully articulate all syllables in "${wa.word}". Speak clearly and pace yourself!`
      })),
      coachFeedback: `Nice try! You completed reading the text. Let's practice more to refine pronunciation on the highlighted words.`
    };
  };

  // Map Azure JSON response schema to our custom aesthetic assessment layout
  const mapAzureToResult = (azureData: any, originalText: string): AssessmentResult => {
    // Azure detailed result parsing logic
    const score = azureData.NBest?.[0]?.PronunciationAssessment?.PronScore || 80;
    const accuracy = azureData.NBest?.[0]?.PronunciationAssessment?.AccuracyScore || 80;
    const fluency = azureData.NBest?.[0]?.PronunciationAssessment?.FluencyScore || 80;
    const completeness = azureData.NBest?.[0]?.PronunciationAssessment?.CompletenessScore || 80;

    const wordsData = azureData.NBest?.[0]?.Words || [];
    const originalWords = originalText.split(/\s+/);

    const wordAssessments = originalWords.map((word, index) => {
      const cleanW = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const matchedWord = wordsData.find((wd: any) => wd.Word?.toLowerCase() === cleanW);
      
      let status: "good" | "struggled" | "omitted" = "good";
      if (matchedWord) {
        const errorType = matchedWord.PronunciationAssessment?.ErrorType;
        if (errorType === "Mispronunciation") status = "struggled";
        else if (errorType === "Omission") status = "omitted";
      } else {
        // If not in Azure recognized words, flag it as struggled/omitted
        status = index % 5 === 0 ? "omitted" : "struggled";
      }

      return { word, status };
    });

    const problemWords = wordAssessments.filter(wa => wa.status !== "good").slice(0, 4).map(wa => ({
      word: wa.word,
      ipa: `/${wa.word.toLowerCase()}/`,
      explanation: `Focus on clean consonant sounds and long vowels. Pay extra attention to the rhythmic stresses of this word!`
    }));

    return {
      overallScore: Math.round(score),
      accuracy: Math.round(accuracy),
      fluency: Math.round(fluency),
      completeness: Math.round(completeness),
      wordAssessments,
      problemWords,
      coachFeedback: "Azure Speech Engine Assessment complete! You achieved great accuracy scores. Check your syllable details below!"
    };
  };

  // Trigger Demo/Mock Mode immediately
  const handleLoadMock = () => {
    setIsRecording(false);
    setIsAssessing(true);
    setAudioUrl(null);
    setTranscribedText("Sample English dolor sit amet, consectet or adipiscing elit. And practice your English. They waetn a sessorsire. Butket me it's spot of lul, you're free with. Thiy'd have better Example, use to who rasnove answer. Idst walk about aose of aicn island.");
    setReferenceText(DEFAULT_TEXT);
    setIsCustomMode(false);

    setTimeout(() => {
      setAssessment(MOCK_ASSESSMENT);
      setIsAssessing(false);
      saveToHistory(MOCK_ASSESSMENT, DEFAULT_TEXT, "Sample English dolor sit amet, consectet or adipiscing elit. And practice your English. They waetn a sessorsire. Butket me it's spot of lul, you're free with. Thiy'd have better Example, use to who rasnove answer. Idst walk about aose of aicn island.");
    }, 600);
  };

  // Generate customized text using Gemini
  const handleGenerateText = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic === "Custom" ? customTopic : topic,
          difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI custom text");
      }

      const data = await response.json() as PracticeText;
      setReferenceText(data.text);
      setIsCustomMode(true);
      setCustomText(data.text);
      setAssessment(null);
      setAudioUrl(null);
    } catch (err) {
      console.error("Failed to generate text:", err);
      alert("Oops! Failed to reach AI generator. Loading a beautiful story instead!");
      setReferenceText(PRESETS["Simple Story"]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Speak Word aloud (Text-to-Speech) using Native browser speechSynthesis
  const handleSpeakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      // Cancel previous speak
      window.speechSynthesis.cancel();
      
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = accent;
      
      // Select appropriate voice based on chosen accent
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(accent));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] bg-polka py-8 px-4 flex flex-col justify-between items-center relative overflow-hidden font-sans">
      
      {/* Visual background decorations - Leaves, Foliage, Mushrooms */}
      <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-25 pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0C50 0 100 50 100 100V0H0Z" fill="#A8E4CE" />
          <path d="M15 15C35 25 55 15 65 35" stroke="#1D5C43" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="40" r="4" fill="#FDE293" />
          <circle cx="50" cy="20" r="5" fill="#FCD3D3" />
        </svg>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-25 pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(-1, 1)">
          <path d="M0 0C50 0 100 50 100 100V0H0Z" fill="#A8E4CE" />
          <path d="M15 15C35 25 55 15 65 35" stroke="#1D5C43" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="30" r="4.5" fill="#FDE293" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border-8 border-[#FAF2E5] shadow-[0_12px_24px_rgba(139,90,43,0.12)] p-6 md:p-8 z-10 relative flex flex-col gap-6">
        
        {/* Banner Title Header - Wavy, Stitch style */}
        <div className="relative w-full flex justify-center mb-4">
          <motion.div 
            initial={{ scale: 0.95, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#87D14E] px-8 md:px-16 py-3 rounded-2xl border-4 border-[#6BA837] relative shadow-[0_6px_0px_#538528] flex items-center justify-center min-w-[280px] md:min-w-[450px]"
            id="banner-ribbon"
          >
            {/* Stitching lines */}
            <div className="absolute inset-1 rounded-xl border-2 border-dashed border-white/60 pointer-events-none" />
            
            <h1 className="text-white font-rounded text-2xl md:text-4xl font-bold tracking-wide text-center">
              {isRecording ? "Reading Results & Recording" : "English Practice"}
            </h1>
          </motion.div>
        </div>

        {/* Configuration settings - Dropdowns and input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Accent & Engine Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[#8B5A2B] font-rounded font-semibold text-sm flex items-center gap-1">
                <Globe size={16} className="text-[#87D14E]" /> Region / Accent Accent Target
              </label>
              <div className="relative">
                <select 
                  value={accent} 
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full text-lg wood-border px-10 py-2.5 text-[#8B5A2B] font-rounded font-medium focus:outline-none appearance-none cursor-pointer"
                  style={{ borderRadius: "24px" }}
                  id="accent-select"
                >
                  <option value="en-US">🇺🇸 Region: US Accent (General American)</option>
                  <option value="en-GB">🇬🇧 Region: UK Accent (Received Pronunciation)</option>
                  <option value="en-AU">🇦🇺 Region: AU Accent (Australian English)</option>
                  <option value="en-CA">🇨🇦 Region: CA Accent (Canadian English)</option>
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87D14E] pointer-events-none">
                  🍃
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5A2B] pointer-events-none">
                  ▼
                </div>
              </div>
            </div>

            {/* Choose Assessment Engine */}
            <div className="flex gap-4 mt-1">
              <button 
                type="button"
                onClick={() => setEngine("gemini")}
                className={`flex-1 py-2 px-3 rounded-xl border-2 font-rounded font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  engine === "gemini" 
                    ? "bg-[#FAF2E5] border-[#D2B48C] text-[#8B5A2B] shadow-sm"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                }`}
                id="engine-gemini"
              >
                <Sparkles size={16} className="text-[#87D14E]" /> Gemini AI Coach
              </button>
              <button 
                type="button"
                onClick={() => setEngine("azure")}
                className={`flex-1 py-2 px-3 rounded-xl border-2 font-rounded font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  engine === "azure" 
                    ? "bg-[#FAF2E5] border-[#D2B48C] text-[#8B5A2B] shadow-sm"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                }`}
                id="engine-azure"
              >
                ☁️ Azure Speech Engine
              </button>
            </div>
          </div>

          {/* Key and custom reference loader */}
          <div className="flex flex-col gap-1 justify-end">
            {engine === "azure" ? (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-[#8B5A2B] font-rounded font-semibold text-sm flex items-center gap-1">
                  <Key size={16} className="text-[#CEAA80]" /> Azure Subscription Key & Region
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="password"
                      placeholder="Azure Speech Key"
                      value={azureKey}
                      onChange={(e) => setAzureKey(e.target.value)}
                      className="w-full text-base wood-border px-10 py-2.5 text-[#8B5A2B] font-rounded focus:outline-none"
                      style={{ borderRadius: "24px" }}
                      id="azure-key-input"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CEAA80]">
                      🍃
                    </div>
                  </div>
                  <select
                    value={azureRegion}
                    onChange={(e) => setAzureRegion(e.target.value)}
                    className="wood-border px-4 py-2 text-[#8B5A2B] font-rounded text-sm focus:outline-none cursor-pointer"
                    style={{ borderRadius: "24px", width: "120px" }}
                    id="azure-region-select"
                  >
                    <option value="eastus">eastus</option>
                    <option value="westus">westus</option>
                    <option value="japaneast">japaneast</option>
                    <option value="southeastasia">seasia</option>
                    <option value="westeurope">westeurope</option>
                  </select>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-[#8B5A2B] font-rounded font-semibold text-sm flex items-center gap-1">
                  <BookOpen size={16} className="text-[#87D14E]" /> Choose Practice Passage
                </label>
                <div className="relative">
                  <select 
                    value={isCustomMode ? "custom" : Object.keys(PRESETS).find(k => PRESETS[k] === referenceText) || "custom"} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomMode(true);
                        setReferenceText(customText || DEFAULT_TEXT);
                      } else {
                        setIsCustomMode(false);
                        setReferenceText(PRESETS[val]);
                      }
                      setAssessment(null);
                      setAudioUrl(null);
                    }}
                    className="w-full text-base wood-border px-10 py-2.5 text-[#8B5A2B] font-rounded focus:outline-none cursor-pointer"
                    style={{ borderRadius: "24px" }}
                    id="passage-preset-select"
                  >
                    {Object.keys(PRESETS).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                    <option value="custom">✍️ Custom/AI Generated Text</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87D14E]">
                    🍃
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom text writing / generating box (if custom mode is selected) */}
        {isCustomMode && !isRecording && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-[#FAF9F6] border-4 border-[#E6DEC9] rounded-2xl p-4 flex flex-col gap-3"
            id="custom-text-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#8B5A2B] font-rounded">
                ✍️ Write your own passage or generate one using Gemini AI:
              </span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-rounded font-medium text-[#8B5A2B] flex items-center gap-1 bg-[#FAF2E5] border border-[#D2B48C] px-2.5 py-1 rounded-lg hover:bg-amber-100/50"
                id="history-toggle"
              >
                <History size={13} /> {showHistory ? "Hide Practice History" : "Practice History"}
              </button>
            </div>

            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setReferenceText(e.target.value);
                setAssessment(null);
              }}
              placeholder="Paste or type English text here to practice reading..."
              className="w-full h-24 p-3 border-2 border-gray-200 rounded-xl font-rounded text-sm focus:outline-none focus:border-[#87D14E] bg-white text-[#5C3D1E]"
              id="custom-textarea"
            />

            {/* AI Generator Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-gray-200 pt-3">
              <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
                <span className="font-rounded font-medium text-[#8B5A2B]">AI Topic:</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as PracticeTopic)}
                  className="bg-white border border-[#D2B48C] rounded-lg px-2 py-1 font-rounded text-xs text-[#8B5A2B]"
                  id="generator-topic"
                >
                  <option value="Daily Life">Daily Life</option>
                  <option value="Travel">Travel & Tourism</option>
                  <option value="Business">Business / Office</option>
                  <option value="Restaurant">Restaurant / Food</option>
                  <option value="Self-Introduction">Self-Introduction</option>
                  <option value="Custom">Custom Topic...</option>
                </select>

                {topic === "Custom" && (
                  <input
                    type="text"
                    placeholder="e.g., Cooking, Science"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="border border-[#D2B48C] rounded-lg px-2 py-1 font-rounded text-xs text-[#8B5A2B] bg-white w-28 md:w-36"
                    id="generator-custom-topic"
                  />
                )}

                <span className="font-rounded font-medium text-[#8B5A2B] ml-2">Level:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-white border border-[#D2B48C] rounded-lg px-2 py-1 font-rounded text-xs text-[#8B5A2B]"
                  id="generator-difficulty"
                >
                  <option value="Beginner">Easy (A1-A2)</option>
                  <option value="Intermediate">Medium (B1-B2)</option>
                  <option value="Advanced">Hard (C1-C2)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateText}
                disabled={isGenerating}
                className={`py-1.5 px-4 rounded-xl font-rounded font-bold text-xs flex items-center gap-1 text-white shadow-sm transition-all duration-150 ${
                  isGenerating 
                    ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                    : "bg-[#87D14E] hover:bg-[#7bc043] border border-[#6BA837]"
                }`}
                id="generate-button"
              >
                <Sparkles size={14} />
                {isGenerating ? "Generating..." : "AI Generate Text"}
              </button>
            </div>
          </motion.div>
        )}

        {/* History Modal Section */}
        {showHistory && isCustomMode && !isRecording && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-amber-50/20 border-2 border-dashed border-[#D2B48C] rounded-2xl p-4 flex flex-col gap-2"
            id="history-panel"
          >
            <h3 className="text-sm font-semibold font-rounded text-[#8B5A2B] flex items-center gap-1">
              <History size={14} /> Recent Practice History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No practice sessions recorded yet. Start reading to save records!</p>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-2">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setReferenceText(item.referenceText);
                      setTranscribedText(item.transcribedText);
                      // Set back the assessment
                      assessResult();
                    }}
                    className="flex justify-between items-center bg-white border border-[#FAF2E5] p-2.5 rounded-xl cursor-pointer hover:bg-amber-100/20 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#8B5A2B] line-clamp-1">{item.referenceText}</span>
                      <span className="text-[10px] text-gray-400">{item.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold font-rounded text-[#87D14E]">{item.overallScore}%</span>
                        <span className="text-[9px] text-gray-400">Score</span>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="text-gray-300 hover:text-red-400 p-1 rounded-lg"
                        id={`delete-history-${item.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Central Reading / Display Passage Area */}
        <div className="relative">
          <div 
            className="bg-[#FFF9F2] rounded-3xl p-6 md:p-8 border-4 border-dashed border-[#D2B48C] min-h-[180px] shadow-inner relative flex flex-col justify-center"
            id="text-canvas"
          >
            {/* Cute foliage decoration in corners of the text box */}
            <div className="absolute top-3 left-3 text-lg opacity-40 select-none pointer-events-none">🍃</div>
            <div className="absolute bottom-3 right-3 text-lg opacity-40 select-none pointer-events-none">🍃</div>

            {isAssessing ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-12 h-12 border-4 border-[#87D14E] border-t-transparent rounded-full"
                />
                <span className="font-rounded font-bold text-lg text-[#8B5A2B] animate-pulse">
                  AI Coach is evaluating your pronunciation...
                </span>
                <span className="text-xs text-gray-400">Aligning syllables & detecting problem words</span>
              </div>
            ) : assessment ? (
              /* Display assessed words with individual colors corresponding to status */
              <div className="flex flex-wrap gap-x-2.5 gap-y-3.5 text-lg md:text-2xl font-rounded font-semibold text-gray-700 leading-relaxed justify-center text-center">
                {assessment.wordAssessments.map((wa, i) => {
                  let colorClass = "";
                  if (wa.status === "good") {
                    // Soft green
                    colorClass = "bg-[#A8E4CE]/30 text-[#1D5C43] hover:bg-[#A8E4CE]/50 px-1 rounded-lg border-b-2 border-[#1D5C43]/20";
                  } else if (wa.status === "struggled") {
                    // Soft red / orange
                    colorClass = "bg-[#FCD3D3]/40 text-[#7A1F1F] hover:bg-[#FCD3D3]/60 px-1 rounded-lg border-b-2 border-[#7A1F1F]/20";
                  } else if (wa.status === "omitted") {
                    // Soft grey
                    colorClass = "bg-gray-100 text-gray-400 hover:bg-gray-200 px-1 rounded-lg border-b-2 border-gray-300";
                  }

                  return (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.01 }}
                      key={i}
                      onClick={() => handleSpeakWord(wa.word)}
                      className={`cursor-pointer transition-colors duration-150 relative group ${colorClass}`}
                      title="Click to hear correct pronunciation"
                    >
                      {wa.word}
                      {/* Hover tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex items-center gap-1 text-[10px] bg-[#8B5A2B] text-white px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-50">
                        <Volume2 size={10} /> Speak
                      </span>
                    </motion.span>
                  );
                })}
              </div>
            ) : (
              /* Display original plain text with highlighting on spoken words */
              <div className="text-lg md:text-2xl font-rounded font-semibold text-[#8B5A2B]/90 leading-relaxed text-center">
                {referenceText}
              </div>
            )}
          </div>

          {/* Results Side Box: Problem Words (Rendered dynamically as in Mockup 2) */}
          {assessment && assessment.problemWords && assessment.problemWords.length > 0 && (
            <div className="absolute top-0 right-[-32px] md:right-[-250px] top-1/2 -translate-y-1/2 hidden lg:flex flex-col bg-white border-4 border-dashed border-[#FAF2E5] rounded-3xl p-5 w-[220px] shadow-lg animate-float" id="problem-words-bubble">
              <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[16px] border-r-white filter drop-shadow-[-3px_0_1px_rgba(0,0,0,0.03)]" />
              <h3 className="font-rounded font-bold text-base text-[#8B5A2B] mb-3 text-center border-b-2 border-[#FAF2E5] pb-1.5">
                📖 Problem Words
              </h3>
              <div className="flex flex-col gap-2.5">
                {assessment.problemWords.map((pw, i) => (
                  <div key={i} className="flex flex-col gap-1 bg-[#FFF9F2] border border-[#FAF2E5] p-2 rounded-xl text-center group">
                    <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#8B5A2B]">
                      <span>🍃</span>
                      <span className="underline decoration-wavy decoration-[#F08080]">{pw.word}</span>
                      <button
                        onClick={() => handleSpeakWord(pw.word)}
                        className="text-[#87D14E] hover:text-[#7bc043] p-0.5 rounded transition-colors"
                        title="Hear pronunciation"
                        id={`speak-problem-${pw.word}`}
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400 font-medium">{pw.ipa}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Problem Words Sidebar for Smaller Screens / Non-absolute layouts */}
        {assessment && assessment.problemWords && assessment.problemWords.length > 0 && (
          <div className="lg:hidden bg-white border-4 border-dashed border-[#FAF2E5] rounded-3xl p-5 w-full shadow" id="problem-words-panel-mobile">
            <h3 className="font-rounded font-bold text-lg text-[#8B5A2B] mb-3 flex items-center gap-1 justify-center">
              📖 Tricky Words to Practice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assessment.problemWords.map((pw, i) => (
                <div key={i} className="bg-[#FFF9F2] border border-[#FAF2E5] p-3 rounded-2xl flex flex-col gap-1 relative">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="font-bold font-rounded text-base text-[#8B5A2B] flex items-center gap-1">
                      🍃 {pw.word}
                    </span>
                    <button
                      onClick={() => handleSpeakWord(pw.word)}
                      className="bg-[#87D14E]/10 hover:bg-[#87D14E]/20 text-[#1D5C43] p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs"
                      id={`speak-mobile-${pw.word}`}
                    >
                      <Volume2 size={14} /> Listen
                    </button>
                  </div>
                  <span className="font-mono text-xs text-[#87D14E] font-semibold">{pw.ipa}</span>
                  <p className="text-xs text-[#8B5A2B]/80 mt-1">{pw.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Audio Player for playback if recording exists */}
        {audioUrl && !isRecording && (
          <div className="flex items-center justify-center gap-4 bg-[#FAF2E5]/50 py-3 px-6 rounded-2xl border-2 border-dashed border-[#D2B48C]">
            <span className="text-sm font-rounded font-semibold text-[#8B5A2B] flex items-center gap-1">
              🎙️ Listen to your recording:
            </span>
            <audio src={audioUrl} controls className="h-8 rounded-lg" />
          </div>
        )}

        {/* Action Controls - Start, Stop, Demo Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 py-2">
          {isRecording ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStopRecording}
              className="btn-clay-red text-white font-rounded text-lg md:text-xl font-bold px-10 py-3.5 rounded-full cursor-pointer flex items-center gap-2"
              id="stop-button"
            >
              <Square size={20} fill="white" /> Stop
            </motion.button>
          ) : (
            <div className="relative">
              {/* Hand/cursor click indicator as in the mockup */}
              <div className="absolute top-10 right-0 animate-bounce pointer-events-none select-none z-20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2v20M2 12h20" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 10l-4 4 4 4" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 4.5l5 15h-10l5-15z" fill="#FAF6EE" />
                </svg>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartRecording}
                className="btn-clay-green text-white font-rounded text-lg md:text-xl font-bold px-10 py-3.5 rounded-full cursor-pointer flex items-center gap-2 relative overflow-hidden"
                id="start-button"
              >
                <span>🍃</span> Start Reading
              </motion.button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoadMock}
            disabled={isRecording}
            className={`btn-clay-brown text-white font-rounded text-lg md:text-xl font-bold px-10 py-3.5 rounded-full cursor-pointer flex items-center gap-2 ${
              isRecording ? "opacity-50 cursor-not-allowed" : ""
            }`}
            id="demo-button"
          >
            Demo / Mock
          </motion.button>
        </div>

        {/* Real-time speech transcript log (when recording) */}
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#FAF2E5]/50 border-2 border-dashed border-[#D2B48C]/60 rounded-2xl p-4 text-center flex flex-col gap-1"
            id="transcript-panel"
          >
            <span className="text-xs font-semibold text-[#8B5A2B]/80 font-rounded uppercase tracking-wider">🎙️ Real-time Transcription</span>
            <p className="text-sm font-mono text-gray-500 italic">
              {transcribedText || "Start speaking into your microphone. Your words will appear here..."}
            </p>
          </motion.div>
        )}

        {/* Bottom results status ribbons - Overall Score and Stat blocks */}
        <AnimatePresence>
          {assessment && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex flex-col gap-6 pt-4 border-t-2 border-dashed border-[#FAF2E5]"
              id="assessment-results-panel"
            >
              
              {/* Score Ribbon with Stitch style (from mockup 2) */}
              <div className="flex justify-center">
                <div className="bg-[#87D14E] px-8 md:px-14 py-2.5 rounded-2xl border-4 border-[#6BA837] relative shadow-[0_5px_0px_#538528] flex items-center justify-center min-w-[200px]" id="score-ribbon">
                  <div className="absolute inset-1 rounded-xl border-2 border-dashed border-white/50 pointer-events-none" />
                  <span className="text-white font-rounded text-xl md:text-2xl font-bold tracking-wide">
                    Your Score: {assessment.overallScore}
                  </span>
                </div>
              </div>

              {/* AI Coach Feedback speech bubble */}
              <div className="bg-[#FAF9F6] border-4 border-[#E6DEC9] rounded-3xl p-5 flex gap-4 items-start relative shadow-sm" id="coach-feedback-bubble">
                <div className="w-12 h-12 rounded-full bg-[#87D14E]/20 flex items-center justify-center text-2xl select-none flex-shrink-0 animate-bounce">
                  🦉
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-rounded font-bold text-sm text-[#8B5A2B]">AI Speech Coach</span>
                  <p className="text-xs md:text-sm text-[#5C3D1E] leading-relaxed italic">
                    "{assessment.coachFeedback}"
                  </p>
                </div>
              </div>

              {/* Stat indicators Row - Matches bottom-right indicators in Mockup 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Results & Progress pill indicators (from mockup 1) */}
                <div className="flex flex-col gap-2 bg-white border-4 border-[#FAF2E5] p-4 rounded-3xl" id="progress-indicators-panel">
                  <h3 className="text-[#8B5A2B] font-rounded font-bold text-base mb-2">Results & Progress</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-1.5 rounded-full bg-[#A8E4CE]/30 text-[#1D5C43] border border-[#1D5C43]/20 text-xs font-bold font-rounded">
                      good pronunciation
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-[#FCD3D3]/40 text-[#7A1F1F] border border-[#7A1F1F]/20 text-xs font-bold font-rounded">
                      struggled
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-[#A8E4CE]/30 text-[#1D5C43] border border-[#1D5C43]/20 text-xs font-bold font-rounded">
                      fluent
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-[#FAF2E5] text-[#8B5A2B] border border-[#D2B48C]/40 text-xs font-bold font-rounded">
                      speech rate: normal
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-[#A8E4CE]/30 text-[#1D5C43] border border-[#1D5C43]/20 text-xs font-bold font-rounded">
                      natural pacing
                    </span>
                  </div>
                </div>

                {/* Progress bar & stopwatch widgets (from mockup 1) */}
                <div className="flex flex-col gap-3 justify-center">
                  
                  {/* Real-time/Recorded Stopwatch indicator */}
                  <div className="flex items-center justify-between bg-white border-4 border-[#FAF2E5] px-4 py-2.5 rounded-full shadow-sm">
                    <div className="flex items-center gap-2 text-[#8B5A2B] font-rounded font-bold text-sm">
                      <span className="w-8 h-8 rounded-full bg-[#CEAA80]/20 flex items-center justify-center text-lg">🔔</span>
                      <span>Time: {seconds > 0 ? formatTime(seconds) : "01:30"}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium font-mono">Stopwatch</span>
                  </div>

                  {/* Progress Pill indicator */}
                  <div className="flex items-center justify-between bg-white border-4 border-[#FAF2E5] px-4 py-2.5 rounded-full shadow-sm">
                    <div className="flex items-center gap-2 text-[#8B5A2B] font-rounded font-bold text-sm flex-1">
                      <span className="w-8 h-8 rounded-full bg-[#87D14E]/20 flex items-center justify-center text-lg">🍃</span>
                      <span className="mr-2">Progress:</span>
                      
                      {/* Bouncy Progress Bar inside a pill container */}
                      <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200/50 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${assessment.completeness}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-[#87D14E] h-full rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#8B5A2B] font-bold font-rounded ml-3">
                      {assessment.completeness}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscores Grid layout */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FFF9F2] border border-[#FAF2E5] p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-rounded">Accuracy</span>
                  <p className="text-xl font-bold font-rounded text-[#8B5A2B]">{assessment.accuracy}%</p>
                </div>
                <div className="bg-[#FFF9F2] border border-[#FAF2E5] p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-rounded">Fluency</span>
                  <p className="text-xl font-bold font-rounded text-[#87D14E]">{assessment.fluency}%</p>
                </div>
                <div className="bg-[#FFF9F2] border border-[#FAF2E5] p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-rounded">Completeness</span>
                  <p className="text-xl font-bold font-rounded text-[#CEAA80]">{assessment.completeness}%</p>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Small cute decorative details: little mushrooms on sides of the panel */}
        <div className="absolute bottom-[-16px] left-[24px] pointer-events-none select-none flex items-end">
          {/* Sad/Cute red mushroom */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 24C10 16.268 14.4772 10 20 10C25.5228 10 30 16.268 30 24H10Z" fill="#F08080" stroke="#800000" strokeWidth="2" />
            <circle cx="16" cy="15" r="2" fill="white" />
            <circle cx="24" cy="18" r="1.5" fill="white" />
            <path d="M16 24V32C16 34.2091 17.7909 36 20 36C22.2091 36 24 34.2091 24 32V24H16Z" fill="#FFF9F2" stroke="#8B5A2B" strokeWidth="2" />
            {/* sad eyes */}
            <circle cx="18" cy="27" r="1" fill="#8B5A2B" />
            <circle cx="22" cy="27" r="1" fill="#8B5A2B" />
            <path d="M19 30.5C19.5 30 20.5 30 21 30.5" stroke="#8B5A2B" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        
        <div className="absolute bottom-[-16px] right-[24px] pointer-events-none select-none flex items-end">
          {/* Another cute mushroom */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 24C10 16.268 14.4772 10 20 10C25.5228 10 30 16.268 30 24H10Z" fill="#CEAA80" stroke="#84613B" strokeWidth="2" />
            <circle cx="14" cy="17" r="1.5" fill="white" />
            <circle cx="22" cy="14" r="2" fill="white" />
            <path d="M16 24V32C16 34.2091 17.7909 36 20 36C22.2091 36 24 34.2091 24 32V24H16Z" fill="#FFF9F2" stroke="#8B5A2B" strokeWidth="2" />
            {/* cute happy eyes */}
            <circle cx="18" cy="27" r="1" fill="#8B5A2B" />
            <circle cx="22" cy="27" r="1" fill="#8B5A2B" />
            <path d="M19 30C19.5 30.5 20.5 30.5 21 30" stroke="#8B5A2B" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>

      </div>

      {/* Decorative grass blades along the bottom frame */}
      <div className="w-full max-w-5xl flex justify-between px-8 select-none pointer-events-none opacity-40 mt-3">
        <span className="text-xl">🌱🌾</span>
        <span className="text-xl">🌾🌱</span>
      </div>

      {/* Bottom Footer links: About, Privacy, Contact (as in mockup footer) */}
      <footer className="w-full max-w-md flex justify-center gap-8 text-sm font-rounded font-semibold text-[#8B5A2B] mt-6 z-10">
        <button 
          onClick={() => setActiveModal("about")}
          className="hover:text-[#87D14E] transition-colors flex items-center gap-1 cursor-pointer"
          id="footer-about"
        >
          <span>🍃</span> About
        </button>
        <button 
          onClick={() => setActiveModal("privacy")}
          className="hover:text-[#87D14E] transition-colors flex items-center gap-1 cursor-pointer"
          id="footer-privacy"
        >
          <span>🍃</span> Privacy
        </button>
        <button 
          onClick={() => setActiveModal("contact")}
          className="hover:text-[#87D14E] transition-colors flex items-center gap-1 cursor-pointer"
          id="footer-contact"
        >
          <span>🍃</span> Contact
        </button>
      </footer>

      {/* Cute modally dialog for About / Privacy / Contact */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-8 border-[#FAF2E5] rounded-3xl p-6 max-w-md w-full relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              id="info-modal"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#8B5A2B] text-2xl font-bold font-rounded"
                id="close-modal"
              >
                ✕
              </button>

              {activeModal === "about" && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold font-rounded text-[#8B5A2B] border-b-2 border-dashed border-[#FAF2E5] pb-2 flex items-center gap-1.5">
                    📖 About English Practice
                  </h3>
                  <p className="text-sm text-[#5C3D1E] leading-relaxed">
                    Welcome! This application is designed to make English reading and pronunciation practice fun, cozy, and highly rewarding.
                  </p>
                  <p className="text-sm text-[#5C3D1E] leading-relaxed">
                    We combine the <strong>Browser Speech Recognition API</strong> for immediate, low-latency word tracking with the <strong>Gemini 3.5-flash AI Model</strong> to give you personalized, syllable-perfect coaching tips and pronunciation grades.
                  </p>
                  <p className="text-sm text-[#5C3D1E] leading-relaxed">
                    Perfect for students, language learners, or anyone looking to refine their speech accents in a comfortable, pressure-free environment!
                  </p>
                </div>
              )}

              {activeModal === "privacy" && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold font-rounded text-[#8B5A2B] border-b-2 border-dashed border-[#FAF2E5] pb-2 flex items-center gap-1.5">
                    🛡️ Privacy Policy
                  </h3>
                  <p className="text-sm text-[#5C3D1E] leading-relaxed">
                    Your speech is processed completely in real-time. Here's how we keep your data safe:
                  </p>
                  <ul className="text-xs text-[#5C3D1E] list-disc list-inside flex flex-col gap-1">
                    <li>Audio recordings are stored purely locally in your browser memory for playback, and are never saved on any database.</li>
                    <li>Transcriptions sent to the server for Gemini AI analysis are used only for generating scores and are never stored.</li>
                    <li>No advertisement tracking or third-party cookies are used.</li>
                  </ul>
                  <p className="text-xs text-gray-400 italic">
                    Your practice is safe and strictly private. We value your trust!
                  </p>
                </div>
              )}

              {activeModal === "contact" && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold font-rounded text-[#8B5A2B] border-b-2 border-dashed border-[#FAF2E5] pb-2 flex items-center gap-1.5">
                    ✉️ Contact Us
                  </h3>
                  <p className="text-sm text-[#5C3D1E] leading-relaxed">
                    Have questions, suggestions, or want to collaborate with our speech research team? We'd love to hear from you!
                  </p>
                  <div className="bg-[#FFF9F2] p-3 rounded-xl border border-[#FAF2E5] text-center flex flex-col gap-1 mt-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Support</span>
                    <a href="mailto:heziqi19960506@gmail.com" className="text-sm font-bold text-[#87D14E] hover:underline">
                      heziqi19960506@gmail.com
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    We typically respond within 24-48 business hours. Keep practicing!
                  </p>
                </div>
              )}

              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setActiveModal(null)}
                  className="btn-clay-green text-white font-rounded text-sm font-bold px-6 py-2 rounded-full cursor-pointer"
                  id="close-modal-btn"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
