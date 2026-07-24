# Stock Car Dynasty implementation roadmap

The latest approved design direction is authoritative. Each bundle ships from
its own branch and draft pull request. A later bundle does not begin until the
previous bundle is tested, approved, and merged.

## 1. Foundation, Economy, and Repairs

- Canonical manufacturers, drivers, archetypes, and shared typed data
- Bible payout table, starter sponsor payment, and weekend operating cost
- Bible damage classifications and context-aware Repair Bay economics
- Exact-once transaction history and version 2 state normalization

Version 2 adds persistent economy transaction records, damage classifications,
driver sponsor leads, and canonical archetype typing. Normalization maps obsolete
Ranger manufacturer identifiers to Chevrolat, corrects Aiden Voss without
resetting campaign progress, derives vehicle damage state from condition, and
preserves processed transaction identifiers so old actions are not replayed.

## 2. Driver Market and Recruiting (state version 3)

- Approximately 20 persistent prospects
- All 26 Bible recruiting actions and RP prices through 300 RP plus cash
- Three actions per prospect per weekend
- Starting RP 100; 100 RP per settled weekend; carryover with no initial cap
- Recruiting Pull separate from spendable RP
- Four locked scouting bands, archetype discovery, and six social actions
- Prospect Engagement and Recruiting Visibility
- Deterministic action variance from -10% through +10%
- Repeat effects at 100%, 60%, then 30%; applicable staff boost at 10%
- Private Test Day at 250 RP and $20,000
- Deterministic offers with a 75 acceptance threshold
- One reserve/development slot, one- through three-year offers
- Signing bonus at 10% of annual salary with a $5,000 minimum
- Rejected offers consume RP but not cash
- Relationship depth rewards distinct recruiting pathways
- Prospect sponsor backing remains separate from active Apex sponsors
- Version 2 campaigns normalize to 100 RP, 44 Visibility, the prototype market,
  empty campaigns, and an open reserve slot without retroactive RP or settlement
  replay; existing cash, EXP, calendar, vehicles, repairs, and economy ledgers
  remain intact

## 3. 32-Car Race Field Expansion (state version 4)

- Persistent 32-car field: two Apex entries and 30 centralized fictional opponents
- 17 organizations: mostly two-car teams with two one-car opponent programs
- Provisional distribution: 12 Chevrolat, 11 Fard, and 9 Toyoda entries
- Centralized provisional driver/team weighting: 60% driver and 40% equipment
- Stable seeded qualifying and races with identifier-based tie-breaking
- Focused timing tower capped at 10 rows around the leader and both Apex cars
- Concise grid/results summaries with dedicated full 32-car views
- Persistent driver standings with provisional 32-to-1 finish points and no bonuses
- Portrait performance and locked payout-table compatibility
- Version 3 campaigns receive the authoritative 32-entry roster and zeroed
  standings without retroactive results or points. Version 4 normalization
  preserves cash, EXP, calendar, damage/readiness, recruiting, RP, reserve
  driver, repairs, sponsor/economy state, and processed transaction ledgers.
- Manufacturer remains identity/presentation data only. Manufacturer
  performance, transfers, AI finances, and reserve racing remain future work.

## 4. Race Strategy, Tires, and Archetype Integration

- Pace, pit-window, driver-instruction, and stage-plan choices
- Tire wear and long-run falloff
- Full race-day archetype effects
- Aggressive Driver incident risk
- Reliable Journeyman equipment protection
- Track-specific strengths and risks

## 5. Brand, Social Media, Sponsors, and Loyalty

- Brand/Social management screen
- Sponsor market, objectives, loyalty, payments, and bonuses
- Driver sponsor portfolios and sponsor-backed prospect conditions
- Aiden Voss's dormant Coastal Marine Supply lead
- Organization-wide Social Media staff effects

## 6. Development, Facilities, and Progression Feedback

- Scouting Office, Development Apartments, Gym, and manufacturer progression
- Reserve-driver development
- EXP change history and reasons
- Development plans, promotion, and replacement groundwork
- Facility upgrade costs and effects
