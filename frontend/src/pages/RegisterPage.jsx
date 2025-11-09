import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { AccountsAPI } from '../lib/api'

const INITIAL_FORM = {
  username: '',
  password: '',
  confirm_password: '',
  email: '',
  full_name: '',
  phone: '',
  gender: 'unspecified',
  date_of_birth: '',
  address_line: '',
  province_id: '',
  ward_id: ''
}

const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Không xác định' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
]

const PHONE_REGEX = /^\d{10}$/

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
        const provinces = await AccountsAPI.listProvinces()
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
      const wards = await AccountsAPI.listWards(value)
      setLocations((prev) => ({ ...prev, wards }))
    } catch (error) {
      console.error('Không thể tải danh sách phường/xã', error)
      setLocations((prev) => ({ ...prev, wards: [] }))
    } finally {
      setWardLoading(false)
    }
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
      if (!formData.password || formData.password.length < 6) {
        setErrors({ general: 'Mật khẩu phải từ 6 ký tự' })
        return
      }
      if (formData.password !== formData.confirm_password) {
        setErrors({ general: 'Mật khẩu xác nhận không khớp' })
        return
      }

      const trimValue = (value) => (value || '').trim()
      const normalizedPhone = trimValue(formData.phone)
      if (!PHONE_REGEX.test(normalizedPhone)) {
        setErrors({ phone: 'Số điện thoại phải gồm 10 chữ số' })
        return
      }
      const payload = {
        ...formData,
        username: trimValue(formData.username),
        email: trimValue(formData.email),
        full_name: trimValue(formData.full_name),
        phone: normalizedPhone,
        address_line: trimValue(formData.address_line),
        province_id: formData.province_id ? Number(formData.province_id) : null,
        ward_id: formData.ward_id ? Number(formData.ward_id) : null,
        date_of_birth: formData.date_of_birth || null,
      }
      const { confirm_password, ...payloadToSend } = payload
      const result = await register(payloadToSend)
      if (result?.profileSynced === false) {
        alert('Đăng ký thành công nhưng không thể đồng bộ hồ sơ. Bạn có thể cập nhật lại trong trang hồ sơ sau khi đăng nhập.')
      } else {
        alert('Đăng ký thành công! Click để chuyển hướng')
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">McDono</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">Bắt đầu hành trình giao hàng nhanh chóng</h1>
          <p className="mt-3 text-lg text-gray-600">
            Tạo tài khoản để lưu địa chỉ yêu thích, xem lịch sử đơn hàng và hưởng ưu đãi dành riêng cho thành viên.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.9fr]">
          <section className="rounded-3xl border border-white bg-white p-8 shadow-2xl shadow-red-100/70">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errors.general}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tài khoản
                  </label>
                  <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <label className="text-xs font-medium text-gray-700">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-transparent px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    {renderFieldErrors('username')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  {renderFieldErrors('email')}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  {renderFieldErrors('password')}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <fieldset className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Thông tin cá nhân
                </legend>
                <div>
                  <label className="text-xs font-medium text-gray-700">Tên đầy đủ</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  {renderFieldErrors('full_name')}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    minLength={10}
                    maxLength={10}
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
                    <p className="mt-1 text-xs text-red-500">Số điện thoại phải gồm 10 chữ số.</p>
                  )}
                  {renderFieldErrors('phone')}
                </div>
              </fieldset>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {renderFieldErrors('date_of_birth')}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Địa chỉ chi tiết
                </label>
                <textarea
                  rows={3}
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Số nhà, đường, khu vực..."
                />
                {renderFieldErrors('address_line')}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tỉnh/Thành phố
                  </label>
                  <select
                    value={formData.province_id}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phường/Xã
                  </label>
                  <select
                    value={formData.ward_id}
                    onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                    disabled={!formData.province_id}
                    className="mt-1 block w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-white/50"
                  >
                    <option value="">
                      {!formData.province_id ? 'Chọn tỉnh trước' : wardLoading ? 'Đang tải...' : 'Chọn phường/xã'}
                    </option>
                    {locations.wards.map((ward, index) => (
                      <option key={`ward-${ward.id ?? ward.code ?? index}`} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {renderFieldErrors('ward_id')}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-500/40 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
              </button>

              <div className="text-center text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-semibold text-red-600 hover:text-red-500">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-red-100 bg-white/90 p-8 shadow-xl shadow-red-100/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bảng xác nhận</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Tóm tắt</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Thông tin bên cạnh cập nhật theo thời gian thực để bạn kiểm tra trước khi gửi.
            </p>
            <div className="mt-6 space-y-3 text-sm text-gray-700">
              {detailRows.map((row) => (
                <div key={row.label} className="flex justify-between rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
                  <dt className="font-medium text-gray-500">{row.label}</dt>
                  <dd className="text-gray-900">{row.value}</dd>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white/80 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-800">Lưu ý</p>
              <p className="mt-2 text-xs text-gray-500">
                Bạn có thể điều chỉnh lại thông tin này bất cứ lúc nào trong trang hồ sơ sau khi đăng nhập.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
