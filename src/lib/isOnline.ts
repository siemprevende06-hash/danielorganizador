let forcedOffline = false

export const setForcedOffline = (v: boolean) => { forcedOffline = v }

export const isOnline = () => {
  if (forcedOffline) return false
  if (typeof navigator === "undefined") return true
  if (navigator.onLine === false) return false
  return true
}
