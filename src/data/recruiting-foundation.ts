import type { GameState } from '@/types/game';

/** Compact team-facing recruiting summary backed by authoritative state. */
export function selectRecruitingFoundation(state: GameState) {
  return {
    cash: state.team.cash,
    manufacturerId: state.team.manufacturerId,
    recruitingPull: state.team.recruitingPull,
    spendableRp: state.recruiting.spendableRp,
    recruitingVisibility: state.recruiting.visibility,
    availableProspects: state.recruiting.prospects.filter(
      (prospect) => {
        const campaign = state.recruiting.campaigns[prospect.id];
        return !campaign?.signed && !campaign?.signedByTeamId;
      },
    ).length,
    activeStaffTraits: state.staff
      .filter((member) => member.active)
      .map((member) => member.trait),
    sponsorLeads: state.drivers.flatMap((driver) => driver.sponsorLeads),
    reserveCapacity: state.recruiting.reserveDriver ? 0 : 1,
  } as const;
}
