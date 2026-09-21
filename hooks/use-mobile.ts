import { useSyncExternalStore } from "react"

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = matchMedia(query)
      mql.addEventListener("change", cb)
      return () => mql.removeEventListener("change", cb)
    },
    () => matchMedia(query).matches,
    () => false // server render: assume desktop; corrected on hydration
  )
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)")
