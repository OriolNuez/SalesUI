import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import {
  getCadenceTemplates, createCadenceTemplate, updateCadenceTemplate, deleteCadenceTemplate,
  getEnrollments, createEnrollment, updateEnrollmentStatus, completeStep, skipStep, deleteEnrollment,
  getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate,
  getCadenceStats, getAccounts, getActivities
} from '../api'

export default function Cadences() {
  const [activeTab, setActiveTab] = useState('templates') // templates | enrollments | email-templates
  const [templates, setTemplates] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [emailTemplates, setEmailTemplates] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  
  // Selected items
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null)
  
  // Forms
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    campaignId: null,
    isActive: true,
    steps: []
  })
  
  const [stepForm, setStepForm] = useState({
    day: 1,
    type: 'email', // email, call, linkedin
    title: '',
    description: '',
    emailTemplateId: null,
    linkedInMessage: ''
  })
  
  const [enrollForm, setEnrollForm] = useState({
    templateId: '',
    accountId: '',
    accountName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactLinkedIn: '',
    notes: ''
  })
  
  const [emailTemplateForm, setEmailTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    variables: []
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [templatesRes, enrollmentsRes, emailTemplatesRes, statsRes] = await Promise.all([
        getCadenceTemplates(),
        getEnrollments(),
        getEmailTemplates(),
        getCadenceStats()
      ])
      setTemplates(templatesRes.data)
      setEnrollments(enrollmentsRes.data)
      setEmailTemplates(emailTemplatesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error loading cadences data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    try {
      await createCadenceTemplate(templateForm)
      setShowTemplateModal(false)
      resetTemplateForm()
      loadData()
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    }
  }

  const handleUpdateTemplate = async (e) => {
    e.preventDefault()
    try {
      await updateCadenceTemplate(selectedTemplate.id, templateForm)
      setShowTemplateModal(false)
      setSelectedTemplate(null)
      resetTemplateForm()
      loadData()
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this cadence template?')) return
    try {
      await deleteCadenceTemplate(id)
      loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const openEditTemplate = (template) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description,
      campaignId: template.campaignId,
      isActive: template.isActive,
      steps: template.steps
    })
    setShowTemplateModal(true)
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      campaignId: null,
      isActive: true,
      steps: []
    })
    setSelectedTemplate(null)
  }

  const addStepToTemplate = () => {
    const newStep = {
      id: Date.now().toString(),
      ...stepForm
    }
    setTemplateForm(prev => ({
      ...prev,
      steps: [...prev.steps, newStep].sort((a, b) => a.day - b.day)
    }))
    setStepForm({
      day: 1,
      type: 'email',
      title: '',
      description: '',
      emailTemplateId: null,
      linkedInMessage: ''
    })
    setShowStepModal(false)
  }

  const removeStepFromTemplate = (stepId) => {
    setTemplateForm(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENROLLMENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCreateEnrollment = async (e) => {
    e.preventDefault()
    try {
      await createEnrollment(enrollForm)
      setShowEnrollModal(false)
      resetEnrollForm()
      loadData()
    } catch (error) {
      console.error('Error creating enrollment:', error)
      alert('Failed to enroll contact')
    }
  }

  const handleUpdateEnrollmentStatus = async (id, status) => {
    try {
      await updateEnrollmentStatus(id, status)
      loadData()
    } catch (error) {
      console.error('Error updating enrollment status:', error)
      alert('Failed to update enrollment status')
    }
  }

  const handleCompleteStep = async (enrollmentId, stepIndex) => {
    const activityId = prompt('Enter Activity ID (optional):')
    const notes = prompt('Add notes (optional):')
    try {
      await completeStep(enrollmentId, stepIndex, { activityId, notes })
      loadData()
    } catch (error) {
      console.error('Error completing step:', error)
      alert('Failed to complete step')
    }
  }

  const handleSkipStep = async (enrollmentId, stepIndex) => {
    const reason = prompt('Reason for skipping:')
    if (!reason) return
    try {
      await skipStep(enrollmentId, stepIndex, reason)
      loadData()
    } catch (error) {
      console.error('Error skipping step:', error)
      alert('Failed to skip step')
    }
  }

  const handleDeleteEnrollment = async (id) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return
    try {
      await deleteEnrollment(id)
      loadData()
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      alert('Failed to delete enrollment')
    }
  }

  const resetEnrollForm = () => {
    setEnrollForm({
      templateId: '',
      accountId: '',
      accountName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactLinkedIn: '',
      notes: ''
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL TEMPLATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCreateEmailTemplate = async (e) => {
    e.preventDefault()
    try {
      await createEmailTemplate(emailTemplateForm)
      setShowEmailTemplateModal(false)
      resetEmailTemplateForm()
      loadData()
    } catch (error) {
      console.error('Error creating email template:', error)
      alert('Failed to create email template')
    }
  }

  const handleUpdateEmailTemplate = async (e) => {
    e.preventDefault()
    try {
      await updateEmailTemplate(selectedEmailTemplate.id, emailTemplateForm)
      setShowEmailTemplateModal(false)
      setSelectedEmailTemplate(null)
      resetEmailTemplateForm()
      loadData()
    } catch (error) {
      console.error('Error updating email template:', error)
      alert('Failed to update email template')
    }
  }

  const handleDeleteEmailTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this email template?')) return
    try {
      await deleteEmailTemplate(id)
      loadData()
    } catch (error) {
      console.error('Error deleting email template:', error)
      alert('Failed to delete email template')
    }
  }

  const openEditEmailTemplate = (template) => {
    setSelectedEmailTemplate(template)
    setEmailTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables
    })
    setShowEmailTemplateModal(true)
  }

  const resetEmailTemplateForm = () => {
    setEmailTemplateForm({
      name: '',
      subject: '',
      body: '',
      variables: []
    })
    setSelectedEmailTemplate(null)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getStepIcon = (type) => {
    switch (type) {
      case 'email':
        return '📧'
      case 'call':
        return '📞'
      case 'linkedin':
        return '💼'
      default:
        return '📝'
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-gray-100 text-gray-600',
      skipped: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Cadences</h1>
          <p className="text-gray-500 text-sm mt-1">Manage multi-step outreach sequences</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'templates' && (
            <button onClick={() => setShowTemplateModal(true)} className="btn-gold">
              + New Cadence Template
            </button>
          )}
          {activeTab === 'enrollments' && (
            <button onClick={() => setShowEnrollModal(true)} className="btn-gold">
              + Enroll Contact
            </button>
          )}
          {activeTab === 'email-templates' && (
            <button onClick={() => setShowEmailTemplateModal(true)} className="btn-gold">
              + New Email Template
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">Active Enrollments</div>
            <div className="text-3xl font-bold text-navy-900 mt-1">{stats.activeEnrollments}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{stats.completedEnrollments}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Total Templates</div>
            <div className="text-3xl font-bold text-navy-900 mt-1">{stats.totalTemplates}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="text-3xl font-bold text-navy-900 mt-1">
              {stats.totalEnrollments > 0 
                ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100) 
                : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['templates', 'enrollments', 'email-templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <>
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-400">No cadence templates yet. Create your first one!</p>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-navy-900">{template.name}</h3>
                          {getStatusBadge(template.isActive ? 'active' : 'paused')}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        
                        {/* Journey Map */}
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Journey Map ({template.steps.length} steps)</div>
                          <div className="flex flex-wrap gap-2">
                            {template.steps.map((step, idx) => (
                              <div key={step.id} className="flex items-center">
                                <div className="bg-navy-50 border border-navy-200 rounded-lg px-3 py-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{getStepIcon(step.type)}</span>
                                    <span className="font-medium">Day {step.day}</span>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">{step.title}</div>
                                </div>
                                {idx < template.steps.length - 1 && (
                                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => openEditTemplate(template)} className="btn-secondary text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteTemplate(template.id)} className="btn-secondary text-sm text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <div className="space-y-4">
              {enrollments.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-400">No enrollments yet. Enroll your first contact!</p>
                </div>
              ) : (
                enrollments.map(enrollment => (
                  <div key={enrollment.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-navy-900">{enrollment.contactName}</h3>
                          {getStatusBadge(enrollment.status)}
                        </div>
                        <p className="text-sm text-gray-600">{enrollment.accountName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Template: {enrollment.templateName} • Enrolled: {dayjs(enrollment.enrolledAt).format('MMM D, YYYY')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {enrollment.status === 'active' && (
                          <button onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'paused')} className="btn-secondary text-sm">
                            Pause
                          </button>
                        )}
                        {enrollment.status === 'paused' && (
                          <button onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'active')} className="btn-secondary text-sm">
                            Resume
                          </button>
                        )}
                        <button onClick={() => handleDeleteEnrollment(enrollment.id)} className="btn-secondary text-sm text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-2">
                      {enrollment.stepExecutions.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{getStepIcon(step.stepType)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Day {step.stepDay}</span>
                              {getStatusBadge(step.status)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Scheduled: {dayjs(step.scheduledDate).format('MMM D, YYYY')}
                            </div>
                            {step.completedAt && (
                              <div className="text-xs text-gray-500">
                                Completed: {dayjs(step.completedAt).format('MMM D, YYYY HH:mm')}
                              </div>
                            )}
                          </div>
                          {step.status === 'pending' && enrollment.status === 'active' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleCompleteStep(enrollment.id, idx)}
                                className="btn-secondary text-xs"
                              >
                                Complete
                              </button>
                              <button 
                                onClick={() => handleSkipStep(enrollment.id, idx)}
                                className="btn-secondary text-xs"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === 'email-templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailTemplates.length === 0 ? (
                <div className="col-span-2 card text-center py-12">
                  <p className="text-gray-400">No email templates yet. Create your first one!</p>
                </div>
              ) : (
                emailTemplates.map(template => (
                  <div key={template.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-navy-900">{template.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => openEditEmailTemplate(template)} className="btn-secondary text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteEmailTemplate(template.id)} className="btn-secondary text-sm text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      {template.body}
                    </div>
                    {template.variables.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Variables: {template.variables.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }}>
          <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{selectedTemplate ? 'Edit' : 'Create'} Cadence Template</h2>
            <form onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              <div>
                <label className="form-label">Template Name *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={e => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={e => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Steps</label>
                  <button type="button" onClick={() => setShowStepModal(true)} className="btn-secondary text-sm">
                    + Add Step
                  </button>
                </div>
                
                {templateForm.steps.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No steps added yet</p>
                ) : (
                  <div className="space-y-2">
                    {templateForm.steps.map(step => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{getStepIcon(step.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Day {step.day}: {step.title}</div>
                          <div className="text-xs text-gray-600">{step.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStepFromTemplate(step.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  {selectedTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="modal-overlay" onClick={() => setShowStepModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Step</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Day *</label>
                <input
                  type="number"
                  min="1"
                  value={stepForm.day}
                  onChange={e => setStepForm(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Type *</label>
                <select
                  value={stepForm.type}
                  onChange={e => setStepForm(prev => ({ ...prev, type: e.target.value }))}
                  className="form-input"
                >
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={stepForm.title}
                  onChange={e => setStepForm(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={stepForm.description}
                  onChange={e => setStepForm(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  rows={3}
                />
              </div>

              {stepForm.type === 'email' && (
                <div>
                  <label className="form-label">Email Template</label>
                  <select
                    value={stepForm.emailTemplateId || ''}
                    onChange={e => setStepForm(prev => ({ ...prev, emailTemplateId: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Select template...</option>
                    {emailTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {stepForm.type === 'linkedin' && (
                <div>
                  <label className="form-label">LinkedIn Message</label>
                  <textarea
                    value={stepForm.linkedInMessage}
                    onChange={e => setStepForm(prev => ({ ...prev, linkedInMessage: e.target.value }))}
                    className="form-input"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowStepModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="button" onClick={addStepToTemplate} className="btn-gold">
                  Add Step
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => { setShowEnrollModal(false); resetEnrollForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Enroll Contact in Cadence</h2>
            <form onSubmit={handleCreateEnrollment} className="space-y-4">
              <div>
                <label className="form-label">Cadence Template *</label>
                <select
                  value={enrollForm.templateId}
                  onChange={e => setEnrollForm(prev => ({ ...prev, templateId: e.target.value }))}
                  className="form-input"
                  required
                >
                  <option value="">Select template...</option>
                  {templates.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Account Name *</label>
                <input
                  type="text"
                  value={enrollForm.accountName}
                  onChange={e => setEnrollForm(prev => ({ ...prev, accountName: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Contact Name *</label>
                <input
                  type="text"
                  value={enrollForm.contactName}
                  onChange={e => setEnrollForm(prev => ({ ...prev, contactName: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  value={enrollForm.contactEmail}
                  onChange={e => setEnrollForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  value={enrollForm.contactPhone}
                  onChange={e => setEnrollForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">LinkedIn URL</label>
                <input
                  type="url"
                  value={enrollForm.contactLinkedIn}
                  onChange={e => setEnrollForm(prev => ({ ...prev, contactLinkedIn: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={enrollForm.notes}
                  onChange={e => setEnrollForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => { setShowEnrollModal(false); resetEnrollForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  Enroll Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {showEmailTemplateModal && (
        <div className="modal-overlay" onClick={() => { setShowEmailTemplateModal(false); resetEmailTemplateForm(); }}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{selectedEmailTemplate ? 'Edit' : 'Create'} Email Template</h2>
            <form onSubmit={selectedEmailTemplate ? handleUpdateEmailTemplate : handleCreateEmailTemplate} className="space-y-4">
              <div>
                <label className="form-label">Template Name *</label>
                <input
                  type="text"
                  value={emailTemplateForm.name}
                  onChange={e => setEmailTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Subject Line *</label>
                <input
                  type="text"
                  value={emailTemplateForm.subject}
                  onChange={e => setEmailTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Body *</label>
                <textarea
                  value={emailTemplateForm.body}
                  onChange={e => setEmailTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                  className="form-input"
                  rows={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables like {'{{contactName}}'}, {'{{accountName}}'}, {'{{companyName}}'}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => { setShowEmailTemplateModal(false); resetEmailTemplateForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-gold">
                  {selectedEmailTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob