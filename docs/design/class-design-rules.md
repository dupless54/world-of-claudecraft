# Class Design Rules

Status: living design standard for class balance and combat-kit work.

World of ClaudeCraft uses the same deterministic simulation on desktop, mobile, the
authoritative server, and the headless environment. A spec must remain readable on a small
screen, understandable from its tooltips, and measurable in the shared simulation.

## Spec combat budget

Every specialization owns exactly five spec combat slots:

1. One resource builder.
2. One resource spender.
3. One reactive proc.
4. One offensive cooldown.
5. One defensive cooldown.

The builder, spender, offensive cooldown, and defensive cooldown are the four active spec
actions. The proc is automatic, visible, nonstacking, and changes the player's next decision.

Shared class utility can remain outside these five slots when it does not add spec throughput.
Examples include one movement action, one interrupt, and a small amount of class-defining
control. Shared utility must not become a second rotation, a maintenance buff, or a hidden
damage source.

Area, execute, mobility, and support behavior should modify or replace one of the five slots.
They do not create a sixth spec action.

## Passive budget

A spec may have:

- One simple resource rule.
- One reactive proc, which is already one of the five slots.
- One mastery that strengthens the resource rule or proc instead of creating another system.

An always-on rule is not a reason to create a separate player-facing passive if the relevant
ability tooltip can explain it. A passive stays only when it changes what the player does.
Background percentages that merely increase damage, critical damage, haste, resource income,
or cooldown recovery should be folded into the owning ability's baseline budget.

The following patterns are out of spec:

- A proc that creates or amplifies another proc.
- An on-kill effect that stacks damage or critical chance.
- A hidden every-N-actions counter with a throughput multiplier.
- One effect granting both damage and resource generation.
- One effect granting both damage and haste.
- Resource spending reducing several offensive cooldowns at once.
- Several damage-done auras active on the same character.

Core combat state and the selected offensive cooldown may coexist only when their combined
budget is measured. The offensive cooldown must remain the sole major burst effect.

## Talent rules

Talents 2.0 keeps six choice rows at levels 5, 8, 11, 14, 17, and 20. Each option modifies or
replaces an existing slot. A talent never adds another spec action or an independent throughput
passive.

The rows have stable jobs:

| Level | Row job | Throughput rule |
|---|---|---|
| 5 | Mobility | No direct damage increase |
| 8 | Survival | No direct damage increase |
| 11 | Control | Damage is incidental, not a rotation gain |
| 14 | Resource behavior | Changes cadence or reliability, never resource plus damage |
| 17 | Offensive slot | Selects exactly one major offensive effect |
| 20 | Offensive specialization | Modifies or replaces the selected offensive slot |

A level 20 option may turn the offensive slot into a single-target, area, or group-support
version. It does not grant a second cooldown that stacks with the level 17 choice.

Build variety comes from lateral choices:

- Reliability versus burst.
- Single target versus area damage.
- Personal output versus group support.
- Mobility versus protection.

It does not come from collecting every available multiplier.

## Interestingness test

Every action, proc, and talent must answer at least one of these questions:

- Does it change what I press next?
- Does it change when I spend my resource?
- Does it change which target I choose?
- Does it create a clear risk or timing tradeoff?
- Does it replace one playstyle with another?

If the answer to all five is no, remove the mechanic or fold its output into an existing slot.

## Power ceiling

At the level cap, comparable damage specializations should remain within a 10 to 15 percent
single-target DPS band with equivalent gear. Raid observations are evidence, but the enforced
gate must normalize encounter, duration, target count, gear, and active buffs.

Burst and area profiles are reported separately. An area specialist may lead an area profile,
but that strength must be paid for by a lateral talent choice instead of stacking on top of the
best single-target build.

The measurement contract lives in `docs/design/spell-balance-framework.md`.

## Change process

1. Pin the current behavior with a deterministic fixture.
2. Change one power source or one slot at a time.
3. Re-run single-target, burst, and area profiles.
4. Preserve saved talent selections by keeping stable option ids when an option is replaced.
5. Use PBE validation for a full kit consolidation.

Gameplay numbers require an existing classic-era formula, a checked-in reference, or a measured
simulation result. When no target exists, add the measurement first rather than inventing a
coefficient.
