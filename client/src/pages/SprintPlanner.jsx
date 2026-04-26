import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts, createAccount, createActivity } from '../api'
import dayjs from 'dayjs'

export default function SprintPlanner() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Load from localStorage or use defaults
  const [sprintDate, setSprintDate] = useState(() => {
    const saved = localStorage.getItem('sprintPlanner_date')
    return saved || dayjs().format('YYYY-MM-DD')
  })
  
  const [sprintAccounts, setSprintAccounts] = useState(() => {
    const saved = localStorage.getItem('sprintPlanner_accounts')
    return saved ? JSON.parse(saved) : []
  })
  
  // Current account being built
  const [currentAccount, setCurrentAccount] = useState(() => {
    const saved = localStorage.getItem('sprintPlanner_currentAccount')
    return saved ? JSON.parse(saved) : null
  })
  
  const [currentContacts, setCurrentContacts] = useState(() => {
    const saved = localStorage.getItem('sprintPlanner_currentContacts')
    return saved ? JSON.parse(saved) : []
  })
  
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  
  // New account form
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    industry: '',
    website: ''
  })
  
  // New contact form
  const [newContact, setNewContact] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    notes: ''
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('sprintPlanner_date', sprintDate)
  }, [sprintDate])

  useEffect(() => {
    localStorage.setItem('sprintPlanner_accounts', JSON.stringify(sprintAccounts))
  }, [sprintAccounts])

  useEffect(() => {
    localStorage.setItem('sprintPlanner_currentAccount', JSON.stringify(currentAccount))
  }, [currentAccount])

  useEffect(() => {
    localStorage.setItem('sprintPlanner_currentContacts', JSON.stringify(currentContacts))
  }, [currentContacts])

  const loadAccounts = async () => {
    try {
      const response = await getAccounts()
      // The API returns accounts directly in response.data, not response.data.data
      setAccounts(response.data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const handleSelectAccount = (account) => {
    setCurrentAccount(account)
    setCurrentContacts([])
    setShowAccountSelector(false)
  }

  const handleCreateNewAccount = async () => {
    if (!newAccountData.name) {
      alert('Please enter an account name')
      return
    }

    try {
      setLoading(true)
      const response = await createAccount({
        name: newAccountData.name,
        contact: '',
        email: '',
        phone: '',
        sector: newAccountData.industry || 'Other',
        notes: newAccountData.website ? `Website: ${newAccountData.website}` : ''
      })
      
      // The API returns the account directly in response.data
      const createdAccount = response.data
      setAccounts([...accounts, createdAccount])
      setCurrentAccount(createdAccount)
      setCurrentContacts([])
      setNewAccountData({ name: '', industry: '', website: '' })
      setShowCreateAccount(false)
      setShowAccountSelector(false)
    } catch (error) {
      console.error('Error creating account:', error)
      alert('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = () => {
    if (!newContact.name) {
      alert('Please enter a contact name')
      return
    }

    const contact = {
      id: Date.now().toString(),
      ...newContact,
      completedActivities: [], // Track which activity types were completed: 'email', 'call', 'linkedin'
      addedAt: new Date().toISOString()
    }

    setCurrentContacts([...currentContacts, contact])
    setNewContact({
      name: '',
      position: '',
      email: '',
      phone: '',
      linkedInUrl: '',
      notes: ''
    })
  }

  const handleRemoveContact = (contactId) => {
    setCurrentContacts(currentContacts.filter(c => c.id !== contactId))
  }

  const handleEditContact = (contactId) => {
    const contact = currentContacts.find(c => c.id === contactId)
    if (!contact) return

    // Load contact data into form
    setNewContact({
      name: contact.name,
      position: contact.position,
      email: contact.email,
      phone: contact.phone,
      linkedInUrl: contact.linkedInUrl,
      notes: contact.notes
    })

    // Remove from list (will be re-added when user clicks Add)
    setCurrentContacts(currentContacts.filter(c => c.id !== contactId))
  }

  const handleSubmitAccount = () => {
    if (!currentAccount) {
      alert('Please select an account')
      return
    }

    if (currentContacts.length === 0) {
      alert('Please add at least one contact')
      return
    }

    const accountWithContacts = {
      id: Date.now().toString(),
      account: currentAccount,
      contacts: currentContacts,
      addedAt: new Date().toISOString()
    }

    setSprintAccounts([...sprintAccounts, accountWithContacts])
    setCurrentAccount(null)
    setCurrentContacts([])
  }

  const handleRemoveSprintAccount = (accountId) => {
    setSprintAccounts(sprintAccounts.filter(a => a.id !== accountId))
  }

  const handleEditSprintAccount = (sprintAccountId) => {
    const sprintAccount = sprintAccounts.find(a => a.id === sprintAccountId)
    if (!sprintAccount) return

    // Set the account and contacts for editing
    setCurrentAccount(sprintAccount.account)
    setCurrentContacts(sprintAccount.contacts)
    
    // Remove from sprint accounts temporarily (will be re-added on submit)
    setSprintAccounts(sprintAccounts.filter(a => a.id !== sprintAccountId))
  }

  const handleLogActivity = async (sprintAccountId, contactId, activityType) => {
    const sprintAccount = sprintAccounts.find(a => a.id === sprintAccountId)
    if (!sprintAccount) return

    const contact = sprintAccount.contacts.find(c => c.id === contactId)
    if (!contact) return

    // Check if this activity type is already logged
    const completedActivities = contact.completedActivities || []
    if (completedActivities.includes(activityType)) {
      // Remove the activity type (unlog)
      setSprintAccounts(sprintAccounts.map(sa =>
        sa.id === sprintAccountId
          ? {
              ...sa,
              contacts: sa.contacts.map(c =>
                c.id === contactId
                  ? {
                      ...c,
                      completedActivities: completedActivities.filter(t => t !== activityType)
                    }
                  : c
              )
            }
          : sa
      ))
      return
    }

    // Log the activity
    try {
      setLoading(true)
      
      const activityData = {
        activityType: activityType,
        contactName: contact.name,
        contactPosition: contact.position,
        accountId: sprintAccount.account.id,
        accountName: sprintAccount.account.name,
        linkedInUrl: contact.linkedInUrl,
        phoneNumber: contact.phone,
        email: contact.email,
        activityDate: new Date().toISOString(),
        outcome: 'completed',
        notes: `Sprint Planner - ${sprintDate}\n${contact.notes || ''}`,
        callType: activityType === 'call' ? 'outbound' : undefined,
        callPurpose: activityType === 'call' ? 'Outreach' : undefined,
        emailType: activityType === 'email' ? 'cold_outreach' : undefined,
        linkedInMessageType: activityType === 'linkedin' ? 'connection_request' : undefined
      }

      await createActivity(activityData)
      
      // Update contact status
      setSprintAccounts(sprintAccounts.map(sa =>
        sa.id === sprintAccountId
          ? {
              ...sa,
              contacts: sa.contacts.map(c =>
                c.id === contactId
                  ? {
                      ...c,
                      completedActivities: [...completedActivities, activityType],
                      lastActivityAt: new Date().toISOString()
                    }
                  : c
              )
            }
          : sa
      ))
      
      // Show success message with emoji
      const emoji = activityType === 'email' ? '📧' : activityType === 'call' ? '📞' : '💼'
      alert(`${emoji} Activity logged successfully!`)
    } catch (error) {
      console.error('Error creating activity:', error)
      alert('Failed to log activity')
    } finally {
      setLoading(false)
    }
  }

  const totalContacts = sprintAccounts.reduce((sum, sa) => sum + sa.contacts.length, 0)
  const completedContacts = sprintAccounts.reduce((sum, sa) =>
    sum + sa.contacts.filter(c => (c.completedActivities || []).length > 0).length, 0
  )
  const progressPercentage = totalContacts > 0 ? (completedContacts / totalContacts) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎯 Sprint Planner</h1>
          <p className="text-sm text-gray-600 mt-1">
            Plan your outreach session by account
          </p>
        </div>
        <button
          onClick={() => navigate('/activities')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Activities
        </button>
      </div>

      {/* Sprint Date Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sprint Date
        </label>
        <input
          type="date"
          value={sprintDate}
          onChange={(e) => setSprintDate(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Progress Bar */}
      {totalContacts > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedContacts} / {totalContacts} contacts
            </span>
            <span className="text-sm font-medium text-blue-600">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Account Section */}
      {!currentAccount && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Account to Sprint</h2>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAccountSelector(true)
                setShowCreateAccount(false)
              }}
              className="flex-1 px-6 py-4 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-lg font-medium text-gray-900">📋 Select Existing Account</div>
              <div className="text-sm text-gray-600 mt-1">Choose from your accounts</div>
            </button>
            
            <button
              onClick={() => {
                setShowCreateAccount(true)
                setShowAccountSelector(false)
              }}
              className="flex-1 px-6 py-4 text-left border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-lg font-medium text-gray-900">➕ Create New Account</div>
              <div className="text-sm text-gray-600 mt-1">Add a new account</div>
            </button>
          </div>

          {/* Account Selector */}
          {showAccountSelector && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select an Account</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {accounts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No accounts found. Create one first.</p>
                ) : (
                  accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{account.name}</div>
                      {account.industry && (
                        <div className="text-sm text-gray-600">{account.industry}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Create Account Form */}
          {showCreateAccount && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Create New Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={newAccountData.name}
                    onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={newAccountData.industry}
                    onChange={(e) => setNewAccountData({ ...newAccountData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Technology, Healthcare, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={newAccountData.website}
                    onChange={(e) => setNewAccountData({ ...newAccountData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://company.com"
                  />
                </div>
                <button
                  onClick={handleCreateNewAccount}
                  disabled={!newAccountData.name || loading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Contacts to Current Account */}
      {currentAccount && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Adding Contacts to: {currentAccount.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentContacts.length} contact{currentContacts.length !== 1 ? 's' : ''} added
              </p>
            </div>
            <button
              onClick={() => {
                if (currentContacts.length > 0) {
                  if (window.confirm('Discard contacts and select a different account?')) {
                    setCurrentAccount(null)
                    setCurrentContacts([])
                  }
                } else {
                  setCurrentAccount(null)
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Account
            </button>
          </div>

          {/* Contact Form */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Add Contact/Persona</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={newContact.position}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sales Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={newContact.linkedInUrl}
                  onChange={(e) => setNewContact({ ...newContact, linkedInUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <button
              onClick={handleAddContact}
              disabled={!newContact.name}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              + Add Contact to {currentAccount.name}
            </button>
          </div>

          {/* Current Contacts List */}
          {currentContacts.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Contacts for {currentAccount.name} ({currentContacts.length})
              </h3>
              <div className="space-y-2">
                {currentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.position}</div>
                      {contact.email && (
                        <div className="text-sm text-gray-500">📧 {contact.email}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditContact(contact.id)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveContact(contact.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Account Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmitAccount}
              disabled={currentContacts.length === 0}
              className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ✓ Submit Account ({currentContacts.length} contact{currentContacts.length !== 1 ? 's' : ''})
            </button>
          </div>
        </div>
      )}

      {/* Sprint Accounts List */}
      {sprintAccounts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sprint Plan ({sprintAccounts.length} account{sprintAccounts.length !== 1 ? 's' : ''})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {sprintAccounts.map((sprintAccount) => (
              <div key={sprintAccount.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sprintAccount.account.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sprintAccount.contacts.filter(c => (c.completedActivities || []).length > 0).length} / {sprintAccount.contacts.length} contacted
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSprintAccount(sprintAccount.id)}
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      ✏️ Edit / Add More
                    </button>
                    <button
                      onClick={() => handleRemoveSprintAccount(sprintAccount.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sprintAccount.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        (contact.completedActivities || []).length > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Activity Type Buttons */}
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <button
                            onClick={() => handleLogActivity(sprintAccount.id, contact.id, 'email')}
                            disabled={loading}
                            title="Log Email"
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                              (contact.completedActivities || []).includes('email')
                                ? 'bg-blue-500 border-blue-500 shadow-md'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            } disabled:opacity-50`}
                          >
                            📧
                          </button>
                          <button
                            onClick={() => handleLogActivity(sprintAccount.id, contact.id, 'call')}
                            disabled={loading}
                            title="Log Call"
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                              (contact.completedActivities || []).includes('call')
                                ? 'bg-green-500 border-green-500 shadow-md'
                                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                            } disabled:opacity-50`}
                          >
                            📞
                          </button>
                          <button
                            onClick={() => handleLogActivity(sprintAccount.id, contact.id, 'linkedin')}
                            disabled={loading}
                            title="Log LinkedIn"
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                              (contact.completedActivities || []).includes('linkedin')
                                ? 'bg-indigo-500 border-indigo-500 shadow-md'
                                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                            } disabled:opacity-50`}
                          >
                            💼
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {contact.name}
                          </div>
                          <div className="text-sm text-gray-600">{contact.position}</div>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                            {contact.email && <span>📧 {contact.email}</span>}
                            {contact.phone && <span>📞 {contact.phone}</span>}
                            {contact.linkedInUrl && <span>💼 LinkedIn</span>}
                          </div>
                          {contact.notes && (
                            <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                              {contact.notes}
                            </div>
                          )}
                          {(contact.completedActivities || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(contact.completedActivities || []).map(type => (
                                <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {type === 'email' ? '📧 Email' : type === 'call' ? '📞 Call' : '💼 LinkedIn'}
                                </span>
                              ))}
                            </div>
                          )}
                          {contact.lastActivityAt && (
                            <div className="mt-2 text-xs text-gray-500">
                              Last activity: {dayjs(contact.lastActivityAt).format('HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {totalContacts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Accounts</p>
            <p className="text-2xl font-bold text-gray-900">{sprintAccounts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedContacts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
            <p className="text-2xl font-bold text-blue-600">{totalContacts - completedContacts}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
