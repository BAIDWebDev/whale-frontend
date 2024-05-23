import { useTranslation } from 'react-i18next'
import AnimatedPage from '../../../AnimatedPage'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getAvailableOrders, updateOrderStatus } from '../../../data/api'
import { type PersistentStorage, usePersistentStorage } from '../../../data/persistentStorage'
import ComponentError from '../../common/ComponentError'
import ComponentLoading from '../../common/ComponentLoading'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCircleCheck,
    faFaceSmile,
    faHourglass,
    faHourglassHalf,
    faMugSaucer
} from '@fortawesome/free-solid-svg-icons'
import { type OrderSchema, OrderStatus } from '../../../data/dataTypes'
import ComponentOrderedItem from '../order/ComponentOrderedItem'

export default function PageManage(): JSX.Element {
    const { t } = useTranslation()
    const persistentStorage: PersistentStorage = usePersistentStorage()
    const [selectedOrder, setSelectedOrder] = useState<OrderSchema | null>(null)

    const [currentTime, setCurrentTime] = useState(0)
    let legacyInterval = -1

    useEffect(() => {
        if (legacyInterval !== -1) {
            clearInterval(legacyInterval)
        }
        legacyInterval = setInterval(() => {
            if (selectedOrder === null) {
                return
            }
            setCurrentTime(new Date().getTime() - new Date(selectedOrder.createdTime).getTime())
        }, 300)

        return () => { clearInterval(legacyInterval) }
    }, [selectedOrder])

    const availableOrders = useQuery({
        queryKey: ['available-orders'],
        queryFn: async () => await getAvailableOrders(persistentStorage.getToken()!),
        refetchInterval: 7000
    })

    const changeStatus = useMutation({
        mutationFn: async (newStatus: OrderStatus) => await updateOrderStatus(selectedOrder!.id, newStatus, persistentStorage.getToken()!),
        onSuccess: (data) => {
            if (typeof data === 'object' && 'detail' in data) {
                return
            }
            setSelectedOrder(data)
        }
    })

    function msToTime(duration: number): string {
        const seconds = Math.floor((duration / 1000) % 60)
        const minutes = Math.floor((duration / (1000 * 60)) % 60)
        const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

        const h = hours > 0 ? hours + 'h ' : ''
        const m = minutes > 0 ? minutes + 'm ' : ''
        const s = seconds > 0 ? seconds + 's' : ''

        return h + m + s
    }

    if (availableOrders.isError || (availableOrders.data != null && 'detail' in availableOrders.data)) {
        return <ComponentError detail={availableOrders} screen={true} />
    }

    return <AnimatedPage>
        <div className='h-screen w-screen p-12 flex flex-col'>
            <p className='font-display text-lg mb-5 flex-shrink'>{t('manage.title')}</p>
            <div className='flex flex-grow'>
                <div className='w-1/3 2xl:w-1/4 mr-5 rounded-3xl bg-gray-100 h-full p-3'>
                    {availableOrders.isPending ? <ComponentLoading /> : null}
                    {availableOrders.isSuccess
                        ? availableOrders.data.map(order =>
                            <button key={order.id} onClick={() => { setSelectedOrder(order) }}
                                    className={`p-3 rounded-2xl w-full text-left bg-white mb-3 hover:bg-gray-50 ${selectedOrder?.id === order.id ? 'shadow-lg text-accent-orange' : ''} transition-colors duration-100`}>
                                <p className='font-display font-bold text-xl'>{order.number}</p>
                            </button>
                        )
                        : null}
                    {availableOrders.isSuccess && availableOrders.data.length < 1
                        ? <div className='w-full h-full flex justify-center items-center flex-col'>
                            <FontAwesomeIcon icon={faMugSaucer} className='text-7xl text-gray-400 mb-3' />
                            <p className='font-display text-lg mb-1'>{t('manage.noOrders')}</p>
                        </div>
                        : null}
                </div>
                <div className='w-2/3 2xl:w-3/4 ml-5'>
                    {selectedOrder == null
                        ? <div className='w-full h-full flex justify-center items-center flex-col'>
                            <FontAwesomeIcon icon={faMugSaucer} className='text-7xl text-gray-400 mb-3' />
                            <p className='font-display text-lg mb-1'>{t('manage.unselected')}</p>
                        </div>
                        : <div>
                            <h1 className='font-display font-bold text-5xl mb-3'>{selectedOrder.number}</h1>

                            <p className='font-display text-lg mb-3'>{t('manage.updateStatus')}</p>
                            <div className='w-full rounded-3xl flex mb-8'>
                                <button onClick={() => { changeStatus.mutate(OrderStatus.notStarted) }}
                                        className={`px-4 py-8 mr-5 rounded-2xl flex w-1/4 h-full flex-col justify-center items-center ${selectedOrder.status === OrderStatus.notStarted ? 'text-accent-orange bg-gray-50' : 'text-gray-500 bg-gray-100'}`}>
                                    <FontAwesomeIcon icon={faHourglass} className='text-6xl mb-2' />
                                    <p className='font-display text-lg'>{t('check.status.notStarted')}</p>
                                </button>
                                <button onClick={() => { changeStatus.mutate(OrderStatus.inProgress) }}
                                        className={`px-4 py-8 mr-5 rounded-2xl flex w-1/4 h-full flex-col justify-center items-center ${selectedOrder.status === OrderStatus.inProgress ? 'text-blue-500 bg-gray-50' : 'text-gray-500 bg-gray-100'}`}>
                                    <FontAwesomeIcon icon={faHourglassHalf} className='text-6xl mb-2' />
                                    <p className='font-display text-lg'>{t('check.status.inProgress')}</p>
                                </button>
                                <button onClick={() => { changeStatus.mutate(OrderStatus.ready) }}
                                        className={`px-4 py-8 mr-5 rounded-2xl flex w-1/4 h-full flex-col justify-center items-center ${selectedOrder.status === OrderStatus.ready ? 'text-green-400 bg-gray-50' : 'text-gray-500 bg-gray-100'}`}>
                                    <FontAwesomeIcon icon={faCircleCheck} className='text-6xl mb-2' />
                                    <p className='font-display text-lg'>{t('check.status.ready')}</p>
                                </button>
                                <button onClick={() => { changeStatus.mutate(OrderStatus.pickedUp) }}
                                        className={`px-4 py-8 rounded-2xl flex w-1/4 h-full flex-col justify-center items-center ${selectedOrder.status === OrderStatus.pickedUp ? 'text-yellow-400 bg-gray-50' : 'text-gray-500 bg-gray-100'}`}>
                                    <FontAwesomeIcon icon={faFaceSmile} className='text-6xl mb-2' />
                                    <p className='font-display text-lg'>{t('check.status.pickedUp')}</p>
                                </button>
                            </div>

                            <div className='flex mb-5'>
                                <div className='w-1/3'>
                                    <p className='font-display text-lg mb-3'>{t('manage.amountCharge')}</p>
                                    <p className='font-display text-5xl font-bold'>¥{selectedOrder.totalPrice}</p>
                                </div>
                                <div className='w-1/3'>
                                    <p className='font-display text-lg mb-3'>{t('manage.orderTime')}</p>
                                    <p className='font-display text-5xl font-bold'>{(selectedOrder.status === OrderStatus.ready || selectedOrder.status === OrderStatus.pickedUp) ? t('manage.done') : msToTime(currentTime)}</p>
                                </div>
                                <div className='w-1/3'>
                                    <p className='font-display text-lg mb-3'>{t('manage.orderBy')}</p>
                                    <p className='font-display text-5xl font-bold'>{selectedOrder.user.name}</p>
                                </div>
                            </div>

                            <p className='font-display text-lg mb-3'>{t('manage.itemOrdered')}</p>
                            <div className='grid xl:grid-cols-1 2xl:grid-cols-2 gap-5'>
                                {selectedOrder.items.map(item => <div key={item.id} className='rounded-3xl bg-accent-yellow-bg p-1'>
                                    <ComponentOrderedItem item={item} />
                                </div>)}
                            </div>
                        </div>}
                </div>
            </div>
        </div>
    </AnimatedPage>
}