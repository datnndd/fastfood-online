import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { AccountsAPI } from '../lib/api'

const INITIAL_FORM = {
  username: '',
  password: '',
  email: '',
  full_name: '',
  phone: '',
  gender: 'unspecified',
  date_of_birth: '',
  address_line: '',
  province_id: '',
  ward_id: '',
  set_default_address: true
}

const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Không xác định' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
]

const unwrapList = (response) => {
  const data = response?.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

export default function RegisterPage() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [provinceLoading, setProvinceLoading] = useState(false)
  const [wardLoading, setWardLoading] = useState(false)
  const [locations, setLocations] = useState({ provinces: [], wards: [] })
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchProvinces = async () => {
      setProvinceLoading(true)
      try {
        const response = await AccountsAPI.listProvinces()
        const provinces = unwrapList(response)
        if (mounted) {
          setLocations((prev) => ({ ...prev, provinces }))
        }
      } catch (error) {
        console.error('Không thể tải danh sách tỉnh/thành phố', error)
      } finally {
        if (mounted) setProvinceLoading(false)
      }
    }

    fetchProvinces()
    return () => {
      mounted = false
    }
  }, [])

  const handleProvinceChange = async (value) => {
    setFormData((prev) => ({ ...prev, province_id: value, ward_id: '' }))
    setLocations((prev) => ({ ...prev, wards: [] }))
    if (!value) return

    setWardLoading(true)
    try {
      const response = await AccountsAPI.listWards(value)
      const wards = unwrapList(response)
      setLocations((prev) => ({ ...prev, wards }))
    } catch (error) {
      console.error('Không thể tải danh sách phường/xã', error)
      setLocations((prev) => ({ ...prev, wards: [] }))
    } finally {
      setWardLoading(false)
    }
  }

  const toggleDefaultAddress = () => {
    setFormData((prev) => ({
      ...prev,
      set_default_address: !prev.set_default_address
    }))
  }

  const selectedProvince = useMemo(
    () => locations.provinces.find((prov) => String(prov.id) === String(formData.province_id)),
    [locations.provinces, formData.province_id]
  )

  const selectedWard = useMemo(
    () => locations.wards.find((ward) => String(ward.id) === String(formData.ward_id)),
    [locations.wards, formData.ward_id]
  )

  const genderLabel = useMemo(() => {
    const found = GENDER_OPTIONS.find((option) => option.value === formData.gender)
    return found ? found.label : 'Không xác định'
  }, [formData.gender])

  const detailRows = [
    { label: 'Tên đăng nhập', value: formData.username || '—' },
    { label: 'Email', value: formData.email || '—' },
    { label: 'Họ và tên', value: formData.full_name || '—' },
    { label: 'Số điện thoại', value: formData.phone || '—' },
    { label: 'Giới tính', value: genderLabel },
    { label: 'Ngày sinh', value: formData.date_of_birth || '—' },
    { label: 'Địa chỉ', value: formData.address_line || '—' },
    { label: 'Tỉnh/Thành phố', value: selectedProvince?.name || '—' },
    { label: 'Phường/Xã', value: selectedWard?.name || '—' }
  ]

  const renderFieldErrors = (field) => {
    const fieldError = errors?.[field]
    if (!fieldError) return null
    const list = Array.isArray(fieldError) ? fieldError : [fieldError]
    return (
      <ul className="text-red-500 text-sm mt-1 space-y-1">
        {list.map((msg, index) => (
          <li key={`${field}-${index}`}>{msg}</li>
        ))}
      </ul>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const result = await register(formData)
      if (result?.profileSynced === false) {
        alert('Đăng ký thành công nhưng không thể đặt địa chỉ mặc định. Vui lòng cập nhật trong hồ sơ sau khi đăng nhập.')
      } else {
        alert('Đăng ký thành công! Vui lòng đăng nhập.')
      }
      setFormData(INITIAL_FORM)
      navigate('/login')
    } catch (error) {
      const errorData = error.response?.data
      if (errorData && typeof errorData === 'object') {
        setErrors(errorData)
      } else {
        setErrors({ general: error.message || errorData?.detail || 'Đăng ký thất bại' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đăng ký</h2>
          <p className="mt-2 text-gray-600">Tạo tài khoản FastFood One mới</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded whitespace-pre-line">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {renderFieldErrors('username')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {renderFieldErrors('email')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {renderFieldErrors('full_name')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {renderFieldErrors('phone')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {renderFieldErrors('gender')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày sinh
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                max={new Date().toISOString().split('T')[0]}
              />
              {renderFieldErrors('date_of_birth')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            {renderFieldErrors('password')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ chi tiết
            </label>
            <textarea
              rows={3}
              value={formData.address_line}
              onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Số nhà, đường, khu vực..."
            />
            {renderFieldErrors('address_line')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tỉnh/Thành phố
              </label>
              <select
                value={formData.province_id}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">
                  {provinceLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                </option>
                {locations.provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
              {renderFieldErrors('province_id')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phường/Xã
              </label>
              <select
                value={formData.ward_id}
                onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                disabled={!formData.province_id}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50"
              >
                <option value="">
                  {!formData.province_id ? 'Chọn tỉnh trước' : wardLoading ? 'Đang tải...' : 'Chọn phường/xã'}
                </option>
                {locations.wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
              {renderFieldErrors('ward_id')}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thông tin đăng ký chi tiết</h3>
                <p className="text-sm text-gray-500">Kiểm tra lại thông tin, bạn có thể dùng để tạo địa chỉ giao hàng mặc định.</p>
              </div>
              <button
                type="button"
                onClick={toggleDefaultAddress}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  formData.set_default_address
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {formData.set_default_address ? 'Đã chọn làm địa chỉ mặc định' : 'Đặt làm địa chỉ mặc định'}
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              {detailRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-gray-500">{row.label}</dt>
                  <dd className="font-medium text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>

            {formData.set_default_address && (
              <p className="mt-4 text-sm text-gray-600">
                Chúng tôi sẽ tạo một địa chỉ giao hàng mặc định từ thông tin bên trên sau khi đăng ký thành công.
              </p>
            )}

            {renderFieldErrors('set_default_address')}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <div className="text-center">
            <span className="text-gray-600">Đã có tài khoản? </span>
            <Link to="/login" className="text-red-600 hover:text-red-500 font-medium">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
