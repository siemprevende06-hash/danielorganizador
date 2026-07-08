import { useState, useEffect, useCallback } from 'react'
import { EFFORT_DEFAULTS } from '@/data/areaMetricsData'
import { supabase } from '@/integrations/supabase/client'

type EffortMap = Record<string, { bajo: number; normal: number; alto: number }>

const SETTING_KEY = 'effort_config'

async function fetchAll(): Promise<EffortMap> {
  const { data } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle()
  const stored = (data?.setting_value as EffortMap) || {}
  return { ...EFFORT_DEFAULTS, ...stored }
}

async function persistAll(data: EffortMap) {
  await supabase
    .from('app_settings')
    .upsert(
      { setting_key: SETTING_KEY, setting_value: data as any },
      { onConflict: 'user_id,setting_key' }
    )
}

export function useEffortConfig() {
  const [allConfigs, setAllConfigs] = useState<EffortMap>({ ...EFFORT_DEFAULTS })

  useEffect(() => {
    fetchAll().then(setAllConfigs)
  }, [])

  const getConfig = useCallback(
    (areaId: string) =>
      allConfigs[areaId] || EFFORT_DEFAULTS[areaId] || { bajo: 15, normal: 30, alto: 45 },
    [allConfigs]
  )

  const updateConfig = useCallback(
    async (areaId: string, values: { bajo: number; normal: number; alto: number }) => {
      const next = { ...allConfigs, [areaId]: values }
      setAllConfigs(next)
      await persistAll(next)
    },
    [allConfigs]
  )

  return { allConfigs, getConfig, updateConfig }
}
