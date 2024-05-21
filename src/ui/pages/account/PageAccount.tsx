import { useEffect, useState } from 'react'
import { type PersistentStorage, usePersistentStorage } from '../../../data/persistentStorage'
import { useNavigate } from 'react-router-dom'
import AnimatedPage from '../../../AnimatedPage'
import { useTranslation } from 'react-i18next'
import ComponentTopBar from '../../common/ComponentTopBar'
import { useQuery } from '@tanstack/react-query'
import { getMe, getMeStatistics } from '../../../data/api'
import ComponentLoading from '../../common/ComponentLoading'
import ComponentError from '../../common/ComponentError'
import ComponentDeleteAccountModal from './ComponentDeleteAccountModal'

export default function PageAccount(): JSX.Element {
    const persistentStorage: PersistentStorage = usePersistentStorage()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (persistentStorage.getToken() == null) {
            navigate('/login/oauth2/_account')
        }
    }, [])

    const me = useQuery({
        queryKey: ['user-info-from-token'],
        queryFn: async () =>
            (persistentStorage.getToken() == null ? null : await getMe(persistentStorage.getToken()!))
    })

    const meStatistics = useQuery({
        queryKey: ['user-statistics-from-token'],
        queryFn: async () => (persistentStorage.getToken() == null ? null : await getMeStatistics(persistentStorage.getToken()!))
    })

    if (me.isPending || me.data == null || meStatistics.isPending || meStatistics.data == null) {
        return <ComponentLoading screen={true} />
    }

    if (me.isError || 'detail' in me.data) {
        return <ComponentError screen={true} detail={me} />
    }

    if (meStatistics.isError || 'detail' in meStatistics.data) {
        return <ComponentError screen={true} detail={meStatistics} />
    }

    return (
        <AnimatedPage>
            <ComponentDeleteAccountModal open={open} deletable={meStatistics.data.deletable} close={() => { setOpen(false) }} />

            <div className='hidden lg:flex h-screen flex-col'>
                <div className='flex-shrink'>
                    <ComponentTopBar />
                </div>
                <div className='flex flex-grow min-h-0 flex-col h-full overflow-y-auto px-96 py-12'>
                    <h1 className='flex-shrink text-4xl mb-8 font-display font-bold'>{t('navbar.account')}</h1>

                    <div className='flex flex-grow flex-col'>
                        <div className='flex items-center mb-5'>
                            <div className='rounded-full bg-accent-orange h-24 w-24 flex justify-center items-center mr-5'>
                                <p className='text-white font-bold font-display text-4xl'>{me.data.name[0].toUpperCase()}</p>
                            </div>
                            <div>
                                <p className='font-bold font-display text-3xl mb-1'>{me.data.name}</p>
                                <p className='text-sm mb-3'>{t('account.userGratification')}</p>
                            </div>
                        </div>

                        <p className='text-sm text-gray-500 mb-1'>{t('account.basicInformation')}</p>
                        <hr className='w-full border-gray-200 mb-3' />

                        <p className='text-sm'>{t('account.eduId')}</p>
                        <p className='text-2xl font-bold font-display mb-3'>{me.data.id}</p>

                        <p className='text-sm'>{t('account.phone')}</p>
                        <p className='text-2xl font-bold font-display mb-5'>{me.data.phone ?? t('account.unavailable')}</p>

                        <p className='text-sm text-gray-500 mb-1'>{t('account.statistics')}</p>
                        <hr className='w-full border-gray-200 mb-3' />

                        <p className='text-sm mb-1'>{t('account.purchaseHistory')}</p>
                        <button onClick={() => { navigate('/history') }} className='rounded-full w-48 py-2 px-5 font-display bg-accent-yellow-bg hover:bg-accent-orange-bg transition-colors duration-100 mb-3'>{t('account.viewHistory')}</button>

                        <p className='text-sm'>{t('account.totalSpent')}</p>
                        <p className='text-2xl font-bold font-display mb-3'>{meStatistics.data.totalSpent}</p>

                        <p className='text-sm'>{t('account.totalOrders')}</p>
                        <p className='text-2xl font-bold font-display mb-3'>{meStatistics.data.totalOrders}</p>

                        <p className='text-sm'>{t('account.totalCups')}</p>
                        <p className='text-2xl font-bold font-display mb-5'>{meStatistics.data.totalCups}</p>

                        <p className='text-xs text-gray-500 mb-1'>{t('account.privacy')}</p>
                        <hr className='w-full border-gray-200 mb-3' />

                        <p className='text-sm mb-3'>{t('account.privacyHint')}</p>

                        <button onClick={() => { persistentStorage.setToken(null); navigate('/') }} className='rounded-full w-48 py-2 px-5 font-display bg-accent-yellow-bg hover:bg-accent-orange-bg transition-colors duration-100 mb-3'>{t('account.logOut')}</button>

                        <button onClick={() => { setOpen(true) }} className='rounded-full text-white w-48 py-2 px-5 font-display bg-accent-red hover:bg-red-500 transition-colors duration-100 mb-3'>{t('account.deleteAccount')}</button>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    )
}