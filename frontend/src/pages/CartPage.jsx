import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountsAPI, CartAPI, OrderAPI } from '../lib/api'
import Protected from '../components/Protected'
import { useNotifications } from '../hooks/useNotifications'

const PLACEHOLDER_IMG = 'https://via.placeholder.com/100'

const EMPTY_ADDRESS_FORM = {
  label: '',
  contact_name: '',
  contact_phone: '',
  street_address: '',
  additional_info: '',
  province_id: '',
  ward_id: '',
  is_default: true
}

const unwrapList = (response) => {
  const data = response?.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatCurrency = (value) => toNumber(value).toLocaleString('vi-VN')
const getNumericStock = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const isMenuItemInStock = (menuItem) => {
  if (!menuItem) return false
  if (menuItem.is_available === false) return false
  const stock = getNumericStock(menuItem.stock)
  if (stock === null) return true
  return stock > 0
}
const isComboInStock = (combo) => {
  if (!combo) return false
  if (combo.is_available === false) return false
  const stock = getNumericStock(combo.stock)
  if (stock === null) return true
  return stock > 0
}

export default function CartPage() {
  const [cart, setCart] = useState(null)
  const [cartLoading, setCartLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [orderData, setOrderData] = useState({ payment_method: 'cash', note: '' })
  const navigate = useNavigate()
  const { fetchNotifications, fetchUnreadCount, pushLocalNotification } = useNotifications()

  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [addressErrors, setAddressErrors] = useState({})
  const [savingAddress, setSavingAddress] = useState(false)

  const [locations, setLocations] = useState({
    provinces: [],
    wards: []
  })
  const [isFetchingWards, setIsFetchingWards] = useState(false)

  // Selection for partial checkout
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  const [selectedComboIds, setSelectedComboIds] = useState(new Set())

  const loadCart = async (syncBadge = false) => {
    setCartLoading(true)
    try {
      const { data } = await CartAPI.getCart()
      const normalized = {
        ...data,
        items: data?.items ?? [],
        combos: data?.combos ?? [],
        cart_total: data?.cart_total ?? '0'
      }
      setCart(normalized)
      const selectableItemIds = (normalized.items || [])
        .filter((item) => isMenuItemInStock(item.menu_item))
        .map((item) => item.id)
      const selectableComboIds = (normalized.combos || [])
        .filter((combo) => isComboInStock(combo.combo))
        .map((combo) => combo.id)
      setSelectedItemIds(new Set(selectableItemIds))
      setSelectedComboIds(new Set(selectableComboIds))
      if (syncBadge) {
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
      setCart(null)
    } finally {
      setCartLoading(false)
    }
  }

  const loadAddresses = async (preferredId = null) => {
    setAddressesLoading(true)
    try {
      const [addressesRes, provincesRes] = await Promise.all([
        AccountsAPI.addresses.list(),
        AccountsAPI.listProvinces()
      ])

      const list = unwrapList(addressesRes)
      const provinces = unwrapList(provincesRes)

      setAddresses(list)
      setLocations((prev) => ({
        ...prev,
        provinces,
        wards: prev.wards
      }))

      setSelectedAddressId((prev) => {
        if (preferredId && list.some((addr) => addr.id === preferredId)) {
          return preferredId
        }
        if (prev && list.some((addr) => addr.id === prev)) {
          return prev
        }
        const defaultAddress = list.find((addr) => addr.is_default)
        if (defaultAddress) return defaultAddress.id
        return list[0]?.id ?? null
      })

      if (list.length === 0) {
        setAddressFormOpen(true)
        setAddressForm(() => ({
          ...EMPTY_ADDRESS_FORM,
          is_default: true
        }))
      }
    } catch (error) {
      console.error('Failed to load delivery addresses:', error)
      setAddresses([])
      setSelectedAddressId(null)
    } finally {
      setAddressesLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
    loadAddresses()
  }, [])

  const updateItemQuantity = async (itemId, nextQuantity) => {
    if (nextQuantity < 1) return
    try {
      await CartAPI.patchItem(itemId, { quantity: nextQuantity })
      await loadCart(true)
    } catch (error) {
      console.error('Failed to update quantity:', error)
      const message = error.response?.data?.detail || error.response?.data?.error || 'Không thể cập nhật số lượng món. Vui lòng thử lại.'
      alert(message)
    }
  }

  const removeItem = async (itemId) => {
    try {
      await CartAPI.removeItem(itemId)
      await loadCart(true)
    } catch (error) {
      console.error('Failed to remove item:', error)
      const message = error.response?.data?.detail || error.response?.data?.error || 'Không thể xóa món khỏi giỏ hàng.'
      alert(message)
    }
  }

  const updateComboQuantity = async (comboId, nextQuantity) => {
    if (nextQuantity < 1) return
    try {
      await CartAPI.patchCombo(comboId, { quantity: nextQuantity })
      await loadCart(true)
    } catch (error) {
      console.error('Failed to update combo quantity:', error)
      const message = error.response?.data?.detail || error.response?.data?.error || 'Không thể cập nhật số lượng combo.'
      alert(message)
    }
  }

  const removeCombo = async (comboId) => {
    try {
      await CartAPI.removeCombo(comboId)
      await loadCart(true)
    } catch (error) {
      console.error('Failed to remove combo:', error)
      const message = error.response?.data?.detail || error.response?.data?.error || 'Không thể xóa combo khỏi giỏ hàng.'
      alert(message)
    }
  }

  const onProvinceChange = async (value) => {
    setAddressForm((prev) => ({
      ...prev,
      province_id: value,
      ward_id: ''
    }))
    if (!value) {
      setLocations((prev) => ({ ...prev, wards: [] }))
      return
    }

    setIsFetchingWards(true)
    try {
      const res = await AccountsAPI.listWards(value)
      const wards = unwrapList(res)
      setLocations((prev) => ({ ...prev, wards }))
    } catch (error) {
      console.error('Failed to load wards:', error)
      setLocations((prev) => ({ ...prev, wards: [] }))
    } finally {
      setIsFetchingWards(false)
    }
  }

  const renderFieldErrors = (field) => {
    const fieldError = addressErrors?.[field]
    if (!fieldError) return null
    const list = Array.isArray(fieldError) ? fieldError : [fieldError]
    return (
      <ul className="mt-1 space-y-1 text-xs text-red-600">
        {list.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    )
  }

  const handleCreateAddress = async (event) => {
    event.preventDefault()
    setAddressErrors({})

    if (!addressForm.province_id || !addressForm.ward_id) {
      setAddressErrors({ general: 'Vui lòng chọn đầy đủ Tỉnh/Thành phố và Phường/Xã.' })
      return
    }

    setSavingAddress(true)
    try {
      const payload = {
        label: addressForm.label.trim(),
        contact_name: addressForm.contact_name.trim(),
        contact_phone: addressForm.contact_phone.trim(),
        street_address: addressForm.street_address.trim(),
        additional_info: addressForm.additional_info.trim(),
        province_id: Number(addressForm.province_id),
        ward_id: Number(addressForm.ward_id),
        is_default: Boolean(addressForm.is_default)
      }

      const { data } = await AccountsAPI.addresses.create(payload)

      setAddressFormOpen(false)
      setAddressForm(EMPTY_ADDRESS_FORM)
      setLocations((prev) => ({ ...prev, wards: [] }))

      await loadAddresses(data?.id)
      setAddressErrors({})
      alert('Đã thêm địa chỉ giao hàng mới.')
    } catch (error) {
      const detail = error.response?.data
      if (detail && typeof detail === 'object') {
        setAddressErrors(detail)
      } else {
        setAddressErrors({ general: 'Không thể lưu địa chỉ. Vui lòng thử lại.' })
      }
    } finally {
      setSavingAddress(false)
    }
  }

  const totals = useMemo(() => {
    if (!cart) {
      return { items: 0, combos: 0, total: 0 }
    }

    const itemsTotal = (cart.items ?? []).reduce((sum, item) => {
      if (!selectedItemIds.has(item.id)) return sum
      if (!isMenuItemInStock(item.menu_item)) return sum
      if (item.item_total !== undefined && item.item_total !== null) {
        return sum + toNumber(item.item_total)
      }
      const unit = toNumber(item.menu_item?.price)
      const quantity = item.quantity ?? 0
      return sum + unit * quantity
    }, 0)

    const combosTotal = (cart.combos ?? []).reduce((sum, comboItem) => {
      if (!selectedComboIds.has(comboItem.id)) return sum
      if (!isComboInStock(comboItem.combo)) return sum
      if (comboItem.combo_total !== undefined && comboItem.combo_total !== null) {
        return sum + toNumber(comboItem.combo_total)
      }
      const unit = toNumber(comboItem.combo?.final_price)
      const quantity = comboItem.quantity ?? 1
      return sum + unit * quantity
    }, 0)

    const overall = cart.cart_total ? toNumber(cart.cart_total) : itemsTotal + combosTotal
    return { items: itemsTotal, combos: combosTotal, total: overall }
  }, [cart, selectedItemIds, selectedComboIds])

  const hasEntries =
    (cart?.items?.length ?? 0) > 0 || (cart?.combos?.length ?? 0) > 0
  const hasSelection = selectedItemIds.size > 0 || selectedComboIds.size > 0

  const handleCheckout = async () => {
    if (!hasEntries) return
    if (!hasSelection) {
      alert('Vui lòng chọn ít nhất 1 món để đặt hàng.')
      return
    }
    if (!selectedAddressId) {
      alert('Vui lòng chọn địa chỉ giao hàng trước khi đặt hàng.')
      return
    }

    setCheckoutLoading(true)
    try {
      const response = await OrderAPI.checkout({
        payment_method: orderData.payment_method,
        note: orderData.note,
        delivery_address_id: selectedAddressId,
        item_ids: Array.from(selectedItemIds),
        combo_ids: Array.from(selectedComboIds)
      })

      // Nếu thanh toán bằng thẻ, redirect đến Stripe Checkout
      if (orderData.payment_method === 'card' && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url
        return
      }

      // Thanh toán tiền mặt hoặc chuyển khoản
      await loadCart(true)
      
      // Local instant notification (fallback in case backend notification delays)
      const order = response?.data
      if (order?.id) {
        pushLocalNotification({
          type: 'ORDER_PLACED',
          title: `Đơn hàng #${order.id} đã được đặt thành công!`,
          message: 'Chúng tôi đang xử lý đơn hàng của bạn. Nhấn để xem chi tiết.',
          order_id: order.id
        })
      }
      
      // Refresh notifications sau khi đặt hàng thành công
      try {
        await fetchNotifications({ limit: 20 })
        await fetchUnreadCount()
      } catch (notifError) {
        console.error('Failed to refresh notifications:', notifError)
      }
      
      // Trigger event để các component khác có thể refresh
      window.dispatchEvent(new CustomEvent('orderPlaced'))
      
      alert('Đặt hàng thành công! Đang mở chi tiết đơn hàng...')
      const newOrderId = response?.data?.id
      if (newOrderId) {
        navigate(`/orders/${newOrderId}`)
      } else {
        navigate('/profile')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.'
      alert(message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <Protected>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>

        {cartLoading ? (
          <div className="text-center py-12">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-red-600" />
            <p className="mt-3 text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        ) : !hasEntries ? (
          <div className="text-center py-16 bg-white border rounded-lg">
            <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống.</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {(cart?.items ?? []).map((item) => {
                const itemOutOfStock = !isMenuItemInStock(item.menu_item)
                const stockCount = getNumericStock(item.menu_item?.stock)
                const canIncreaseItem =
                  !itemOutOfStock && (stockCount === null || item.quantity < stockCount)
                return (
                  <div key={`item-${item.id}`} className="bg-white border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id) && !itemOutOfStock}
                      disabled={itemOutOfStock}
                      onChange={(e) => {
                        if (itemOutOfStock) return
                        setSelectedItemIds((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(item.id)
                          else next.delete(item.id)
                          return next
                        })
                      }}
                      className="h-4 w-4 mt-1 disabled:opacity-40"
                    />
                    <img
                      src={item.menu_item?.image_url || PLACEHOLDER_IMG}
                      alt={item.menu_item?.name}
                      className="h-24 w-24 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.menu_item?.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Đơn giá: {formatCurrency(item.menu_item?.price)}₫
                      </p>
                      {item.selected_options?.length > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Tùy chọn: {item.selected_options.map((opt) => opt.name).join(', ')}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-xs text-gray-500 mt-2">Ghi chú: {item.note}</p>
                      )}
                      {itemOutOfStock ? (
                        <p className="text-sm font-medium text-red-600 mt-2">
                          Món này đã hết hàng. Vui lòng xóa khỏi giỏ để tiếp tục đặt.
                        </p>
                      ) : stockCount !== null ? (
                        <p className="text-xs text-gray-500 mt-2">Còn lại: {stockCount} phần</p>
                      ) : null}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canIncreaseItem) return
                            updateItemQuantity(item.id, item.quantity + 1)
                          }}
                          disabled={!canIncreaseItem}
                          className="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-sm text-red-600 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(item.item_total ?? toNumber(item.menu_item?.price) * (item.quantity ?? 0))}₫
                      </p>
                    </div>
                  </div>
                </div>
                )
              })}

              {(cart?.combos ?? []).map((comboItem) => {
                const comboOutOfStock = !isComboInStock(comboItem.combo)
                const comboStock = getNumericStock(comboItem.combo?.stock)
                const canIncreaseCombo =
                  !comboOutOfStock && (comboStock === null || comboItem.quantity < comboStock)
                return (
                  <div key={`combo-${comboItem.id}`} className="bg-white border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedComboIds.has(comboItem.id) && !comboOutOfStock}
                      disabled={comboOutOfStock}
                      onChange={(e) => {
                        if (comboOutOfStock) return
                        setSelectedComboIds((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(comboItem.id)
                          else next.delete(comboItem.id)
                          return next
                        })
                      }}
                      className="h-4 w-4 mt-1 disabled:opacity-40"
                    />
                    <img
                      src={comboItem.combo?.image_url || PLACEHOLDER_IMG}
                      alt={comboItem.combo?.name}
                      className="h-24 w-24 rounded object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{comboItem.combo?.name}</h3>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Combo
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Giá ưu đãi: {formatCurrency(comboItem.combo?.final_price)}₫ / combo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tiết kiệm {comboItem.combo?.discount_percentage}% so với giá lẻ.
                      </p>
                      {comboOutOfStock ? (
                        <p className="text-sm font-medium text-red-600 mt-2">
                          Combo này đã hết hàng. Vui lòng xóa khỏi giỏ để tiếp tục đặt.
                        </p>
                      ) : comboStock !== null ? (
                        <p className="text-xs text-gray-500 mt-2">Còn lại: {comboStock} suất</p>
                      ) : null}

                      {comboItem.combo?.items?.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-gray-600">
                          {comboItem.combo.items.map((comboLine) => (
                            <li key={comboLine.id} className="list-disc list-inside">
                              {comboLine.menu_item?.name} × {comboLine.quantity}
                              {comboLine.selected_options?.length > 0 && (
                                <> ({comboLine.selected_options.map((opt) => opt.name).join(', ')})</>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {comboItem.note && (
                        <p className="text-xs text-gray-500 mt-2">Ghi chú: {comboItem.note}</p>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => updateComboQuantity(comboItem.id, comboItem.quantity - 1)}
                          disabled={comboItem.quantity <= 1}
                          className="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-medium">{comboItem.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canIncreaseCombo) return
                            updateComboQuantity(comboItem.id, comboItem.quantity + 1)
                          }}
                          disabled={!canIncreaseCombo}
                          className="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCombo(comboItem.id)}
                          className="ml-auto text-sm text-red-600 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(comboItem.combo_total)}₫
                      </p>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>

            <div className="bg-white border rounded-lg p-6 space-y-6 h-fit">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
                  {!addressFormOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddressErrors({})
                        setAddressForm({
                          ...EMPTY_ADDRESS_FORM,
                          is_default: addresses.length === 0
                        })
                        setLocations((prev) => ({ ...prev, wards: [] }))
                        setAddressFormOpen(true)
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      + Thêm địa chỉ
                    </button>
                  )}
                </div>

                {addressesLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Đang tải danh sách địa chỉ...
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Bạn chưa có địa chỉ giao hàng. Vui lòng thêm mới để tiếp tục đặt hàng.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          selectedAddressId === address.id ? 'border-red-500 bg-red-50' : 'hover:border-red-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery_address"
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{address.label || 'Địa chỉ'}</p>
                            {address.is_default && (
                              <span className="text-[11px] rounded-full bg-gray-800 px-2 py-0.5 text-white uppercase">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.contact_name} • {address.contact_phone}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.street_address}
                            {address.additional_info ? `, ${address.additional_info}` : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {[
                              address.ward_name,
                              address.province_name
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {addressFormOpen && (
                  <form onSubmit={handleCreateAddress} className="mt-4 space-y-4 border-t pt-4">
                    {addressErrors.general && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        {addressErrors.general}
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tên gợi nhớ *
                        </label>
                        <input
                          type="text"
                          value={addressForm.label}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Ví dụ: Nhà, Văn phòng..."
                          required
                        />
                        {renderFieldErrors('label')}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Số điện thoại liên hệ *
                        </label>
                        <input
                          type="tel"
                          value={addressForm.contact_phone}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                        {renderFieldErrors('contact_phone')}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Người nhận hàng *
                      </label>
                      <input
                        type="text"
                        value={addressForm.contact_name}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                        className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                      {renderFieldErrors('contact_name')}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tỉnh / Thành phố *
                        </label>
                        <select
                          value={addressForm.province_id}
                          onChange={(e) => onProvinceChange(e.target.value)}
                          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        >
                          <option value="">Chọn tỉnh/thành</option>
                          {locations.provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                        {renderFieldErrors('province_id')}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Phường / Xã *
                        </label>
                        <select
                          value={addressForm.ward_id}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, ward_id: e.target.value }))}
                          className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={!addressForm.province_id || isFetchingWards}
                          required
                        >
                          <option value="">
                            {isFetchingWards ? 'Đang tải...' : 'Chọn phường/xã'}
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

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Địa chỉ chi tiết *
                      </label>
                      <input
                        type="text"
                        value={addressForm.street_address}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, street_address: e.target.value }))}
                        className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Ví dụ: Số 1, Đường Phạm Hùng"
                        required
                      />
                      {renderFieldErrors('street_address')}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Ghi chú thêm
                      </label>
                      <textarea
                        value={addressForm.additional_info}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, additional_info: e.target.value }))}
                        className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                      />
                      {renderFieldErrors('additional_info')}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      Đặt làm địa chỉ mặc định
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressFormOpen(false)
                          setAddressErrors({})
                          setAddressForm(EMPTY_ADDRESS_FORM)
                          setLocations((prev) => ({ ...prev, wards: [] }))
                        }}
                        className="rounded border px-4 py-2 text-sm hover:bg-gray-100"
                        disabled={savingAddress}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                  <select
                    value={orderData.payment_method}
                    onChange={(e) => {
                      const newMethod = e.target.value
                      setOrderData((prev) => ({
                        ...prev,
                        payment_method: newMethod
                      }))
                    }}
                    className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Thẻ</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Ghi chú cho đơn hàng</label>
                  <textarea
                    value={orderData.note}
                    onChange={(e) => setOrderData((prev) => ({ ...prev, note: e.target.value }))}
                    className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Ví dụ: Giao lúc giờ nghỉ trưa, thêm tương ớt..."
                  />
                </div>
              </section>

              <section className="space-y-2 border-t pt-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tạm tính món lẻ (đã chọn)</span>
                  <span>{formatCurrency(totals.items)}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Tạm tính combo (đã chọn)</span>
                  <span>{formatCurrency(totals.combos)}₫</span>
                </div>
                <div className="flex justify-between font-semibold text-lg text-gray-900">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totals.total)}₫</span>
                </div>
                <p className="text-xs text-gray-500">
                  Chỉ các món được tick sẽ được đặt. Món không chọn vẫn ở lại giỏ hàng.
                </p>
              </section>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading || !selectedAddressId || !hasSelection}
                className="w-full rounded-lg bg-red-600 py-3 text-white font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Đang xử lý...' : 'Đặt hàng ngay (chỉ món đã chọn)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Protected>
  )
}
