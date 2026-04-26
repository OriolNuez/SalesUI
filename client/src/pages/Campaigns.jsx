import { useState, useEffect } from 'react'
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addAccountToCampaign,
  removeAccountFromCampaign,
  getCampaignOpportunities,
  getAccounts
} from '../api'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [campaignOpportunities, setCampaignOpportunities] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    targetRevenue: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [campaignsRes, accountsRes] = await Promise.all([
        getCampaigns(),
        getAccounts()
      ])
      setCampaigns(campaignsRes.data)
      setAccounts(accountsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createCampaign(formData)
      await loadData()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateCampaign(selectedCampaign.id, formData)
      await loadData()
      setShowModal(false)
      setSelectedCampaign(null)
      resetForm()
    } catch (error) {
      console.error('Error updating campaign:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      await deleteCampaign(id)
      await loadData()
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null)
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const handleViewDetails = async (campaign) => {
    setSelectedCampaign(campaign)
    try {
      const oppsRes = await getCampaignOpportunities(campaign.id)
      setCampaignOpportunities(oppsRes.data)
    } catch (error) {
      console.error('Error loading opportunities:', error)
    }
  }

  const handleAddAccount = async (campaignId, accountId) => {
    try {
      await addAccountToCampaign(campaignId, accountId)
      await loadData()
      if (selectedCampaign?.id === campaignId) {
        const updated = campaigns.find(c => c.id === campaignId)
        setSelectedCampaign(updated)
      }
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleRemoveAccount = async (campaignId, accountId) => {
    try {
      await removeAccountFromCampaign(campaignId, accountId)
      await loadData()
      if (selectedCampaign?.id === campaignId) {
        const updated = campaigns.find(c => c.id === campaignId)
        setSelectedCampaign(updated)
      }
    } catch (error) {
      console.error('Error removing account:', error)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setSelectedCampaign(null)
    setShowModal(true)
  }

  const openEditModal = (campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      budget: campaign.budget || '',
      targetRevenue: campaign.targetRevenue || ''
    })
    setSelectedCampaign(campaign)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      targetRevenue: ''
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || colors.planning
  }

  const getCampaignAccounts = (campaign) => {
    return accounts.filter(acc => campaign.accountIds.includes(acc.id))
  }

  const getAvailableAccounts = (campaign) => {
    return accounts.filter(acc => !campaign.accountIds.includes(acc.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your sales campaigns and track performance</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => (
          <div
            key={campaign.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(campaign)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            
            {campaign.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Accounts:</span>
                <span className="font-medium">{campaign.accountIds.length}</span>
              </div>
              {campaign.targetRevenue > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">${campaign.targetRevenue.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(campaign)
                }}
                className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(campaign.id)
                }}
                className="flex-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No campaigns yet. Create your first campaign to get started!
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCampaign.status)}`}>
                  {selectedCampaign.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Info */}
              {selectedCampaign.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedCampaign.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedCampaign.startDate && (
                  <div>
                    <span className="text-sm text-gray-500">Start Date</span>
                    <p className="font-medium">{new Date(selectedCampaign.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedCampaign.endDate && (
                  <div>
                    <span className="text-sm text-gray-500">End Date</span>
                    <p className="font-medium">{new Date(selectedCampaign.endDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedCampaign.targetRevenue > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Target Revenue</span>
                    <p className="font-medium">${selectedCampaign.targetRevenue.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Accounts Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Accounts ({getCampaignAccounts(selectedCampaign).length})</h3>
                
                {/* Add Account Dropdown */}
                {getAvailableAccounts(selectedCampaign).length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAccount(selectedCampaign.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">+ Add Account</option>
                    {getAvailableAccounts(selectedCampaign).map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                )}

                {/* Account List */}
                <div className="space-y-2">
                  {getCampaignAccounts(selectedCampaign).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{account.name}</span>
                      <button
                        onClick={() => handleRemoveAccount(selectedCampaign.id, account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {getCampaignAccounts(selectedCampaign).length === 0 && (
                    <p className="text-gray-500 text-sm">No accounts assigned yet</p>
                  )}
                </div>
              </div>

              {/* Opportunities Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Linked Opportunities ({campaignOpportunities.length})
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Opportunities with #{selectedCampaign.name.replace(/\s+/g, '')} hashtag
                </p>
                <div className="space-y-2">
                  {campaignOpportunities.map(opp => (
                    <div key={opp.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-gray-600">{opp.stage}</p>
                        </div>
                        <span className="font-semibold text-green-600">
                          ${opp.value?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                  {campaignOpportunities.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No opportunities linked yet. Add #{selectedCampaign.name.replace(/\s+/g, '')} to opportunity titles to link them.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
            </div>

            <form onSubmit={selectedCampaign ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Q1 Launch Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Campaign objectives and details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Revenue
                </label>
                <input
                  type="number"
                  value={formData.targetRevenue}
                  onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedCampaign(null)
                    resetForm()
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
