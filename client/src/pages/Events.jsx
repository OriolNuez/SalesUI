import { useState, useEffect } from 'react'
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addAccountToEvent,
  removeAccountFromEvent,
  getEventInvitations,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  getAccounts
} from '../api'

export default function Events() {
  const [events, setEvents] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventInvitations, setEventInvitations] = useState([])
  const [selectedInvitation, setSelectedInvitation] = useState(null)
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    type: 'conference',
    date: '',
    location: ''
  })
  const [invitationFormData, setInvitationFormData] = useState({
    accountId: '',
    contactName: '',
    contactPosition: '',
    platform: 'email',
    status: 'not_sent',
    sentDate: '',
    responseDate: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsRes, accountsRes] = await Promise.all([
        getEvents(),
        getAccounts()
      ])
      setEvents(eventsRes.data)
      setAccounts(accountsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEventInvitations = async (eventId) => {
    try {
      const res = await getEventInvitations(eventId)
      setEventInvitations(res.data)
    } catch (error) {
      console.error('Error loading invitations:', error)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      await createEvent(eventFormData)
      await loadData()
      setShowEventModal(false)
      resetEventForm()
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async (e) => {
    e.preventDefault()
    try {
      await updateEvent(selectedEvent.id, eventFormData)
      await loadData()
      setShowEventModal(false)
      setSelectedEvent(null)
      resetEventForm()
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event? All invitations will also be deleted.')) return
    try {
      await deleteEvent(id)
      await loadData()
      if (selectedEvent?.id === id) {
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleViewDetails = async (event) => {
    setSelectedEvent(event)
    await loadEventInvitations(event.id)
  }

  const handleAddAccount = async (eventId, accountId) => {
    try {
      await addAccountToEvent(eventId, accountId)
      await loadData()
      if (selectedEvent?.id === eventId) {
        const updated = events.find(e => e.id === eventId)
        setSelectedEvent(updated)
      }
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleRemoveAccount = async (eventId, accountId) => {
    try {
      await removeAccountFromEvent(eventId, accountId)
      await loadData()
      await loadEventInvitations(eventId)
      if (selectedEvent?.id === eventId) {
        const updated = events.find(e => e.id === eventId)
        setSelectedEvent(updated)
      }
    } catch (error) {
      console.error('Error removing account:', error)
    }
  }

  const handleCreateInvitation = async (e) => {
    e.preventDefault()
    try {
      await createInvitation(selectedEvent.id, invitationFormData)
      await loadEventInvitations(selectedEvent.id)
      setShowInvitationModal(false)
      resetInvitationForm()
    } catch (error) {
      console.error('Error creating invitation:', error)
    }
  }

  const handleUpdateInvitation = async (e) => {
    e.preventDefault()
    try {
      await updateInvitation(selectedInvitation.id, invitationFormData)
      await loadEventInvitations(selectedEvent.id)
      setShowInvitationModal(false)
      setSelectedInvitation(null)
      resetInvitationForm()
    } catch (error) {
      console.error('Error updating invitation:', error)
    }
  }

  const handleDeleteInvitation = async (id) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return
    try {
      await deleteInvitation(id)
      await loadEventInvitations(selectedEvent.id)
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  const openCreateEventModal = () => {
    resetEventForm()
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const openEditEventModal = (event) => {
    setEventFormData({
      name: event.name,
      description: event.description,
      type: event.type,
      date: event.date || '',
      location: event.location || ''
    })
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const openCreateInvitationModal = () => {
    resetInvitationForm()
    setSelectedInvitation(null)
    setShowInvitationModal(true)
  }

  const openEditInvitationModal = (invitation) => {
    setInvitationFormData({
      accountId: invitation.accountId,
      contactName: invitation.contactName,
      contactPosition: invitation.contactPosition,
      platform: invitation.platform,
      status: invitation.status,
      sentDate: invitation.sentDate || '',
      responseDate: invitation.responseDate || '',
      notes: invitation.notes || ''
    })
    setSelectedInvitation(invitation)
    setShowInvitationModal(true)
  }

  const resetEventForm = () => {
    setEventFormData({
      name: '',
      description: '',
      type: 'conference',
      date: '',
      location: ''
    })
  }

  const resetInvitationForm = () => {
    setInvitationFormData({
      accountId: '',
      contactName: '',
      contactPosition: '',
      platform: 'email',
      status: 'not_sent',
      sentDate: '',
      responseDate: '',
      notes: ''
    })
  }

  const getTypeColor = (type) => {
    const colors = {
      conference: 'bg-purple-100 text-purple-700',
      webinar: 'bg-blue-100 text-blue-700',
      trade_show: 'bg-green-100 text-green-700',
      workshop: 'bg-yellow-100 text-yellow-700',
      meeting: 'bg-gray-100 text-gray-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return colors[type] || colors.other
  }

  const getStatusColor = (status) => {
    const colors = {
      not_sent: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      attended: 'bg-purple-100 text-purple-700',
      no_show: 'bg-orange-100 text-orange-700'
    }
    return colors[status] || colors.not_sent
  }

  const getEventAccounts = (event) => {
    return accounts.filter(acc => event.accountIds.includes(acc.id))
  }

  const getAvailableAccounts = (event) => {
    return accounts.filter(acc => !event.accountIds.includes(acc.id))
  }

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? account.name : 'Unknown Account'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage events and track account invitations</p>
        </div>
        <button
          onClick={openCreateEventModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(event)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                {event.type.replace('_', ' ')}
              </span>
            </div>
            
            {event.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
            )}

            <div className="space-y-2 text-sm">
              {event.date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.date).toLocaleDateString()}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-500">Accounts:</span>
                <span className="font-medium">{event.accountIds.length}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEditEventModal(event)
                }}
                className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteEvent(event.id)
                }}
                className="flex-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No events yet. Create your first event to get started!
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && !showEventModal && !showInvitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedEvent.type)}`}>
                  {selectedEvent.type.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Info */}
              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.date && (
                  <div>
                    <span className="text-sm text-gray-500">Date</span>
                    <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedEvent.location && (
                  <div>
                    <span className="text-sm text-gray-500">Location</span>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                )}
              </div>

              {/* Accounts Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Invited Accounts ({getEventAccounts(selectedEvent).length})</h3>
                
                {/* Add Account Dropdown */}
                {getAvailableAccounts(selectedEvent).length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAccount(selectedEvent.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">+ Add Account</option>
                    {getAvailableAccounts(selectedEvent).map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                )}

                {/* Account List */}
                <div className="space-y-2">
                  {getEventAccounts(selectedEvent).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{account.name}</span>
                      <button
                        onClick={() => handleRemoveAccount(selectedEvent.id, account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {getEventAccounts(selectedEvent).length === 0 && (
                    <p className="text-gray-500 text-sm">No accounts invited yet</p>
                  )}
                </div>
              </div>

              {/* Invitations Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Invitations ({eventInvitations.length})
                  </h3>
                  <button
                    onClick={openCreateInvitationModal}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add Invitation
                  </button>
                </div>

                {/* Invitations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Account</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Position</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Platform</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {eventInvitations.map(invitation => (
                        <tr key={invitation.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{getAccountName(invitation.accountId)}</td>
                          <td className="px-4 py-3">{invitation.contactName || '-'}</td>
                          <td className="px-4 py-3">{invitation.contactPosition || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="capitalize">{invitation.platform}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditInvitationModal(invitation)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {eventInvitations.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No invitations yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h2>
            </div>

            <form onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tech Summit 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event details and objectives..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={eventFormData.type}
                    onChange={(e) => setEventFormData({ ...eventFormData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="conference">Conference</option>
                    <option value="webinar">Webinar</option>
                    <option value="trade_show">Trade Show</option>
                    <option value="workshop">Workshop</option>
                    <option value="meeting">Meeting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="San Francisco Convention Center"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false)
                    setSelectedEvent(null)
                    resetEventForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Invitation Modal */}
      {showInvitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedInvitation ? 'Edit Invitation' : 'Create Invitation'}
              </h2>
            </div>

            <form onSubmit={selectedInvitation ? handleUpdateInvitation : handleCreateInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account *
                </label>
                <select
                  required
                  value={invitationFormData.accountId}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!selectedInvitation}
                >
                  <option value="">Select Account</option>
                  {getEventAccounts(selectedEvent).map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={invitationFormData.contactName}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={invitationFormData.contactPosition}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, contactPosition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CTO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={invitationFormData.platform}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="phone">Phone</option>
                    <option value="in_person">In Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={invitationFormData.status}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="not_sent">Not Sent</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="attended">Attended</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sent Date
                  </label>
                  <input
                    type="date"
                    value={invitationFormData.sentDate}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, sentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Date
                  </label>
                  <input
                    type="date"
                    value={invitationFormData.responseDate}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, responseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={invitationFormData.notes}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this invitation..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedInvitation ? 'Update Invitation' : 'Create Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvitationModal(false)
                    setSelectedInvitation(null)
                    resetInvitationForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
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
