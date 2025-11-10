import React, { useState } from 'react'

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
        
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px'}}>
            Smart Document Analyzer
          </h1>
          <p style={{color: '#7f8c8d', fontSize: '18px'}}>
            Upload your PDF documents and get answers to your questions using AI.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{marginBottom: '30px'}}>
          
          {/* File Upload */}
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

          {/* Question Input */}
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

        {/* Answer */}
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

export default App
