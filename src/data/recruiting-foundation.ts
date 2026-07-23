import type { GameState } from '@/types/game';

/**
 * PR 1 boundary only. Spendable RP, prospect state, and reserve mechanics are
 * intentionally absent until the approved Recruiting bundle.
 */
export function selectRecruitingFoundation(state: GameState) {
  return {
    cash: state.team.cash,
    manufacturerId: state.team.manufacturerId,
    recruitingPull: state.team.recruitingPull,
    spendableRp: undefined,
    activeStaffTraits: state.staff
      .filter((member) => member.active)
      .map((member) => member.trait),
    sponsorLeads: state.drivers.flatMap((driver) => driver.sponsorLeads),
    reserveCapacity: undefined,
  } as const;
}
