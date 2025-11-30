/*import React, { useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

function App() {
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid PDF file.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file || !question.trim()) {
      setError('Please provide both a PDF file and a question.')
      return
    }

    setLoading(true)
    setError('')
    setAnswer('')

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
        throw new Error(errorData.detail || `Sunucu Hatası: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.answer) {
        setAnswer(data.answer)
      } else if (data.error) {
        setError(`Error: ${data.error}`)
      } else {
        setError('The expected response was not received from the API.')
      }

    } catch (error) {
      console.error('Request Error:', error)
      setError(`An error occurred: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#dadadaff', padding: '20px'}}>
      <div style={{maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 15px rgba(255,182,193,0.08)', border: '1px solid #f8f0f0'}}>
        
        {/* Header /}
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px'}}>
            Smart Document Analyzer
          </h1>
          <p style={{color: '#7f8c8d', fontSize: '18px'}}>
            Upload your PDF documents and get answers to your questions using AI.
          </p>
        </div>

        {/* Form /}
        <form onSubmit={handleSubmit} style={{marginBottom: '30px'}}>
          
          {/* File Upload /}
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '10px', fontSize: '16px', fontWeight: '600', color: '#333'}}>
              Upload Your PDF File
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
              <p style={{marginTop: '8px', color: '#28a745', fontSize: '14px'}}>
                ✅ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Question Input /}
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '10px', fontSize: '16px', fontWeight: '600', color: '#333'}}>
              Sorunuzu Yazın
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: What is the main topic of this document?"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                minHeight: '100px',
                resize: 'vertical',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Submit Button /}
          <button
            type="submit"
            disabled={loading || !file || !question.trim()}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#bdc3c7' : '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Thinking...' : 'Ask Question'}
          </button>
        </form>

        {/* Error Message /}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            color: '#721c24',
            marginBottom: '20px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Answer /}
        {answer && (
          <div style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{color: '#155724', marginBottom: '10px', fontSize: '18px'}}>
              💡 Cevap:
            </h3>
            <p style={{color: '#155724', fontSize: '16px', lineHeight: '1.6', margin: 0}}>
              {answer}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default App */
import React, { useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

function App() {
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Feedback & sentiment-related state
  const [showFeedbackBox, setShowFeedbackBox] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null) // { sentiment: {...}, helpfulness: {...} }

  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('neutral') // 'positive' | 'negative' | 'neutral'
  const [showPopup, setShowPopup] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid PDF file.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file || !question.trim()) {
      setError('Please provide both a PDF file and a question.')
      return
    }

    setLoading(true)
    setError('')
    setAnswer('')
    setShowFeedbackBox(false)
    setFeedbackText('')
    setAnalysisResult(null)
    setFeedbackError('')
    setShowPopup(false)

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
        setAnswer(data.answer)
        setShowFeedbackBox(true)
      } else if (data.error) {
        setError(`Error: ${data.error}`)
      } else {
        setError('The expected response was not received from the API.')
      }

    } catch (error) {
      console.error('Request Error:', error)
      setError(`An error occurred: ${error.message}`)
    } finally {
      setLoading(false)
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

      // Decide popup message based on sentiment & helpfulness
      const sentimentLabel = data?.sentiment?.label || ''
      const sentimentScore = data?.sentiment?.score ?? 0
      const helpfulLabel = data?.helpfulness?.label || ''
      const helpfulScore = data?.helpfulness?.score ?? 0

      let message = "Thank you for your feedback."
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
        message = "Thanks for your feedback — we'll pay closer attention and work to improve future answers."
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

  // Helpers for rendering ranking bars
  const renderSentimentRanking = () => {
    if (!analysisResult?.sentiment) return null

    const label = analysisResult.sentiment.label || ''
    const score = analysisResult.sentiment.score ?? 0

    // We assume `score` is the probability of the predicted label.
    // If label is Positive: positive = score, negative = 1 - score
    // If label is Negative: negative = score, positive = 1 - score
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
          maxWidth: '800px',
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
            Upload your PDF document, ask a question, and evaluate the answer with smart feedback.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          {/* File Upload */}
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
          </div>

          {/* Question Input */}
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
              Ask your question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: What is the main topic of this document?"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                minHeight: '100px',
                resize: 'vertical',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file || !question.trim()}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#bdc3c7' : '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Thinking...' : 'Ask Question'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              color: '#721c24',
              marginBottom: '20px'
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Answer */}
        {answer && (
          <div
            style={{
              padding: '20px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ color: '#155724', marginBottom: '10px', fontSize: '18px' }}>
              💡 Answer:
            </h3>
            <p
              style={{
                color: '#155724',
                fontSize: '16px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}
            >
              {answer}
            </p>
          </div>
        )}

        {/* Feedback Box */}
        {showFeedbackBox && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e1e4e8',
              backgroundColor: '#fdfdfd'
            }}
          >
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Rate this answer</h3>
            <p style={{ marginTop: 0, marginBottom: '10px', color: '#7f8c8d', fontSize: '14px' }}>
              Please share your feedback about the generated answer. We will analyze it for sentiment
              and helpfulness.
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback here..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              />

              <button
                type="submit"
                disabled={feedbackLoading || !feedbackText.trim()}
                style={{
                  padding: '10px 18px',
                  backgroundColor: feedbackLoading ? '#bdc3c7' : '#2980b9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: feedbackLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {feedbackLoading ? 'Analyzing feedback...' : 'Analyze feedback'}
              </button>
            </form>

            {feedbackError && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  color: '#721c24',
                  fontSize: '13px'
                }}
              >
                ❌ {feedbackError}
              </div>
            )}

            {/* Ranking visualizations */}
            {analysisResult && (
              <div style={{ marginTop: '15px' }}>
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
