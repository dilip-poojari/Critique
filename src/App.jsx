import React, { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';

// Severity colors and icons
const SEVERITY_CONFIG = {
  critical: { color: 'var(--ibm-support-error)', icon: '🔴', label: 'CRITICAL' },
  high: { color: '#ff832b', icon: '🟠', label: 'HIGH' },
  medium: { color: 'var(--ibm-support-warning)', icon: '🟡', label: 'MEDIUM' },
  low: { color: 'var(--ibm-support-success)', icon: '🟢', label: 'LOW' }
};

const EFFORT_CONFIG = {
  low: { label: 'Low Effort', color: 'var(--ibm-support-success)' },
  medium: { label: 'Medium Effort', color: 'var(--ibm-support-warning)' },
  high: { label: 'High Effort', color: 'var(--ibm-support-error)' }
};

const LOADING_MESSAGES = [
  "Sniffing out contrast issues...",
  "Consulting Fitts' Law...",
  "Asking 10,000 users...",
  "Running Nielsen's checklist...",
  "Checking Carbon tokens...",
  "Measuring touch targets...",
  "Analyzing information hierarchy...",
  "Evaluating WCAG compliance...",
  "Testing keyboard navigation...",
  "Reviewing accessibility patterns..."
];

function App() {
  const [view, setView] = useState('input'); // 'input' | 'loading' | 'results'
  const [inputType, setInputType] = useState('upload'); // 'upload' | 'url' | 'figma'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [figmaInput, setFigmaInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [personaInput, setPersonaInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedIssues, setExpandedIssues] = useState({});
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('critfull-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
    
    const savedApiKey = localStorage.getItem('critfull-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Rotate loading messages
  useEffect(() => {
    if (view === 'loading') {
      const messageInterval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
        });
      }, 2000);

      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      return () => {
        clearInterval(messageInterval);
        clearInterval(progressInterval);
      };
    }
  }, [view]);

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const runCritique = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      setError('Please enter your Anthropic API key to continue.');
      return;
    }

    if (!uploadedImage && !urlInput && !figmaInput) {
      setError('Please provide a design to critique (upload, URL, or Figma link).');
      return;
    }

    setError(null);
    setView('loading');
    setLoadingProgress(0);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      let userMessage = '';
      const messageContent = [];

      // Build context
      if (contextInput) {
        userMessage += `Design Context: ${contextInput}\n\n`;
      }
      if (personaInput) {
        userMessage += `Target Users/Personas: ${personaInput}\n\n`;
      }

      // Handle different input types
      if (uploadedImage) {
        userMessage += 'Please analyze this design screenshot.\n';
        const base64Image = imagePreview.split(',')[1];
        const imageType = uploadedImage.type.split('/')[1];
        
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: uploadedImage.type,
            data: base64Image
          }
        });
      } else if (urlInput) {
        userMessage += `Please analyze the design at this URL: ${urlInput}\n`;
      } else if (figmaInput) {
        userMessage += `Please analyze this Figma design: ${figmaInput}\n`;
      }

      messageContent.push({
        type: 'text',
        text: userMessage
      });

      const systemPrompt = `You are an elite UX Design Critic and Accessibility Auditor with 20+ years of enterprise design experience. You have deep expertise in:

1. **Carbon Design System** — IBM's open-source design system. Evaluate component usage, spacing (8px grid), color tokens, typography scale, iconography (Carbon Icons), and interaction patterns.
   Reference: https://carbondesignsystem.com/

2. **Carbon for Cloud** — IBM Cloud's design operations guidelines. Evaluate provision page patterns, layout structures, action placement, and cloud-specific UX patterns.
   Reference: https://pages.github.ibm.com/ibmcloud/design-operations/carbon-for-cloud/layouts/provision-page/usage/

3. **Accessibility (WCAG 2.2 + Carbon Accessibility)** — Evaluate against all WCAG 2.2 success criteria (Level A, AA, and AAA where applicable). Check color contrast ratios (4.5:1 text, 3:1 UI components), keyboard navigation, focus indicators, ARIA usage, reading order, touch targets (44x44px min), and screen reader compatibility.
   Reference: https://www.w3.org/TR/WCAG22/ and https://carbondesignsystem.com/guidelines/accessibility/overview/

4. **Heuristic Evaluation** — Apply two frameworks:
   a. Weinschenk & Barker's 20 usability heuristics classification (Reference: https://www.heurio.co/weinschenk-barker-classification)
   b. Nielsen Norman Group's 10 Usability Heuristics (Reference: https://www.nngroup.com/articles/ten-usability-heuristics/)
   
   For each violated heuristic, name it, explain the violation, and suggest a fix.

5. **UX Laws & Usability Principles** — Evaluate against relevant laws:
   - Fitts' Law (target size & distance)
   - Hick's Law (decision complexity)
   - Miller's Law (cognitive load, chunking)
   - Jakob's Law (familiar patterns)
   - Law of Proximity & Similarity (Gestalt)
   - Peak-End Rule (emotional journey)
   - Aesthetic-Usability Effect
   - Doherty Threshold (performance feedback)
   - Von Restorff Effect (visual differentiation)
   Reference: https://lawsofux.com/

6. **Enterprise UX Best Practices** — Evaluate for:
   - Information architecture clarity
   - Progressive disclosure
   - Error prevention and recovery
   - Data density vs. breathing room
   - Consistency and standards
   - Trust signals and credibility
   - Onboarding and empty states
   - Responsive/adaptive design considerations

Respond ONLY in valid JSON format (no markdown, no backticks, pure JSON) with this exact structure:

{
  "designTitle": "Auto-generated name based on design context",
  "summary": "2-3 sentence executive summary of the overall design quality",
  "overallScore": 74,
  "scores": {
    "carbonDesignSystem": { "score": 80, "grade": "B", "emoji": "🏗️" },
    "carbonForCloud": { "score": 65, "grade": "C", "emoji": "☁️" },
    "accessibility": { "score": 58, "grade": "D", "emoji": "♿" },
    "wcag": { "score": 62, "grade": "C", "emoji": "📋" },
    "heuristicEvaluation": { "score": 75, "grade": "B", "emoji": "🔍" },
    "uxLaws": { "score": 80, "grade": "B", "emoji": "⚖️" },
    "enterpriseBestPractices": { "score": 70, "grade": "C", "emoji": "🏢" }
  },
  "issues": [
    {
      "id": "ISS-001",
      "severity": "critical",
      "category": "accessibility",
      "heuristic": "WCAG 1.4.3 Contrast (Minimum)",
      "title": "Insufficient color contrast on primary CTA",
      "description": "The 'Submit' button uses #767676 text on #ffffff background, achieving only 4.48:1 contrast ratio — failing AA for normal text.",
      "impact": "Users with low vision or in bright environments cannot read the button label.",
      "howToFix": "Change button text color to #161616 or use the Carbon $text-on-color token. Carbon's primary button uses white text on $interactive (#0f62fe) which passes at 4.6:1.",
      "referenceUrl": "https://carbondesignsystem.com/elements/color/tokens/",
      "uxLaw": null,
      "effort": "low",
      "priority": 1
    }
  ],
  "strengths": [
    {
      "title": "Excellent information hierarchy",
      "description": "The visual weight progression guides users naturally from headline to CTA."
    }
  ],
  "quickWins": ["Fix button contrast", "Add focus rings", "Increase touch target on mobile nav"],
  "funVerdict": "A witty, memorable one-liner verdict about the design",
  "designPersonality": "The Overachiever"
}

Severity levels: "critical" | "high" | "medium" | "low"
Effort levels: "low" | "medium" | "high"
Categories: "carbon" | "carbon-for-cloud" | "accessibility" | "wcag" | "heuristics-nielsen" | "heuristics-weinschenk" | "ux-laws" | "enterprise"

Be specific, actionable, and reference exact Carbon tokens, WCAG success criteria numbers, or specific law names. Aim for 8-15 issues total across severities. Be honest but constructive.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: messageContent
        }]
      });

      setLoadingProgress(100);

      // Parse the response
      const responseText = response.content[0].text;
      let critiqueData;
      
      try {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          critiqueData = JSON.parse(jsonMatch[0]);
        } else {
          critiqueData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      // Add timestamp and input info
      critiqueData.timestamp = new Date().toISOString();
      critiqueData.inputType = inputType;
      
      setResults(critiqueData);
      
      // Save to history
      const newHistory = [critiqueData, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('critfull-history', JSON.stringify(newHistory));
      
      setView('results');
    } catch (err) {
      console.error('Critique error:', err);
      setError(err.message || 'Failed to analyze design. Please check your API key and try again.');
      setView('input');
    }
  };

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('critfull-api-key', apiKey);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const toggleIssue = (issueId) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const exportAsMarkdown = () => {
    if (!results) return;

    let markdown = `# ${results.designTitle}\n\n`;
    markdown += `**Overall Score:** ${results.overallScore}/100 (${getLetterGrade(results.overallScore)})\n\n`;
    markdown += `**Verdict:** ${results.funVerdict}\n\n`;
    markdown += `**Design Personality:** ${results.designPersonality}\n\n`;
    markdown += `## Summary\n\n${results.summary}\n\n`;
    
    markdown += `## Score Breakdown\n\n`;
    Object.entries(results.scores).forEach(([key, data]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      markdown += `- **${data.emoji} ${label}:** ${data.score}/100 (${data.grade})\n`;
    });
    
    markdown += `\n## Issues\n\n`;
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityIssues = results.issues.filter(i => i.severity === severity);
      if (severityIssues.length > 0) {
        markdown += `### ${SEVERITY_CONFIG[severity].icon} ${SEVERITY_CONFIG[severity].label}\n\n`;
        severityIssues.forEach(issue => {
          markdown += `#### ${issue.id}: ${issue.title}\n\n`;
          markdown += `**Heuristic:** ${issue.heuristic}\n\n`;
          markdown += `**Description:** ${issue.description}\n\n`;
          markdown += `**Impact:** ${issue.impact}\n\n`;
          markdown += `**How to Fix:** ${issue.howToFix}\n\n`;
          if (issue.referenceUrl) {
            markdown += `**Reference:** ${issue.referenceUrl}\n\n`;
          }
          markdown += `**Effort:** ${issue.effort}\n\n`;
          markdown += `---\n\n`;
        });
      }
    });
    
    markdown += `## Strengths\n\n`;
    results.strengths.forEach(strength => {
      markdown += `- **${strength.title}:** ${strength.description}\n`;
    });
    
    markdown += `\n## Quick Wins\n\n`;
    results.quickWins.forEach(win => {
      markdown += `- ${win}\n`;
    });

    // Copy to clipboard
    navigator.clipboard.writeText(markdown);
    alert('Report copied to clipboard as Markdown!');
  };

  const resetForm = () => {
    setView('input');
    setUploadedImage(null);
    setImagePreview(null);
    setUrlInput('');
    setFigmaInput('');
    setContextInput('');
    setPersonaInput('');
    setResults(null);
    setError(null);
    setExpandedIssues({});
  };

  // Render functions
  const renderInputPanel = () => (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-5xl sm:text-7xl font-bold mb-4 gradient-text">
            CritFull
          </h1>
          <p className="text-xl sm:text-2xl text-[var(--ibm-text-secondary)] mb-2">
            UX Design Critique & Review Tool
          </p>
          <p className="text-sm text-[var(--ibm-text-disabled)]">
            Powered by Claude AI • Carbon Design System • WCAG 2.2
          </p>
        </div>

        {/* API Key Section */}
        {showApiKeyInput && (
          <div className="mb-8 p-6 rounded-lg glass-effect animate-fadeIn">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🔑 Anthropic API Key Required
            </h3>
            <p className="text-sm text-[var(--ibm-text-secondary)] mb-4">
              Get your API key from{' '}
              <a 
                href="https://console.anthropic.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--ibm-blue)] hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-4 py-3 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-lg text-[var(--ibm-text-primary)] focus:outline-none focus:border-[var(--ibm-blue)]"
              />
              <button
                onClick={saveApiKey}
                className="px-6 py-3 bg-[var(--ibm-blue)] hover:bg-[var(--ibm-blue-hover)] text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Main Input Card */}
        <div className="bg-[var(--ibm-layer)] rounded-2xl p-6 sm:p-8 border border-[var(--ibm-border)] animate-fadeIn">
          {/* Input Type Selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setInputType('upload')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                inputType === 'upload'
                  ? 'bg-[var(--ibm-blue)] text-white'
                  : 'bg-[var(--ibm-layer-2)] text-[var(--ibm-text-secondary)] hover:bg-[var(--ibm-border)]'
              }`}
            >
              📸 Screenshot
            </button>
            <button
              onClick={() => setInputType('url')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                inputType === 'url'
                  ? 'bg-[var(--ibm-blue)] text-white'
                  : 'bg-[var(--ibm-layer-2)] text-[var(--ibm-text-secondary)] hover:bg-[var(--ibm-border)]'
              }`}
            >
              🔗 URL
            </button>
            <button
              onClick={() => setInputType('figma')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                inputType === 'figma'
                  ? 'bg-[var(--ibm-blue)] text-white'
                  : 'bg-[var(--ibm-layer-2)] text-[var(--ibm-text-secondary)] hover:bg-[var(--ibm-border)]'
              }`}
            >
              🎨 Figma
            </button>
          </div>

          {/* Upload Area */}
          {inputType === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[var(--ibm-blue)] bg-[var(--ibm-layer-2)]'
                  : 'border-[var(--ibm-border)] hover:border-[var(--ibm-text-disabled)]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg border border-[var(--ibm-border)]"
                  />
                  <p className="text-sm text-[var(--ibm-text-secondary)]">
                    {uploadedImage.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-5xl">📸</div>
                  <p className="text-lg font-medium">Drop your design here</p>
                  <p className="text-sm text-[var(--ibm-text-secondary)]">
                    or click to browse
                  </p>
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {inputType === 'url' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-[var(--ibm-layer-2)] border border-[var(--ibm-border)] rounded-lg text-[var(--ibm-text-primary)] focus:outline-none focus:border-[var(--ibm-blue)]"
              />
            </div>
          )}

          {/* Figma Input */}
          {inputType === 'figma' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Figma File URL
              </label>
              <input
                type="url"
                value={figmaInput}
                onChange={(e) => setFigmaInput(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full px-4 py-3 bg-[var(--ibm-layer-2)] border border-[var(--ibm-border)] rounded-lg text-[var(--ibm-text-primary)] focus:outline-none focus:border-[var(--ibm-blue)]"
              />
            </div>
          )}

          {/* Context Fields */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Design Context <span className="text-[var(--ibm-text-disabled)]">(Optional)</span>
              </label>
              <textarea
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="E.g., This is a checkout page for an e-commerce platform..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--ibm-layer-2)] border border-[var(--ibm-border)] rounded-lg text-[var(--ibm-text-primary)] focus:outline-none focus:border-[var(--ibm-blue)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Users / Personas <span className="text-[var(--ibm-text-disabled)]">(Optional)</span>
              </label>
              <input
                type="text"
                value={personaInput}
                onChange={(e) => setPersonaInput(e.target.value)}
                placeholder="E.g., Enterprise IT administrators, developers..."
                className="w-full px-4 py-3 bg-[var(--ibm-layer-2)] border border-[var(--ibm-border)] rounded-lg text-[var(--ibm-text-primary)] focus:outline-none focus:border-[var(--ibm-blue)]"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-[var(--ibm-support-error)] bg-opacity-10 border border-[var(--ibm-support-error)] rounded-lg text-[var(--ibm-support-error)] animate-fadeIn">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={runCritique}
            disabled={!apiKey}
            className="w-full mt-6 px-8 py-4 bg-[var(--ibm-blue)] hover:bg-[var(--ibm-blue-hover)] disabled:bg-[var(--ibm-text-disabled)] disabled:cursor-not-allowed text-white rounded-lg font-semibold text-lg transition-all hover-lift"
          >
            {apiKey ? '🚀 Run Critique' : '🔒 Enter API Key First'}
          </button>

          {!apiKey && (
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="w-full mt-3 px-8 py-3 bg-transparent border border-[var(--ibm-border)] hover:border-[var(--ibm-blue)] text-[var(--ibm-text-secondary)] hover:text-[var(--ibm-blue)] rounded-lg font-medium transition-all"
            >
              Configure API Key
            </button>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Recent Reviews
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setResults(item) || setView('results')}
                  className="p-4 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-lg cursor-pointer hover-lift"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl mono font-bold">{item.overallScore}</span>
                    <span className="text-2xl">{getLetterGrade(item.overallScore)}</span>
                  </div>
                  <p className="text-sm text-[var(--ibm-text-secondary)] truncate">
                    {item.designTitle}
                  </p>
                  <p className="text-xs text-[var(--ibm-text-disabled)] mt-1">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLoadingPanel = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8 animate-pulse">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold mb-2">Analyzing Your Design</h2>
          <p className="text-lg text-[var(--ibm-text-secondary)] animate-fadeIn">
            {loadingMessage}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[var(--ibm-layer)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--ibm-blue)] to-[var(--ibm-support-info)] transition-all duration-500"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-[var(--ibm-text-disabled)] mono">
          {Math.round(loadingProgress)}%
        </p>
      </div>
    </div>
  );

  const renderResultsPanel = () => {
    if (!results) return null;

    const issuesBySeverity = {
      critical: results.issues.filter(i => i.severity === 'critical'),
      high: results.issues.filter(i => i.severity === 'high'),
      medium: results.issues.filter(i => i.severity === 'medium'),
      low: results.issues.filter(i => i.severity === 'low')
    };

    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] hover:border-[var(--ibm-blue)] rounded-lg text-[var(--ibm-text-secondary)] hover:text-[var(--ibm-blue)] transition-all"
            >
              ← New Review
            </button>
            <div className="flex gap-2">
              <button
                onClick={exportAsMarkdown}
                className="px-4 py-2 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] hover:border-[var(--ibm-blue)] rounded-lg text-[var(--ibm-text-secondary)] hover:text-[var(--ibm-blue)] transition-all"
              >
                📋 Copy as Markdown
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] hover:border-[var(--ibm-blue)] rounded-lg text-[var(--ibm-text-secondary)] hover:text-[var(--ibm-blue)] transition-all no-print"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-block mb-6">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="var(--ibm-layer-2)"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="var(--ibm-blue)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - results.overallScore / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-6xl font-bold mono">{results.overallScore}</div>
                    <div className="text-2xl text-[var(--ibm-text-secondary)]">
                      {getLetterGrade(results.overallScore)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {results.designTitle}
            </h1>
            
            <div className="inline-block px-6 py-3 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-full mb-4">
              <span className="text-lg">🎭 {results.designPersonality}</span>
            </div>

            <p className="text-xl italic text-[var(--ibm-text-secondary)] max-w-3xl mx-auto mb-6">
              "{results.funVerdict}"
            </p>

            <p className="text-lg text-[var(--ibm-text-secondary)] max-w-3xl mx-auto">
              {results.summary}
            </p>
          </div>

          {/* Score Breakdown Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">📊 Score Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(results.scores).map(([key, data]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                return (
                  <div
                    key={key}
                    className="p-6 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-xl hover-lift animate-fadeIn"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{data.emoji}</span>
                      <span className="text-3xl font-bold mono">{data.score}</span>
                    </div>
                    <div className="mb-3">
                      <div className="h-2 bg-[var(--ibm-layer-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--ibm-blue)] transition-all duration-1000"
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-medium capitalize">{label}</p>
                    <p className="text-2xl font-bold mono text-[var(--ibm-text-secondary)]">
                      {data.grade}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Wins */}
          {results.quickWins && results.quickWins.length > 0 && (
            <div className="mb-12 p-6 bg-gradient-to-r from-[var(--ibm-support-success)] to-[var(--ibm-support-info)] bg-opacity-10 border border-[var(--ibm-support-success)] rounded-xl animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                ⚡ Quick Wins <span className="text-sm font-normal text-[var(--ibm-text-secondary)]">(Fix in 30 minutes)</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {results.quickWins.map((win, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-full text-sm"
                  >
                    {win}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues List */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">🔧 Fix It Board</h2>
            
            {['critical', 'high', 'medium', 'low'].map(severity => {
              const issues = issuesBySeverity[severity];
              if (issues.length === 0) return null;

              return (
                <div key={severity} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{SEVERITY_CONFIG[severity].icon}</span>
                    <h3 className="text-xl font-bold">
                      {SEVERITY_CONFIG[severity].label}
                    </h3>
                    <span className="px-3 py-1 bg-[var(--ibm-layer)] rounded-full text-sm">
                      {issues.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {issues.map(issue => (
                      <div
                        key={issue.id}
                        className="p-6 bg-[var(--ibm-layer)] border border-[var(--ibm-border)] rounded-xl hover-lift animate-fadeIn"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-[var(--ibm-layer-2)] rounded-full text-xs mono font-bold">
                                {issue.id}
                              </span>
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${EFFORT_CONFIG[issue.effort].color}20`,
                                  color: EFFORT_CONFIG[issue.effort].color
                                }}
                              >
                                {EFFORT_CONFIG[issue.effort].label}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold mb-2">{issue.title}</h4>
                            <p className="text-sm text-[var(--ibm-text-secondary)] mb-2">
                              <strong>Heuristic:</strong> {issue.heuristic}
                            </p>
                          </div>
                        </div>

                        <p className="text-[var(--ibm-text-secondary)] mb-3">
                          {issue.description}
                        </p>

                        <div className="p-4 bg-[var(--ibm-layer-2)] rounded-lg mb-3">
                          <p className="text-sm">
                            <strong className="text-[var(--ibm-support-error)]">Impact:</strong>{' '}
                            {issue.impact}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleIssue(issue.id)}
                          className="w-full px-4 py-2 bg-[var(--ibm-layer-2)] hover:bg-[var(--ibm-border)] rounded-lg text-left transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium">How to Fix</span>
                          <span>{expandedIssues[issue.id] ? '▼' : '▶'}</span>
                        </button>

                        {expandedIssues[issue.id] && (
                          <div className="mt-3 p-4 bg-[var(--ibm-support-success)] bg-opacity-10 border border-[var(--ibm-support-success)] rounded-lg animate-fadeIn">
                            <p className="text-sm mb-3">{issue.howToFix}</p>
                            {issue.referenceUrl && (
                              <a
                                href={issue.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--ibm-blue)] hover:underline flex items-center gap-1"
                              >
                                📚 Reference Documentation →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strengths */}
          {results.strengths && results.strengths.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                ✨ Strengths
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.strengths.map((strength, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-[var(--ibm-support-success)] bg-opacity-10 border border-[var(--ibm-support-success)] rounded-xl animate-fadeIn"
                  >
                    <h4 className="text-lg font-semibold mb-2">{strength.title}</h4>
                    <p className="text-[var(--ibm-text-secondary)]">{strength.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--ibm-background)] text-[var(--ibm-text-primary)]">
      {view === 'input' && renderInputPanel()}
      {view === 'loading' && renderLoadingPanel()}
      {view === 'results' && renderResultsPanel()}
    </div>
  );
}

export default App;

// Made with Bob
