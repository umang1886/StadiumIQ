import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useQueueRealtime(venueId, onUpdate) {
  useEffect(() => {
    if (!venueId) return
    const channel = supabase
      .channel(`queue-updates-${venueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_data'
      }, payload => onUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [venueId])
}

export function useCrowdDensityRealtime(venueId, onUpdate) {
  useEffect(() => {
    if (!venueId) return
    const channel = supabase
      .channel(`density-updates-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'crowd_density_snapshots'
      }, payload => onUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [venueId])
}

export function useSyncGroupRealtime(groupId, onMemberUpdate) {
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`sync-group-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_group_members',
        filter: `group_id=eq.${groupId}`
      }, payload => onMemberUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [groupId])
}

export function useOrderRealtime(orderId, onUpdate) {
  useEffect(() => {
    if (!orderId) return
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, payload => onUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orderId])
}

export function useAlertRealtime(venueId, onNewAlert) {
  useEffect(() => {
    if (!venueId) return
    const channel = supabase
      .channel(`alerts-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `venue_id=eq.${venueId}`
      }, payload => onNewAlert(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [venueId])
}
