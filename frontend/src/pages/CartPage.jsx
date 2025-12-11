import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountsAPI, CartAPI, OrderAPI } from '../lib/api'
import Protected from '../components/Protected'
import { useNotifications } from '../hooks/useNotifications'
import { IMAGE_PLACEHOLDER } from '../lib/placeholders'

const PLACEHOLDER_IMG = IMAGE_PLACEHOLDER

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
  const { pushLocalNotification } = useNotifications()

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
      const [addressesRes, provinces] = await Promise.all([
        AccountsAPI.addresses.list(),
        AccountsAPI.listProvinces()
      ])

      const list = unwrapList(addressesRes)

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!addressFormOpen || typeof document === 'undefined') return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [addressFormOpen])

  const updateItemQuantity = async (itemId, nextQuantity) => {
    if (nextQuantity < 1) return
    try {
      const { data } = await CartAPI.patchItem(itemId, { quantity: nextQuantity })
      setCart((prev) => {
        if (!prev) return prev
        const nextItems = (prev.items || []).map((item) =>
          item.id === itemId ? { ...item, ...data } : item
        )
        return {
          ...prev,
          items: nextItems,
          cart_total: ''
        }
      })
      window.dispatchEvent(new CustomEvent('cartUpdated'))
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
      const { data } = await CartAPI.patchCombo(comboId, { quantity: nextQuantity })
      setCart((prev) => {
        if (!prev) return prev
        const nextCombos = (prev.combos || []).map((comboItem) =>
          comboItem.id === comboId ? { ...comboItem, ...data } : comboItem
        )
        return {
          ...prev,
          combos: nextCombos,
          cart_total: ''
        }
      })
      window.dispatchEvent(new CustomEvent('cartUpdated'))
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
      const wards = await AccountsAPI.listWards(value)
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
      <ul className="mt-1 space-y-1 text-xs text-red-600 font-bold">
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
      const paymentMethod = orderData.payment_method
      const response = await OrderAPI.checkout({
        payment_method: paymentMethod,
        note: orderData.note,
        delivery_address_id: selectedAddressId,
        item_ids: Array.from(selectedItemIds),
        combo_ids: Array.from(selectedComboIds)
      })

      // Nếu thanh toán bằng thẻ, redirect đến Stripe Checkout
      if (paymentMethod === 'card' && response.data?.checkout_url) {
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

      // Trigger event để NotificationContext tự động làm mới
      // Không cần gọi fetchNotifications/fetchUnreadCount trực tiếp nữa
      window.dispatchEvent(new CustomEvent('orderPlaced'))

      const newOrderId = response?.data?.id
      if (paymentMethod === 'cash') {
        alert('Đặt hàng thành công! Đang chuyển đến mục Đơn hàng của tôi...')
        navigate('/orders')
      } else {
        alert('Đặt hàng thành công! Đang mở chi tiết đơn hàng...')
        if (newOrderId) {
          navigate(`/orders/${newOrderId}`)
        } else {
          navigate('/orders')
        }
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

  const closeAddressModal = () => {
    setAddressFormOpen(false)
    setAddressErrors({})
    setAddressForm(EMPTY_ADDRESS_FORM)
    setLocations((prev) => ({ ...prev, wards: [] }))
  }

  return (
    <Protected>
      <div className="min-h-screen vn-bg-rice-paper relative overflow-hidden">
        <div className="absolute inset-0 vn-lotus-pattern opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <h1 className="text-3xl font-black vn-text-red-primary mb-6 vn-heading-display">Giỏ hàng của bạn</h1>

          {cartLoading ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
              <p className="mt-3 text-gray-600 font-bold">Đang tải giỏ hàng...</p>
            </div>
          ) : !hasEntries ? (
            <div className="text-center py-16 vn-card border-2 vn-border-gold">
              <p className="text-gray-500 mb-4 text-lg font-medium">🪷 Giỏ hàng của bạn đang trống.</p>
              <button
                onClick={() => navigate('/menu')}
                className="px-8 py-3 vn-btn-primary shadow-lg hover:shadow-xl transition-all"
              >
                Xem thực đơn
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] xl:gap-8">
              <div className="space-y-4 lg:pr-2 xl:pr-4">
                {((cart?.items ?? []).some(item => !isMenuItemInStock(item.menu_item)) ||
                  (cart?.combos ?? []).some(combo => !isComboInStock(combo.combo))) && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4 flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Một số món trong giỏ hàng đã hết hàng</h3>
                        <p className="text-sm text-red-700 mt-1">
                          Vui lòng kiểm tra và xóa các món được đánh dấu mờ để tiếp tục đặt hàng.
                        </p>
                      </div>
                    </div>
                  )}
                {(cart?.items ?? []).map((item) => {
                  const itemOutOfStock = !isMenuItemInStock(item.menu_item)
                  const stockCount = getNumericStock(item.menu_item?.stock)
                  const canIncreaseItem =
                    !itemOutOfStock && (stockCount === null || item.quantity < stockCount)
                  return (
                    <div key={`item-${item.id}`} className={`vn-card border-2 p-4 transition-shadow ${itemOutOfStock ? 'border-red-400 bg-red-50 opacity-75' : 'vn-border-gold hover:shadow-md'}`}>
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
                          className="h-5 w-5 mt-1 disabled:opacity-40 text-red-600 focus:ring-red-500 rounded border-gray-300"
                        />
                        <div className="h-24 w-24 rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={item.menu_item?.image_url || PLACEHOLDER_IMG}
                            alt={item.menu_item?.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{item.menu_item?.name}</h3>
                          <p className="text-sm font-bold vn-text-red-primary mt-1">
                            Đơn giá: {formatCurrency(item.menu_item?.price)}₫
                          </p>
                          {item.selected_options?.length > 0 && (
                            <p className="text-sm text-gray-500 mt-2 font-medium">
                              Tùy chọn: {item.selected_options.map((opt) => opt.name).join(', ')}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-gray-500 mt-2 font-medium">Ghi chú: {item.note}</p>
                          )}
                          {itemOutOfStock ? (
                            <p className="text-sm font-bold text-red-600 mt-2">
                              Món này đã hết hàng. Vui lòng xóa khỏi giỏ để tiếp tục đặt.
                            </p>
                          ) : stockCount !== null ? (
                            <p className="text-xs text-gray-500 mt-2 font-medium">Còn lại: {stockCount} phần</p>
                          ) : null}
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 font-bold"
                            >
                              -
                            </button>
                            <span className="px-3 text-sm font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canIncreaseItem) return
                                updateItemQuantity(item.id, item.quantity + 1)
                              }}
                              disabled={!canIncreaseItem}
                              className="h-8 w-8 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="ml-auto text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black vn-text-red-primary">
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
                    <div key={`combo-${comboItem.id}`} className={`vn-card border-2 p-4 transition-shadow ${comboOutOfStock ? 'border-red-400 bg-red-100 opacity-75' : 'vn-border-lotus bg-red-50/30 hover:shadow-md'}`}>
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
                          className="h-5 w-5 mt-1 disabled:opacity-40 text-red-600 focus:ring-red-500 rounded border-gray-300"
                        />
                        <div className="h-24 w-24 rounded-xl overflow-hidden border border-red-100">
                          <img
                            src={comboItem.combo?.image_url || PLACEHOLDER_IMG}
                            alt={comboItem.combo?.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{comboItem.combo?.name}</h3>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200">
                              Combo
                            </span>
                          </div>
                          <p className="text-sm font-bold vn-text-red-primary mt-1">
                            Giá ưu đãi: {formatCurrency(comboItem.combo?.final_price)}₫ / combo
                          </p>
                          <p className="text-xs text-green-600 font-bold mt-1">
                            Tiết kiệm {comboItem.combo?.discount_percentage}% so với giá lẻ.
                          </p>
                          {comboOutOfStock ? (
                            <p className="text-sm font-bold text-red-600 mt-2">
                              Combo này đã hết hàng. Vui lòng xóa khỏi giỏ để tiếp tục đặt.
                            </p>
                          ) : comboStock !== null ? (
                            <p className="text-xs text-gray-500 mt-2 font-medium">Còn lại: {comboStock} suất</p>
                          ) : null}

                          {comboItem.combo?.items?.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-gray-600 font-medium">
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
                            <p className="text-xs text-gray-500 mt-2 font-medium">Ghi chú: {comboItem.note}</p>
                          )}

                          <div className="flex items-center gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => updateComboQuantity(comboItem.id, comboItem.quantity - 1)}
                              disabled={comboItem.quantity <= 1}
                              className="h-8 w-8 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 font-bold"
                            >
                              -
                            </button>
                            <span className="px-3 text-sm font-bold">{comboItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canIncreaseCombo) return
                                updateComboQuantity(comboItem.id, comboItem.quantity + 1)
                              }}
                              disabled={!canIncreaseCombo}
                              className="h-8 w-8 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCombo(comboItem.id)}
                              className="ml-auto text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black vn-text-red-primary">
                            {formatCurrency(comboItem.combo_total)}₫
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="vn-card border-2 vn-border-gold p-6 space-y-6 h-fit lg:sticky lg:top-6">
                <section className="rounded-2xl border border-red-100 bg-red-50/50 p-5 space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] vn-text-red-primary">Bước 1</p>
                      <h3 className="mt-1 text-xl font-black vn-heading-display text-gray-900">Địa chỉ giao hàng</h3>
                      <p className="text-sm text-gray-600 font-medium">
                        Hãy chọn địa điểm nhận hàng chính xác để tài xế liên hệ nhanh chóng.
                      </p>
                    </div>
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
                        className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:border-red-300 hover:text-red-700 hover:bg-red-50 transition-all"
                      >
                        <span className="text-lg leading-none">＋</span>
                      </button>
                    )}
                  </div>

                  {addressesLoading ? (
                    <div className="py-8 text-center text-sm text-red-700 flex flex-col items-center gap-2 font-medium">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
                      Đang tải danh sách địa chỉ...
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-red-200 bg-white/70 p-4 text-sm text-red-800 font-medium text-center">
                      Bạn chưa có địa chỉ giao hàng. Thêm địa chỉ mới để hoàn tất đơn hàng.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((address) => {
                        const isActive = selectedAddressId === address.id
                        return (
                          <label
                            key={address.id}
                            className={`group relative flex cursor-pointer flex-col gap-2 rounded-2xl border-2 bg-white p-4 transition-all ${isActive ? 'border-red-500 shadow-lg shadow-red-100' : 'border-gray-200 hover:border-red-200'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="delivery_address"
                                checked={isActive}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="mt-1 h-5 w-5 text-red-600 focus:ring-red-400 border-gray-300"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-bold text-gray-900">{address.label || 'Địa chỉ'}</p>
                                  {address.is_default && (
                                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                                      Mặc định
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                                      Đang sử dụng
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 font-medium">
                                  {address.contact_name} • {address.contact_phone}
                                </p>
                                <p className="text-sm text-gray-600 font-medium">
                                  {address.street_address}
                                  {address.additional_info ? `, ${address.additional_info}` : ''}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {[address.ward_name, address.province_name].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}

                </section>

                <section className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Phương thức thanh toán</label>
                    <select
                      value={orderData.payment_method}
                      onChange={(e) => {
                        const newMethod = e.target.value
                        setOrderData((prev) => ({
                          ...prev,
                          payment_method: newMethod
                        }))
                      }}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="card">Thẻ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">Ghi chú cho đơn hàng</label>
                    <textarea
                      value={orderData.note}
                      onChange={(e) => setOrderData((prev) => ({ ...prev, note: e.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                      rows={3}
                      placeholder="Ví dụ: Giao lúc giờ nghỉ trưa, thêm tương ớt..."
                    />
                  </div>
                </section>

                <section className="space-y-2 border-t-2 border-gray-100 pt-4 text-sm text-gray-700 font-medium">
                  <div className="flex justify-between">
                    <span>Tạm tính món lẻ (đã chọn)</span>
                    <span className="font-bold">{formatCurrency(totals.items)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tạm tính combo (đã chọn)</span>
                    <span className="font-bold">{formatCurrency(totals.combos)}₫</span>
                  </div>
                  <div className="flex justify-between font-black text-xl vn-text-red-primary pt-2 border-t border-gray-100">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(totals.total)}₫</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium italic">
                    Chỉ các món được tick sẽ được đặt. Món không chọn vẫn ở lại giỏ hàng.
                  </p>
                </section>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !hasSelection}
                  className="w-full vn-btn-primary py-4 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal thêm địa chỉ */}
        {addressFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto vn-card border-2 vn-border-gold p-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black vn-text-red-primary vn-heading-display">Thêm địa chỉ mới</h3>
                <button
                  onClick={closeAddressModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateAddress} className="space-y-6">
                {addressErrors.general && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-bold flex items-center gap-2">
                    <span>⚠️</span> {addressErrors.general}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Tên gợi nhớ</label>
                    <input
                      type="text"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                      placeholder="Nhà riêng, Công ty..."
                    />
                    {renderFieldErrors('label')}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Họ tên người nhận *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.contact_name}
                      onChange={(e) => setAddressForm({ ...addressForm, contact_name: e.target.value })}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    />
                    {renderFieldErrors('contact_name')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.contact_phone}
                    onChange={(e) => setAddressForm({ ...addressForm, contact_phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  />
                  {renderFieldErrors('contact_phone')}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Tỉnh / Thành phố *</label>
                    <select
                      value={addressForm.province_id}
                      onChange={(e) => onProvinceChange(e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {locations.provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {renderFieldErrors('province_id')}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Phường / Xã *</label>
                    <select
                      value={addressForm.ward_id}
                      onChange={(e) => setAddressForm({ ...addressForm, ward_id: e.target.value })}
                      disabled={!addressForm.province_id || isFetchingWards}
                      className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {locations.wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    {renderFieldErrors('ward_id')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street_address}
                    onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    placeholder="Số nhà, tên đường..."
                  />
                  {renderFieldErrors('street_address')}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Thông tin thêm</label>
                  <input
                    type="text"
                    value={addressForm.additional_info}
                    onChange={(e) => setAddressForm({ ...addressForm, additional_info: e.target.value })}
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                    placeholder="Gần tòa nhà, đối diện..."
                  />
                </div>

                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-100">
                  <input
                    type="checkbox"
                    id="new-addr-default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="new-addr-default" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="flex-1 vn-btn-primary py-3 shadow-lg hover:shadow-xl disabled:opacity-70"
                  >
                    {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protected>
  )
}
