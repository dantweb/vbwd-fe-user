# Taro Plugin Refactoring Guide

## Overview
The Taro plugin has been refactored to follow SOLID principles. The main `Taro.vue` component (1176 lines) has been split into 8 focused, single-responsibility components.

---

## New Components

### Display-Only Components (Pure Presentation)

| Component | Purpose | Props | Events |
|-----------|---------|-------|--------|
| **DailyLimitsCard.vue** | Show daily usage limits | `limits`, `loading` | `@refresh` |
| **SessionExpiryWarning.vue** | Warn when session < 3 min | `minutesRemaining` | — |
| **SessionMetrics.vue** | Show follow-ups, tokens, time | metrics (4 props) | — |
| **ConversationBox.vue** | Display message history | `messages: Message[]` | — |
| **TaroErrorState.vue** | Display error messages | `error: string` | `@retry` |
| **EmptySessionCard.vue** | Show empty state + CTA | `loading`, `canCreate` | `@create-session` |

### Orchestrator Components

| Component | Purpose | Props | Events |
|-----------|---------|-------|--------|
| **CardsGrid.vue** | Display 3 cards | `cards`, `openedCardIds` | `@card-click`, `@card-fullscreen` |
| **OracleDialog.vue** | Handle oracle interaction | all oracle state | multiple oracle events |

### Refactored Main Component

| Component | Purpose | Lines | Responsibilities |
|-----------|---------|-------|------------------|
| **Taro.vue** | Orchestrate all components | ~200 | Session management, event delegation |

---

## File Structure

```
src/
├── Taro.vue (REFACTORED - 200 lines)
├── Taro.refactored.vue (NEW - refactored version)
├── components/
│   ├── CardDisplay.vue (existing)
│   ├── CardDetailModal.vue (existing)
│   ├── FormattedMessage.vue (existing)
│   ├── SessionHistory.vue (existing)
│   ├── DailyLimitsCard.vue (NEW)
│   ├── SessionExpiryWarning.vue (NEW)
│   ├── CardsGrid.vue (NEW)
│   ├── SessionMetrics.vue (NEW)
│   ├── ConversationBox.vue (NEW)
│   ├── OracleDialog.vue (NEW)
│   ├── EmptySessionCard.vue (NEW)
│   └── TaroErrorState.vue (NEW)
├── stores/
│   └── taro.ts (existing)
└── utils/
    └── markdownFormatter.ts (existing)
```

---

## Migration Checklist

### Before Starting
- [ ] Backup current `Taro.vue`
- [ ] Ensure all tests pass
- [ ] Create feature branch `refactor/taro-solid`

### Implementation
- [ ] Copy all new components from `components/` directory
- [ ] Replace `Taro.vue` with refactored version from `Taro.refactored.vue`
- [ ] Update any local imports of Taro.vue
- [ ] Verify all components are imported correctly

### Testing
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Check no console warnings/errors
- [ ] Verify UI renders correctly
- [ ] Test all features:
  - [ ] Create session
  - [ ] Click cards
  - [ ] View fullscreen
  - [ ] Oracle dialog
  - [ ] Submit question
  - [ ] Close session

### Deployment
- [ ] Merge refactor branch to main
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production

---

## Component Dependencies

```
Taro.vue (Orchestrator)
├── DailyLimitsCard
├── SessionExpiryWarning
├── CardsGrid
│   └── CardDisplay (existing)
├── SessionMetrics
├── OracleDialog
│   ├── ConversationBox
│   │   └── FormattedMessage (existing)
│   └── Form inputs
├── EmptySessionCard
├── TaroErrorState
└── CardDetailModal (existing)
```

---

## Props & Events Reference

### DailyLimitsCard
```vue
<DailyLimitsCard
  :limits="{ daily_total: 5, daily_remaining: 2, plan_name: 'Pro' }"
  :loading="isRefreshing"
  @refresh="refreshLimits"
/>
```

### SessionExpiryWarning
```vue
<SessionExpiryWarning :minutes-remaining="2" />
<!-- Only displays if minutesRemaining <= 3 -->
```

### CardsGrid
```vue
<CardsGrid
  :cards="session.cards"
  :opened-card-ids="openedCards"
  @card-click="taroStore.openCard"
  @card-fullscreen="showCardFullscreen"
/>
```

### SessionMetrics
```vue
<SessionMetrics
  :follow-ups-used="1"
  :max-follow-ups="3"
  :tokens-used="15"
  :time-remaining="20"
/>
```

### ConversationBox
```vue
<ConversationBox
  :messages="[
    { role: 'oracle', content: '...', timestamp: '2026-02-17T...' },
    { role: 'user', content: '...', timestamp: '2026-02-17T...' }
  ]"
/>
```

### OracleDialog
```vue
<OracleDialog
  :phase="'asking_situation'"
  :messages="conversationMessages"
  :situation-text="situationText"
  :follow-up-question="followUpQuestion"
  :loading="isLoading"
  @explain-cards="askCardExplanation"
  @discuss-situation="transitionPhase"
  @update-situation="updateSituation"
  @submit-situation="submitSituation"
  @update-question="updateQuestion"
  @submit-question="submitQuestion"
/>
```

### EmptySessionCard
```vue
<EmptySessionCard
  :loading="isCreating"
  :can-create="canCreateSession"
  @create-session="createNewSession"
/>
```

### TaroErrorState
```vue
<TaroErrorState
  :error="errorMessage"
  @retry="retryOperation"
/>
```

---

## Best Practices

### ✅ DO

```vue
<!-- Use prop drilling for clear data flow -->
<DailyLimitsCard :limits="taroStore.dailyLimits" />

<!-- Keep components focused -->
<!-- SessionMetrics only displays metrics -->

<!-- Use event emission for child->parent communication -->
<OracleDialog @submit-situation="submitSituation" />

<!-- Pass minimal props -->
<SessionMetrics :follow-ups-used="5" :max-follow-ups="10" />
```

### ❌ DON'T

```vue
<!-- Don't pass entire store -->
<DailyLimitsCard :store="taroStore" />

<!-- Don't put business logic in display components -->
<!-- SessionMetrics should not call API -->

<!-- Don't pass callbacks as event listeners -->
<CardsGrid @card-click="(id) => taroStore.openCard(id)" />
<!-- Instead: @card-click="taroStore.openCard" in parent -->

<!-- Don't pass unneeded data -->
<SessionMetrics :session="entireSessionObject" />
<!-- Instead: :follow-ups-used="session.follow_up_count" -->
```

---

## Troubleshooting

### Component not rendering
- Check if component is imported in Taro.vue
- Verify component file exists in correct location
- Check for typos in component name

### Props validation error
- Check prop types match expected format
- Verify props passed from parent match component definition
- Use Vue DevTools to inspect component props

### Events not firing
- Check event name matches exactly (case-sensitive)
- Verify parent has `@event-name` listener
- Check component calls `$emit('event-name')` correctly
- Use Vue DevTools to see emitted events

### Styling issues
- Check CSS classes match component template
- Verify CSS variables are defined
- Use browser DevTools to inspect computed styles
- Check media queries are correct

---

## Performance Considerations

### Optimizations Already Applied
1. **Component Splitting** - Smaller components render faster
2. **Lazy Loading** - CardDetailModal rendered conditionally
3. **Event Delegation** - Avoid propagation overhead
4. **Memoization** - Use `computed()` for expensive calculations

### Further Optimizations (if needed)
```typescript
// Lazy load components
const OracleDialog = defineAsyncComponent(
  () => import('./components/OracleDialog.vue')
);

// Memoize expensive computations
const wordCount = computed(() => {
  return situationText.value.trim().split(/\s+/).length;
});

// Use v-show for frequently toggled elements
<div v-show="isVisible">...</div>
```

---

## Testing

### Unit Test Example
```typescript
import { mount } from '@vue/test-utils';
import DailyLimitsCard from '@/components/DailyLimitsCard.vue';

describe('DailyLimitsCard', () => {
  it('displays limits correctly', () => {
    const wrapper = mount(DailyLimitsCard, {
      props: {
        limits: {
          daily_total: 5,
          daily_remaining: 2,
          plan_name: 'Pro'
        },
        loading: false
      }
    });

    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('Pro');
  });

  it('emits refresh event when button clicked', async () => {
    const wrapper = mount(DailyLimitsCard, {
      props: { limits: null, loading: false }
    });

    await wrapper.find('.btn-icon').trigger('click');
    expect(wrapper.emitted('refresh')).toHaveLength(1);
  });
});
```

---

## Questions & Support

For issues or questions about the refactoring:
1. Check this guide first
2. Review the component source code (comments explain logic)
3. Check the comprehensive refactoring report: `14-taro-refactoring-solid.md`
4. Look at test examples in `__tests__/` directory

---

## Related Documentation

- **Refactoring Report**: `docs/devlog/20260217/report/14-taro-refactoring-solid.md`
- **Plugin Architecture**: `CLAUDE.md` - Plugin system overview
- **Development Guide**: `docs/README.md`
- **Component API**: Check component files for prop/event details

---

## Summary

The Taro plugin has been successfully refactored to follow SOLID principles:

✅ **Single Responsibility** - Each component has one purpose
✅ **Open/Closed** - Extensible via props without modification
✅ **Liskov Substitution** - Consistent component patterns
✅ **Interface Segregation** - Minimal, focused props
✅ **Dependency Inversion** - Abstraction-based dependencies

**Benefits:**
- 83% smaller main component (1176 → 200 lines)
- Much easier to test
- Much easier to maintain
- Much easier to extend
- Clear architecture
