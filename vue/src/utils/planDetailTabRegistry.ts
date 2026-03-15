import { ref } from 'vue'
import type { Component } from 'vue'

export interface PlanDetailTab {
  id: string
  label: string
  component: Component
  /**
   * Optional async predicate evaluated by TarifPlanDetail after the plan loads.
   * Receives the plan UUID. Return true to show the tab, false to hide it.
   * Tabs without a condition are always shown.
   */
  condition?: (planId: string) => Promise<boolean>
}

const tabs = ref<PlanDetailTab[]>([])

export const planDetailTabRegistry = {
  register(tab: PlanDetailTab): void {
    if (!tabs.value.find(t => t.id === tab.id)) {
      tabs.value.push(tab)
    }
  },
  tabs,
}
