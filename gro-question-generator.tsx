import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Lock, Mail, ArrowRight, Download, Clock, Target, TrendingUp, Users, Lightbulb, ChevronDown, MessageSquare, Coffee, Calendar, Phone, Megaphone } from 'lucide-react';

const GroQuestionGenerator = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [interviewSetting, setInterviewSetting] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [questions, setQuestions] = useState(null);
  const [conversationStarter, setConversationStarter] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});

  const interviewSettings = [
    { value: 'casual', label: 'Casual Conversation', icon: <Coffee className="w-4 h-4" />, description: 'Coffee chat, networking event, informal meetup' },
    { value: 'scheduled', label: 'Scheduled Interview', icon: <Calendar className="w-4 h-4" />, description: 'Formal customer discovery interview' },
    { value: 'cold', label: 'Cold Outreach', icon: <Phone className="w-4 h-4" />, description: 'Phone call or video chat with someone new' },
    { value: 'conference', label: 'Conference/Event', icon: <Megaphone className="w-4 h-4" />, description: 'Trade show, conference, or industry event' }
  ];

  const generateConversationStarter = async (idea, setting) => {
    try {
      const prompt = `You are an expert customer discovery coach. Generate a natural, conversational opening line for a customer interview.

Business idea: ${idea}
Interview setting: ${setting} (${interviewSettings.find(s => s.value === setting)?.description})

Create a conversation starter that:
1. Is warm and non-threatening
2. Clearly states you're not selling anything
3. Shows genuine curiosity about their problems
4. Is appropriate for the setting (${setting === 'casual' || setting === 'conference' ? 'informal' : 'formal'})
5. Mentions specific aspects of their work related to the business idea
6. Takes 10-15 seconds to say out loud

Return ONLY the conversation starter in quotes, with [bracketed] placeholders for personalization.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error generating conversation starter:', error);
      // Fallback to template if API fails
      const starters = {
        casual: `"Hey! I noticed you work in this space. I'm exploring ideas around improving workflows. Not selling anything - just trying to understand how people handle this today. Mind if I ask about your experience?"`,
        scheduled: `"Thanks for taking the time to speak with me. I'm researching how professionals handle their work. Not pitching anything - just trying to understand real challenges. This should take about 20-30 minutes."`,
        cold: `"Hi, I'm doing research on industry challenges. Not selling anything - just trying to learn from experts like you. Would you have 15 minutes to share your experience?"`,
        conference: `"Hi! I'm here researching how companies handle their workflows. Not pitching - just trying to understand real problems. What's been your experience?"`
      };
      return starters[setting] || starters.scheduled;
    }
  };

  const extractCore = (idea) => {
    // Extract the core concept from the business idea
    const concepts = [
      "project management", "task tracking", "team collaboration",
      "customer feedback", "time tracking", "invoicing",
      "inventory management", "scheduling", "communication"
    ];
    
    const lowerIdea = idea.toLowerCase();
    for (const concept of concepts) {
      if (lowerIdea.includes(concept)) return concept;
    }
    return "improving workflows";
  };

  const extractActivity = (idea) => {
    const activities = {
      "task": "task management",
      "manage": "management",
      "track": "tracking",
      "organize": "organizing",
      "schedule": "scheduling",
      "communicate": "communication",
      "sell": "sales",
      "market": "marketing",
      "invoice": "invoicing",
      "feedback": "getting feedback"
    };
    
    const lowerIdea = idea.toLowerCase();
    for (const [key, value] of Object.entries(activities)) {
      if (lowerIdea.includes(key)) return value;
    }
    return "this type of work";
  };

  const extractTarget = (idea) => {
    const targets = {
      "freelance": "freelancers",
      "agency": "agencies",
      "startup": "startups",
      "enterprise": "enterprises",
      "small business": "small businesses",
      "designer": "designers",
      "developer": "developers",
      "marketer": "marketers",
      "sales": "sales teams"
    };
    
    const lowerIdea = idea.toLowerCase();
    for (const [key, value] of Object.entries(targets)) {
      if (lowerIdea.includes(key)) return value;
    }
    return "professionals";
  };

  const generateQuestions = async (idea, setting) => {
    try {
      const formality = setting === 'casual' || setting === 'conference' ? 'casual' : 'formal';
      
      const prompt = `You are an expert customer discovery coach who has helped validate hundreds of startups. Analyze this business idea and generate highly specific, insightful interview questions.

Business idea: ${idea}
Interview setting: ${setting} (${interviewSettings.find(s => s.value === setting)?.description})
Tone: ${formality}

Generate interview questions for these 5 critical categories. Each question must be:
1. Specific to THIS business idea (not generic)
2. Designed to uncover real insights (not yes/no questions)
3. Non-leading (doesn't assume there's a problem)
4. Conversational and natural for the ${formality} setting
5. Focused on understanding their current reality, not hypotheticals

Return a JSON object with this exact structure:
{
  "problemDiscovery": {
    "title": "Problem Discovery",
    "description": "Uncover real pain points without leading the witness",
    "questions": [6 specific questions about their current challenges with this specific problem area]
  },
  "currentSolution": {
    "title": "Current Solutions & Alternatives", 
    "description": "Understand what they're doing now and why",
    "questions": [6 specific questions about their existing tools/processes for this need]
  },
  "urgencyBudget": {
    "title": "Urgency & Budget Reality",
    "description": "Validate if this is a 'hair on fire' problem worth paying for",
    "questions": [6 specific questions about priority, budget, and timeline]
  },
  "jobsToBeDone": {
    "title": "Jobs to Be Done",
    "description": "Understand the deeper motivations and desired outcomes",
    "questions": [6 specific questions about underlying goals and success metrics]
  },
  "decisionProcess": {
    "title": "Decision Making Process",
    "description": "Learn how they evaluate and buy solutions",
    "questions": [6 specific questions about their evaluation and purchasing process]
  }
}

Important: Make questions specifically about the actual problem space described in their business idea. Reference specific aspects of their idea in the questions.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });
      
      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up the response to extract JSON
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const parsedQuestions = JSON.parse(responseText);
      
      // Add icons to each category
      parsedQuestions.problemDiscovery.icon = <Target className="w-4 h-4" />;
      parsedQuestions.currentSolution.icon = <Users className="w-4 h-4" />;
      parsedQuestions.urgencyBudget.icon = <Clock className="w-4 h-4" />;
      parsedQuestions.jobsToBeDone.icon = <Lightbulb className="w-4 h-4" />;
      parsedQuestions.decisionProcess.icon = <TrendingUp className="w-4 h-4" />;
      
      return parsedQuestions;
      
    } catch (error) {
      console.error('Error generating AI questions:', error);
      // Fallback to basic questions if API fails
      return getFallbackQuestions(idea, setting);
    }
  };

  const getFallbackQuestions = (idea, setting) => {
    const activity = extractActivity(idea);
    const target = extractTarget(idea);
    const formality = setting === 'casual' || setting === 'conference' ? 'casual' : 'formal';
    
    return {
      problemDiscovery: {
        title: "Problem Discovery",
        icon: <Target className="w-4 h-4" />,
        description: "Uncover real pain points without leading the witness",
        questions: [
          `Walk me through how you currently handle ${activity}?`,
          `What's the most frustrating part of that process?`,
          `How much time do you lose each week dealing with this?`,
          `Tell me about the last time this problem really bothered you.`,
          `What happens if you don't solve this problem?`,
          `Who else in your organization is affected by this?`
        ]
      },
      currentSolution: {
        title: "Current Solutions & Alternatives",
        icon: <Users className="w-4 h-4" />,
        description: "Understand what they're doing now and why",
        questions: [
          `What are you using today to manage ${activity}?`,
          `What made you choose that particular approach?`,
          `What's working well with your current solution?`,
          `If you could wave a magic wand and fix one thing about your current process, what would it be?`,
          `Have you tried other solutions? What happened?`,
          `What would need to happen for you to switch from what you're using now?`
        ]
      },
      urgencyBudget: {
        title: "Urgency & Budget Reality",
        icon: <Clock className="w-4 h-4" />,
        description: "Validate if this is a 'hair on fire' problem worth paying for",
        questions: [
          `On a scale of 1-10, how painful is this problem for you right now?`,
          `What's this problem costing you in terms of time or money?`,
          `Have you allocated budget for solving this?`,
          `Who would need to approve a purchase decision for this?`,
          `When do you need this problem solved by?`,
          `What happens if you don't solve this in the next 6 months?`
        ]
      },
      jobsToBeDone: {
        title: "Jobs to Be Done",
        icon: <Lightbulb className="w-4 h-4" />,
        description: "Understand the deeper motivations and desired outcomes",
        questions: [
          `What are you ultimately trying to achieve when you deal with ${activity}?`,
          `How would solving this problem change your day-to-day?`,
          `What would success look like for you in 6 months?`,
          `What metrics or outcomes matter most to you here?`,
          `How would you know if a solution was actually working?`,
          `What's the bigger goal you're working toward?`
        ]
      },
      decisionProcess: {
        title: "Decision Making Process",
        icon: <TrendingUp className="w-4 h-4" />,
        description: "Learn how they evaluate and buy solutions",
        questions: [
          `Walk me through how you typically evaluate new tools or solutions.`,
          `Who else would be involved in deciding on a solution?`,
          `What criteria matter most when you're comparing options?`,
          `What would make you confident that a solution is right for you?`,
          `What concerns would you have about adopting something new?`,
          `How do you typically find out about new solutions in this space?`
        ]
      }
    };
  };

  const handleGenerateQuestions = async () => {
    if (!businessIdea.trim() || !interviewSetting) return;
    
    setIsGenerating(true);
    setGenerationStatus('Analyzing your business idea...');
    
    // Small delay to show the first status
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setGenerationStatus('Understanding your target market...');
    
    // Generate AI-powered questions and conversation starter
    const questionsPromise = generateQuestions(businessIdea, interviewSetting);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setGenerationStatus('Crafting personalized interview questions...');
    
    const starterPromise = generateConversationStarter(businessIdea, interviewSetting);
    
    const [generatedQuestions, starter] = await Promise.all([
      questionsPromise,
      starterPromise
    ]);
    
    setGenerationStatus('Finalizing your interview guide...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setQuestions(generatedQuestions);
    setConversationStarter(starter);
    setIsGenerating(false);
    setGenerationStatus('');
    setShowEmailGate(true);
    
    // Auto-expand first category
    setExpandedCategories({ problemDiscovery: true });
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    
    try {
      const response = await fetch('https://gro-question-generator-production.up.railway.app/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          businessIdea: businessIdea,
          interviewSetting: interviewSetting
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit email');
      }

      const result = await response.json();
      console.log('Email capture result:', result);
      
      setEmailSubmitted(true);
    } catch (error) {
      console.error('Error submitting email:', error);
      // Still allow user to proceed even if backend fails
      setEmailSubmitted(true);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getVisibleQuestions = () => {
    if (!questions) return [];
    
    const allCategories = Object.keys(questions);
    const visibleCategories = emailSubmitted ? allCategories : allCategories.slice(0, 2);
    
    return visibleCategories;
  };

  const getQuestionCount = () => {
    if (!questions) return 0;
    return Object.values(questions).reduce((acc, cat) => acc + cat.questions.length, 0);
  };

  const downloadQuestions = () => {
    if (!emailSubmitted) return;
    
    // Create text content for download
    let content = `Customer Interview Questions for: ${businessIdea}\n`;
    content += `Interview Setting: ${interviewSettings.find(s => s.value === interviewSetting)?.label}\n\n`;
    content += "Generated by AskGro AI - Your Customer Discovery Coach\n";
    content += "=" .repeat(50) + "\n\n";
    
    content += "CONVERSATION STARTER:\n";
    content += conversationStarter + "\n\n";
    content += "=" .repeat(50) + "\n\n";
    
    Object.values(questions).forEach(category => {
      content += `${category.title.toUpperCase()}\n`;
      content += `${category.description}\n`;
      content += "-".repeat(30) + "\n";
      category.questions.forEach((q, idx) => {
        content += `${idx + 1}. ${q}\n`;
      });
      content += "\n";
    });
    
    content += "\nPRO TIPS FOR YOUR INTERVIEWS:\n";
    content += "• Listen more than you talk (aim for 70/30 ratio)\n";
    content += "• Take notes on emotions, not just facts\n";
    content += "• Ask follow-up questions: 'Why?' and 'Can you tell me more?'\n";
    content += "• Record interviews if possible (with permission)\n";
    content += "• Interview 10-15 people before making big decisions\n";
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-interview-questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Gro Logo Component
  const GroLogo = () => (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="text-5xl font-bold tracking-tight">
        <span className="text-gray-800">Ask</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Gro</span>
        <span className="text-gray-800 font-light ml-2">AI</span>
      </div>
      <a 
        href="https://askgro.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm text-gray-500 hover:text-teal-600 transition-colors duration-200"
      >
        https://askgro.ai
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="px-4 pt-8 pb-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6">
            <GroLogo />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Claude AI • Personalized for Your Exact Business
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get AI-Generated Interview Questions
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600"> That Actually Work</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop using generic templates. AskGro's AI analyzes your specific business idea 
            and generates personalized questions that uncover real customer problems.
          </p>
        </div>
      </div>

      {/* Input Section */}
      {!questions && (
        <div className="px-4 pb-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Business Idea Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your business idea? <span className="text-gray-400">(Be specific)</span>
                </label>
                <textarea
                  value={businessIdea}
                  onChange={(e) => setBusinessIdea(e.target.value)}
                  placeholder="Example: A project management tool for freelance designers that helps them track time, manage client feedback, and invoice automatically..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Interview Setting Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where will you be conducting these interviews?
                </label>
                <div className="relative">
                  <select
                    value={interviewSetting}
                    onChange={(e) => setInterviewSetting(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select interview setting...</option>
                    {interviewSettings.map(setting => (
                      <option key={setting.value} value={setting.value}>
                        {setting.label} - {setting.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Selected Setting Preview */}
              {interviewSetting && (
                <div className="mb-6 p-3 bg-emerald-50 rounded-lg flex items-center gap-3">
                  {interviewSettings.find(s => s.value === interviewSetting)?.icon}
                  <div>
                    <p className="text-sm font-medium text-teal-900">
                      {interviewSettings.find(s => s.value === interviewSetting)?.label}
                    </p>
                    <p className="text-xs text-teal-600">
                      Questions will be tailored for this context
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleGenerateQuestions}
                disabled={!businessIdea.trim() || !interviewSetting || isGenerating}
                className={`w-full mt-2 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  businessIdea.trim() && interviewSetting && !isGenerating
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="animate-pulse">{generationStatus || 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate AI-Powered Questions
                  </>
                )}
              </button>
              
              {isGenerating && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    AskGro AI is personalizing questions specifically for your business idea...
                  </p>
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI-personalized
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  30+ questions
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  5 key areas
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 text-center">
                  <strong>🤖 How it works:</strong> Our AI deeply analyzes your business idea to understand your target market, 
                  value proposition, and problem space. It then generates questions specifically designed to validate 
                  YOUR unique assumptions—not generic templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {questions && (
        <div className="px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Your AI-Generated Questions Are Ready!</h2>
                    <p className="opacity-90">
                      {getQuestionCount()} questions personally crafted for "{businessIdea.substring(0, 50)}..."
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Generation Notice */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex items-center gap-2 text-purple-700 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">AI Analysis Complete:</span>
                  <span>These questions were generated specifically for your business idea using advanced AI</span>
                </div>
              </div>

              {/* Business Context Reminder */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Your idea:</span> {businessIdea}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Interview setting:</span> {interviewSettings.find(s => s.value === interviewSetting)?.label}
                  </p>
                </div>
              </div>

              {/* Questions Display */}
              <div className="p-6">
                {/* Conversation Starter */}
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-teal-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-teal-900 mb-2">Your Conversation Starter</h3>
                      <p className="text-gray-700 italic">{conversationStarter}</p>
                      <p className="text-xs text-teal-600 mt-3">
                        💡 Pro tip: Customize the [bracketed] parts to match your specific situation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Categories */}
                {getVisibleQuestions().map((categoryKey) => {
                  const category = questions[categoryKey];
                  const isExpanded = expandedCategories[categoryKey];
                  
                  return (
                    <div key={categoryKey} className="mb-6 last:mb-0">
                      <button
                        onClick={() => toggleCategory(categoryKey)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {category.icon}
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{category.title}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-3 space-y-2 pl-4">
                          {category.questions.map((question, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                              <span className="text-sm font-semibold text-teal-600 mt-0.5">{idx + 1}.</span>
                              <p className="text-gray-700 flex-1">{question}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Locked Categories Preview */}
                {!emailSubmitted && (
                  <div className="relative mt-6">
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent z-10 pointer-events-none"></div>
                    <div className="opacity-50 blur-[2px]">
                      {Object.keys(questions).slice(2, 4).map((categoryKey) => {
                        const category = questions[categoryKey];
                        return (
                          <div key={categoryKey} className="mb-4">
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                {category.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{category.title}</h3>
                                <p className="text-sm text-gray-600">{category.description}</p>
                              </div>
                              <Lock className="w-4 h-4 text-gray-400 ml-auto" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Email Gate */}
                {!emailSubmitted && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="text-center mb-4">
                      <Lock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Unlock All {getQuestionCount()} Questions + Download
                      </h3>
                      <p className="text-gray-600 mt-1">
                        Get instant access to all categories plus interview best practices
                      </p>
                    </div>
                    
                    <div className="flex gap-3 max-w-md mx-auto">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEmailSubmit();
                          }
                        }}
                      />
                      <button
                        onClick={handleEmailSubmit}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Get Access
                      </button>
                    </div>
                    
                    <p className="text-center text-xs text-gray-500 mt-3">
                      Join 1,000+ founders getting better at customer discovery. No spam, unsubscribe anytime.
                    </p>
                  </div>
                )}

                {/* Success State After Email */}
                {emailSubmitted && (
                  <div className="mt-8">
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 text-green-700 mb-4">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold">Success! Check your email for your questions.</span>
                      </div>
                      
                      <button
                        onClick={downloadQuestions}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download All Questions (.txt)
                      </button>
                    </div>

                    {/* Pro Tips */}
                    <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                      <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Pro Interview Tips from AskGro
                      </h3>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li>• Listen more than you talk - aim for a 70/30 ratio</li>
                        <li>• Never pitch your solution during discovery interviews</li>
                        <li>• Ask "Why?" and "Tell me more about that" frequently</li>
                        <li>• Take notes on emotions and energy levels, not just words</li>
                        <li>• Interview 10-15 people before making big decisions</li>
                        <li>• Bad news is good news - embrace the problems you discover</li>
                      </ul>
                    </div>

                    {/* CTA for Gro */}
                    <div className="mt-8 text-center p-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ready to Practice These Interviews?
                      </h3>
                      <p className="text-gray-600 mb-4">
                        AskGro can role-play as your customers so you can practice before the real thing
                      </p>
                      <a 
                        href="https://www.askgro.ai/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Join the AskGro Waitlist →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Proof */}
      <div className="px-4 py-12 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by founders who've validated ideas at</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">YCombinator</div>
            <div className="text-2xl font-bold text-gray-400">Techstars</div>
            <div className="text-2xl font-bold text-gray-400">500 Startups</div>
            <div className="text-2xl font-bold text-gray-400">Antler</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroQuestionGenerator;