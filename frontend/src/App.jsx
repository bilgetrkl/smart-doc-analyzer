import React, { useState, useRef, useEffect } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

function App() {
  // File & chat state
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([]) // [{type: 'question'|'answer'|'error', text: '...'}]
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationActive, setConversationActive] = useState(false)

  // Feedback state (shown only after ending conversation)
  const [showFeedbackBox, setShowFeedbackBox] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('neutral')
  const [showPopup, setShowPopup] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setMessages([])
      setConversationActive(false)
      setShowFeedbackBox(false)
    } else {
      setMessages([{ type: 'error', text: 'Please select a valid PDF file.' }])
    }
  }

  const startConversation = () => {
    if (!file) {
      setMessages([{ type: 'error', text: 'Please upload a PDF file first.' }])
      return
    }
    setConversationActive(true)
    setMessages([])
    setShowFeedbackBox(false)
  }

  const endConversation = () => {
    setConversationActive(false)
    setShowFeedbackBox(true)
  }

  const handleQuestionSubmit = async (e) => {
    e.preventDefault()

    if (!question.trim()) return

    setMessages((prev) => [...prev, { type: 'question', text: question }])
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('question', question)

    try {
      const response = await fetch(`${API_BASE_URL}/qa/ask-pdf`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server Error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.answer) {
        setMessages((prev) => [...prev, { type: 'answer', text: data.answer }])
      } else if (data.error) {
        setMessages((prev) => [...prev, { type: 'error', text: data.error }])
      } else {
        setMessages((prev) => [
          ...prev,
          { type: 'error', text: 'Unexpected response from server.' }
        ])
      }
    } catch (error) {
      console.error('Request Error:', error)
      setMessages((prev) => [...prev, { type: 'error', text: error.message }])
    } finally {
      setLoading(false)
      setQuestion('')
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()

    if (!feedbackText.trim()) {
      setFeedbackError('Please enter your feedback before submitting.')
      return
    }

    setFeedbackLoading(true)
    setFeedbackError('')
    setAnalysisResult(null)
    setShowPopup(false)

    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: feedbackText })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server Error: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalysisResult(data)

      const sentimentLabel = data?.sentiment?.label || ''
      const sentimentScore = data?.sentiment?.score ?? 0
      const helpfulLabel = data?.helpfulness?.label || ''
      const helpfulScore = data?.helpfulness?.score ?? 0

      let message = 'Thank you for your feedback.'
      let type = 'neutral'

      const isClearlyPositive =
        sentimentLabel.toLowerCase().includes('positive') &&
        sentimentScore >= 0.6 &&
        (helpfulLabel === 'helpful' || helpfulLabel === 'creative') &&
        helpfulScore >= 0.6

      const isClearlyNegative =
        sentimentLabel.toLowerCase().includes('negative') ||
        helpfulLabel === 'unhelpful'

      if (isClearlyPositive) {
        message = "Thank you for your feedback — we're glad the answer was helpful!"
        type = 'positive'
      } else if (isClearlyNegative) {
        message =
          "Thanks for your feedback — we'll work to improve future answers."
        type = 'negative'
      } else {
        message = "Thank you for your feedback. We'll use it to improve the system."
        type = 'neutral'
      }

      setPopupMessage(message)
      setPopupType(type)
      setShowPopup(true)
    } catch (error) {
      console.error('Feedback Error:', error)
      setFeedbackError(`An error occurred while analyzing feedback: ${error.message}`)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const renderSentimentRanking = () => {
    if (!analysisResult?.sentiment) return null

    const label = analysisResult.sentiment.label || ''
    const score = analysisResult.sentiment.score ?? 0

    let positive = 0
    let negative = 0
    if (label.toLowerCase().includes('positive')) {
      positive = score
      negative = 1 - score
    } else if (label.toLowerCase().includes('negative')) {
      negative = score
      positive = 1 - score
    } else {
      positive = score
      negative = 1 - score
    }

    const positivePct = Math.round(positive * 100)
    const negativePct = 100 - positivePct

    return (
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '8px', color: '#2c3e50' }}>Sentiment Polarity</h4>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7f8c8d' }}>
          Overall sentiment classified as <strong>{label}</strong>.
        </p>
        <div style={{ marginBottom: '6px', fontSize: '14px' }}>
          Positive: <strong>{positivePct}%</strong> &nbsp;|&nbsp; Negative:{' '}
          <strong>{negativePct}%</strong>
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          borderRadius: '999px',
          backgroundColor: '#ecf0f1',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <div
            style={{
              width: `${positivePct}%`,
              backgroundColor: '#2ecc71',
              transition: 'width 0.4s ease'
            }}
          />
          <div
            style={{
              width: `${negativePct}%`,
              backgroundColor: '#e74c3c',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>
    )
  }

  const renderHelpfulnessRanking = () => {
    if (!analysisResult?.helpfulness) return null

    const label = analysisResult.helpfulness.label || ''
    const score = analysisResult.helpfulness.score ?? 0
    const pct = Math.round(score * 100)

    return (
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '8px', color: '#2c3e50' }}>Helpfulness / Creativity</h4>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7f8c8d' }}>
          Classified as <strong>{label}</strong> with confidence <strong>{pct}%</strong>.
        </p>
        <div style={{ marginBottom: '6px', fontSize: '14px' }}>
          {['helpful', 'creative', 'unhelpful'].map((cat) => (
            <span key={cat} style={{ marginRight: '12px' }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}:{' '}
              <strong>{cat === label ? `${pct}%` : '—'}</strong>
            </span>
          ))}
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          borderRadius: '999px',
          backgroundColor: '#ecf0f1',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: `${pct}%`,
              backgroundColor:
                label === 'helpful'
                  ? '#3498db'
                  : label === 'creative'
                  ? '#9b59b6'
                  : '#e67e22',
              height: '100%',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>
    )
  }

  const renderPopup = () => {
    if (!showPopup || !popupMessage) return null

    let bg = '#f0f3f4'
    let border = '#bdc3c7'

    if (popupType === 'positive') {
      bg = '#e8f8f5'
      border = '#1abc9c'
    } else if (popupType === 'negative') {
      bg = '#fdeded'
      border = '#e74c3c'
    }

    return (
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '10px',
          border: `1px solid ${border}`,
          backgroundColor: bg,
          color: '#2c3e50',
          fontSize: '14px'
        }}
      >
        {popupMessage}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#dadadaff', padding: '20px' }}>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(255,182,193,0.08)',
          border: '1px solid #f8f0f0'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '10px'
            }}
          >
            Smart Document Analyzer
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '18px' }}>
            Upload your PDF, chat with AI, and provide feedback at the end.
          </p>
        </div>

        {/* File Upload Section */}
        {!conversationActive && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333'
              }}
            >
              Upload your PDF file
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #f0d0d0',
                borderRadius: '8px',
                backgroundColor: '#fefafa',
                cursor: 'pointer'
              }}
            />
            {file && (
              <p style={{ marginTop: '8px', color: '#28a745', fontSize: '14px' }}>
                ✅ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            
            {file && (
              <button
                onClick={startConversation}
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Start Conversation
              </button>
            )}
          </div>
        )}

        {/* Chat Area */}
        {conversationActive && (
          <div>
            {/* Chat Messages */}
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '10px',
                border: '1px solid #e1e4e8'
              }}
            >
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
                  Start asking questions about your document...
                </p>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '15px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor:
                      msg.type === 'question'
                        ? '#e3f2fd'
                        : msg.type === 'answer'
                        ? '#e8f5e9'
                        : '#ffebee',
                    textAlign: msg.type === 'question' ? 'right' : 'left'
                  }}
                >
                  <strong style={{ color: '#2c3e50', fontSize: '14px' }}>
                    {msg.type === 'question' ? 'You' : msg.type === 'answer' ? 'AI' : 'Error'}:
                  </strong>
                  <p style={{ margin: '5px 0 0', color: '#34495e', fontSize: '15px' }}>
                    {msg.text}
                  </p>
                </div>
              ))}
              
              <div ref={chatEndRef} />
            </div>

            {/* Question Input Form */}
            <form onSubmit={handleQuestionSubmit} style={{ marginBottom: '15px' }}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  // Submit on Enter, allow Shift+Enter for new line
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!loading && question.trim()) {
                      handleQuestionSubmit(e)
                    }
                  }
                }}
                placeholder="Type your question here..."
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: loading ? '#bdc3c7' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Thinking...' : 'Send Question'}
                </button>
                
                <button
                  type="button"
                  onClick={endConversation}
                  disabled={loading}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  End Conversation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback Section (Only after ending conversation) */}
        {showFeedbackBox && (
          <div
            style={{
              marginTop: '30px',
              padding: '25px',
              borderRadius: '12px',
              border: '2px solid #3498db',
              backgroundColor: '#f8fbfd'
            }}
          >
            <h3 style={{ marginBottom: '10px', color: '#2c3e50', fontSize: '22px' }}>
              Rate Your Experience
            </h3>
            <p style={{ marginTop: 0, marginBottom: '15px', color: '#7f8c8d', fontSize: '14px' }}>
              Please share your overall feedback about the conversation. We'll analyze it for
              sentiment and helpfulness.
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontSize: '15px',
                  marginBottom: '12px'
                }}
              />

              <button
                type="submit"
                disabled={feedbackLoading || !feedbackText.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: feedbackLoading ? '#bdc3c7' : '#2980b9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: feedbackLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {feedbackLoading ? 'Analyzing feedback...' : 'Submit Feedback'}
              </button>
            </form>

            {feedbackError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  color: '#721c24',
                  fontSize: '14px'
                }}
              >
                ❌ {feedbackError}
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div style={{ marginTop: '20px' }}>
                {renderSentimentRanking()}
                {renderHelpfulnessRanking()}
                {renderPopup()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
