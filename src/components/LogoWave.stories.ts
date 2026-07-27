import LogoWave from './LogoWave.astro';
import LogoWaveStage from '../stories/LogoWaveStage.astro';
import WaveTextStage from '../stories/WaveTextStage.astro';

export default {
  title: 'Components/LogoWave',
  component: LogoWave,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Blatant Bold** width-wave type (OpenType width alts).

### Morph model
- **full** masters: continuous path lerp default → alt1 → alt2
- **alts_only**: morph **alt1↔alt2**, **extrapolate** \`t < 0\` for narrow/rest
- **static** (\`I\`, \`X\`, \`Y\`): no stretch

### Interaction
- **Hover**: peak under cursor, falloff on neighbors
- **Intro / playSweep**: left→right traveling peak, **ease-out only**
- Site logo: intro on every load (\`intro="always"\`)
- **Page transitions**: same engine via \`mountWaveText\` + \`playSweep\` on the mask label

### API
- \`initLogoWave(root, data, opts)\` — pre-rendered markup (navbar)
- \`mountWaveText(host, text, data, opts)\` — dynamic strings (transitions)
- \`handle.playSweep({ durationMs, peak })\` — scripted L→R wave

### Files
- \`LogoWave.astro\` · \`scripts/logo-wave.ts\` · \`data/blatant-wave-glyphs.json\` · \`scripts/page-mask.ts\`
        `.trim(),
      },
    },
  },
};

/** Interactive logo — intro every Storybook remount */
export const Interactive = {
  name: 'Logo · hover + intro',
  component: LogoWaveStage,
  args: {
    inHeader: false,
    intro: 'always',
    hint: 'Intro L→R (ease-out). Then hover to scrub the radial peak.',
  },
};

/** Same mark inside nav chrome */
export const InNavbar = {
  name: 'Logo · in navbar',
  component: LogoWaveStage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    inHeader: true,
    intro: 'always',
    hint: 'Navbar preview — intro every mount, then hover.',
  },
};

/** Hover only */
export const HoverOnly = {
  name: 'Logo · hover only',
  component: LogoWaveStage,
  args: {
    inHeader: false,
    intro: 'off',
    hint: 'No intro — pointer-driven wave only.',
  },
};

/** Dynamic transition-style word */
export const TransitionWord = {
  name: 'Transition · RESUME',
  component: WaveTextStage,
  args: {
    text: 'RESUME',
    color: '#008fff',
    autoSweep: true,
    hint: 'Same wave as page-transition labels (mountWaveText). Blue = cover phase. Replay or hover.',
  },
};

export const TransitionWordContact = {
  name: 'Transition · CONTACT',
  component: WaveTextStage,
  args: {
    text: 'CONTACT',
    color: '#008fff',
    autoSweep: true,
    hint: 'Another nav label. Use Replay sweep to re-run L→R ease-out.',
  },
};

export const TransitionWordReveal = {
  name: 'Transition · reveal (black)',
  component: WaveTextStage,
  args: {
    text: 'STAIRCASE',
    color: '#000000',
    autoSweep: true,
    hint: 'Black type as on the blue reveal plate. Stage surface is dark — focus on the wave motion.',
  },
  parameters: {
    backgrounds: { default: 'portfolio' },
  },
};

/** Bare component */
export const Default = {
  name: 'Logo · production',
  component: LogoWave,
};
