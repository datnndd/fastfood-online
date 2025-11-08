import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Protected from '../components/Protected'
import { useAuth } from '../lib/authContext'
import { AuthAPI, AccountsAPI, OrderAPI } from '../lib/api'

// Helper function để unwrap API response
const unwrapList = (response) => {
  const data = response?.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

export default function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [addresses, setAddresses] = useState([])
  const [provinces, setProvinces] = useState([])
  const [addressWards, setAddressWards] = useState([])
  const [profileWards, setProfileWards] = useState([])
  const [orderStats, setOrderStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  // Sync tab with query param (?tab=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    const validTabs = new Set(['profile', 'addresses', 'orders'])
    if (tab && validTabs.has(tab) && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [location.search, activeTab])

  // Push query when tab changes (for deep-linking)
  const latestSearchRef = useRef(location.search)

  useEffect(() => {
    latestSearchRef.current = location.search
  }, [location.search])

  useEffect(() => {
    const params = new URLSearchParams(latestSearchRef.current || '')
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab)
      navigate({ search: params.toString() }, { replace: true })
    }
  }, [activeTab, navigate])

  // Form states
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    gender: 'unspecified',
    date_of_birth: '',
    phone: '',
    address_line: '',
    province_id: '',
    ward_id: ''
  })

  const [addressForm, setAddressForm] = useState({
    label: '',
    contact_name: '',
    contact_phone: '',
    street_address: '',
    additional_info: '',
    province_id: '',
    ward_id: '',
    is_default: false
  })

  // Load data
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        full_name: user.full_name || '',
        gender: user.gender || 'unspecified',
        date_of_birth: user.date_of_birth || '',
        phone: user.phone || '',
        address_line: user.address_line || '',
        province_id: user.province?.id || '',
        ward_id: user.ward?.id || ''
      })
    }
  }, [user])

  useEffect(() => {
    loadAddresses()
    loadProvinces()
    loadOrderStats()
  }, [])

  useEffect(() => {
    if (addressForm.province_id) {
      loadWards(addressForm.province_id, setAddressWards)
    } else {
      setAddressWards([])
    }
  }, [addressForm.province_id])

  useEffect(() => {
    if (profileForm.province_id) {
      loadWards(profileForm.province_id, setProfileWards)
    } else {
      setProfileWards([])
    }
  }, [profileForm.province_id])

  const loadAddresses = async () => {
    try {
      const response = await AccountsAPI.addresses.list()
      const addressesList = unwrapList(response)
      setAddresses(addressesList)
    } catch (error) {
      console.error('Failed to load addresses:', error)
      setAddresses([])
    }
  }

  const loadProvinces = async () => {
    try {
      const provincesList = await AccountsAPI.listProvinces()
      setProvinces(provincesList)
    } catch (error) {
      console.error('Failed to load provinces:', error)
      setProvinces([])
    }
  }

  const loadWards = async (provinceId, setter = setAddressWards) => {
    if (!provinceId) {
      setter([])
      return
    }

    try {
      const wardsList = await AccountsAPI.listWards(provinceId)
      setter(wardsList)
    } catch (error) {
      console.error('Failed to load wards:', error)
      setter([])
    }
  }

  const loadOrderStats = async () => {
    try {
      const response = await OrderAPI.my.list(1)
      const orders = response.data.results || []
      const stats = {
        total: orders.length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        totalSpent: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      }
      setOrderStats(stats)
    } catch (error) {
      console.error('Failed to load order stats:', error)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      username: profileForm.username?.trim() || user?.username || '',
      full_name: profileForm.full_name?.trim() || '',
      gender: profileForm.gender || 'unspecified',
      date_of_birth: profileForm.date_of_birth || null,
      phone: profileForm.phone?.trim() || '',
      address_line: profileForm.address_line?.trim() || '',
      province_id: profileForm.province_id ? Number(profileForm.province_id) : null,
      ward_id: profileForm.ward_id ? Number(profileForm.ward_id) : null
    }

    try {
      await AuthAPI.updateProfile(payload)
      await refreshProfile()
      setEditingProfile(false)
      alert('Cập nhật hồ sơ thành công!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      const errorDetail =
        error.response?.data?.detail ||
        (Array.isArray(error.response?.data) ? error.response.data.join(', ') : null) ||
        'Có lỗi xảy ra khi cập nhật hồ sơ'
      alert(errorDetail)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingAddress) {
        await AccountsAPI.addresses.update(editingAddress.id, addressForm)
        alert('Cập nhật địa chỉ thành công!')
      } else {
        await AccountsAPI.addresses.create(addressForm)
        alert('Thêm địa chỉ thành công!')
      }
      await loadAddresses()
      setShowAddAddress(false)
      setEditingAddress(null)
      setAddressForm({
        label: '',
        contact_name: '',
        contact_phone: '',
        street_address: '',
        additional_info: '',
        province_id: '',
        ward_id: '',
        is_default: false
      })
    } catch (error) {
      console.error('Failed to save address:', error)
      alert('Có lỗi xảy ra khi lưu địa chỉ')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
    
    try {
      await AccountsAPI.addresses.remove(addressId)
      await loadAddresses()
      alert('Xóa địa chỉ thành công!')
    } catch (error) {
      console.error('Failed to delete address:', error)
      alert('Có lỗi xảy ra khi xóa địa chỉ')
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await AccountsAPI.addresses.patch(addressId, { is_default: true })
      await loadAddresses()
    } catch (error) {
      console.error('Failed to set default address:', error)
      alert('Không thể đặt địa chỉ mặc định')
    }
  }

  const getTabIcon = (tabName) => {
    const icons = {
      profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      addresses: "M17.657 16.657L13.414 12.414m0 0a4 4 0 10-5.657-5.657 4 4 0 005.657 5.657z",
      orders: "M3 7h18M3 12h18M3 17h18"
    }
    return icons[tabName] || icons.profile
  }

  const renderProfileTab = () => (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>
        <button
          onClick={() => setEditingProfile(!editingProfile)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            editingProfile 
              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {editingProfile ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
        </button>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Tên đăng nhập</label>
            <input
              value={profileForm.username}
              onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Họ và tên</label>
            <input
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
              disabled={!editingProfile}
              placeholder="Nhập họ tên đầy đủ"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Giới tính</label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                disabled={!editingProfile}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
              >
                <option value="unspecified">Không xác định</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Ngày sinh</label>
              <input
                type="date"
                value={profileForm.date_of_birth || ''}
                onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                disabled={!editingProfile}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500">Email không thể thay đổi</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Số điện thoại</label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Chi tiết</label>
            <input
              value={profileForm.address_line}
              onChange={(e) => setProfileForm({...profileForm, address_line: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Tỉnh/Thành phố</label>
              <select
                value={profileForm.province_id}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    province_id: e.target.value,
                    ward_id: ''
                  })
                }
                disabled={!editingProfile}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Phường/Xã</label>
              <select
                value={profileForm.ward_id}
                onChange={(e) => setProfileForm({...profileForm, ward_id: e.target.value})}
                disabled={!editingProfile || !profileForm.province_id}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
              >
                <option value="">Chọn phường/xã</option>
                {profileWards.map((ward, index) => (
                  <option key={`profile-ward-${ward.id ?? ward.code ?? index}`} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {editingProfile && (
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang cập nhật...
                </span>
              ) : (
                'Cập nhật hồ sơ'
              )}
            </button>
          </div>
        )}
      </form>

    </div>
  )

  const renderAddressesTab = () => (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Địa chỉ giao hàng</h1>
          <p className="text-gray-600">Quản lý các địa chỉ nhận hàng của bạn</p>
        </div>
        <button
          onClick={() => setShowAddAddress(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Thêm địa chỉ
        </button>
      </div>

      {showAddAddress && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 mb-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <form onSubmit={handleAddressSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Nhãn địa chỉ</label>
                <input
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                  placeholder="Nhà, Công ty, ..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Tên người nhận</label>
                <input
                  value={addressForm.contact_name}
                  onChange={(e) => setAddressForm({...addressForm, contact_name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Số điện thoại</label>
              <input
                value={addressForm.contact_phone}
                onChange={(e) => setAddressForm({...addressForm, contact_phone: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Địa chỉ chi tiết</label>
              <input
                value={addressForm.street_address}
                onChange={(e) => setAddressForm({...addressForm, street_address: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Thông tin bổ sung</label>
              <input
                value={addressForm.additional_info}
                onChange={(e) => setAddressForm({...addressForm, additional_info: e.target.value})}
                placeholder="Tầng, căn hộ, ..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Tỉnh/Thành phố</label>
                <select
                  value={addressForm.province_id}
                  onChange={(e) => setAddressForm({...addressForm, province_id: e.target.value, ward_id: ''})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Phường/Xã</label>
                <select
                  value={addressForm.ward_id}
                  onChange={(e) => setAddressForm({...addressForm, ward_id: e.target.value})}
                  required
                  disabled={!addressForm.province_id}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                >
                  <option value="">Chọn phường/xã</option>
                {addressWards.map((ward, index) => (
                  <option key={`address-ward-${ward.id ?? ward.code ?? index}`} value={ward.id}>{ward.name}</option>
                ))}
                </select>
              </div>
            </div>

            <div className="flex items-center p-4 bg-blue-50 rounded-xl">
              <input
                type="checkbox"
                id="is_default"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddAddress(false)
                  setEditingAddress(null)
                  setAddressForm({
                    label: '',
                    contact_name: '',
                    contact_phone: '',
                    street_address: '',
                    additional_info: '',
                    province_id: '',
                    ward_id: '',
                    is_default: false
                  })
                }}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 12.414m0 0a4 4 0 10-5.657-5.657 4 4 0 005.657 5.657z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">Chưa có địa chỉ nào</p>
            <p className="text-gray-400">Thêm địa chỉ đầu tiên để bắt đầu đặt hàng</p>
          </div>
        ) : (
          addresses.map(address => (
            <div key={address.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900">{address.label || 'Địa chỉ'}</h3>
                    {address.is_default && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-800 text-sm font-medium">
                      {address.contact_name}
                      <span className="mx-2">|</span>
                      <span className="text-gray-600">{address.contact_phone}</span>
                    </p>
                    <p className="text-gray-700 text-sm">{address.street_address}</p>
                    {address.additional_info && (
                      <p className="text-gray-500 text-xs">{address.additional_info}</p>
                    )}
                    <p className="text-gray-500 text-xs">
                      {address.ward_name || address.ward?.name}, {address.province_name || address.province?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded transition-all duration-200 text-sm"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingAddress(address)
                        setAddressForm({
                          label: address.label,
                          contact_name: address.contact_name,
                          contact_phone: address.contact_phone,
                          street_address: address.street_address,
                          additional_info: address.additional_info,
                          province_id: address.province_id || address.province?.id || '',
                          ward_id: address.ward_id || address.ward?.id || '',
                          is_default: address.is_default
                        })
                        setShowAddAddress(true)
                      }}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )


  const renderOrdersTab = () => (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê đơn hàng</h1>
        <p className="text-gray-600">Tổng quan về hoạt động mua hàng của bạn</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{orderStats.total || 0}</div>
              <div className="text-sm font-medium text-blue-700">Tổng đơn hàng</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600">{orderStats.completed || 0}</div>
              <div className="text-sm font-medium text-green-700">Đã hoàn thành</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600">{orderStats.cancelled || 0}</div>
              <div className="text-sm font-medium text-red-700">Đã hủy</div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {orderStats.totalSpent?.toLocaleString() || 0}₫
              </div>
              <div className="text-sm font-medium text-purple-700">Tổng chi tiêu</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v1H7a4 4 0 00-4 4v2h18v-2a4 4 0 00-4-4h-2v-1c0-1.657-1.343-3-3-3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          Xem đơn hàng
        </button>
      </div>
    </div>
  )

  const tabs = [
    { id: 'profile', name: 'Thông tin cá nhân', icon: getTabIcon('profile') },
    { id: 'addresses', name: 'Địa chỉ giao hàng', icon: getTabIcon('addresses') },
    { id: 'orders', name: 'Đơn hàng', icon: getTabIcon('orders') }
  ]

  return (
    <Protected>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 min-h-[600px]">
              {/* Sidebar */}
              <aside className="col-span-12 md:col-span-4 lg:col-span-3 bg-gradient-to-b from-blue-50 to-indigo-50 border-r border-gray-200">
                <div className="px-6 py-8">
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-2xl text-white font-bold">
                        {user?.username ? user.username[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h2>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>

                  <nav className="space-y-2">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-white shadow-md border-2 border-blue-200 text-blue-700 transform scale-105'
                            : 'hover:bg-white/70 text-gray-700 hover:shadow-sm hover:scale-102'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    ))}

                    <button
                      onClick={logout}
                      className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-red-50 border border-red-200 text-red-600 hover:shadow-sm transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6-10V5a3 3 0 10-6 0v1" />
                      </svg>
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </nav>
                </div>
              </aside>

              {/* Main content */}
              <section className="col-span-12 md:col-span-8 lg:col-span-9 bg-white">
                <div className="px-8 py-8">
                  {activeTab === 'profile' && renderProfileTab()}
                  {activeTab === 'addresses' && renderAddressesTab()}
                  {activeTab === 'orders' && renderOrdersTab()}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  )
}
