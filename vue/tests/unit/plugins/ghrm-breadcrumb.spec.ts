import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Router-link stub so we don't need full router setup
const RouterLinkStub = defineComponent({
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
})

import GhrmBreadcrumb from '../../../../plugins/ghrm/src/components/GhrmBreadcrumb.vue'

const defaultConfig = {
  separator: '/',
  root_name: 'Home',
  root_slug: '/',
  show_category: true,
  max_label_length: 40,
  css: '',
}

function mountBreadcrumb(props: Record<string, unknown>) {
  return mount(GhrmBreadcrumb, {
    props,
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('GhrmBreadcrumb — root only', () => {
  it('renders root crumb with configured name', () => {
    const w = mountBreadcrumb({ config: defaultConfig })
    expect(w.text()).toContain('Home')
  })

  it('uses root_slug as link href', () => {
    const w = mountBreadcrumb({ config: { ...defaultConfig, root_slug: '/start' } })
    expect(w.find('a').attributes('href')).toBe('/start')
  })

  it('does not render category crumb when categoryLabel is absent', () => {
    const w = mountBreadcrumb({ config: defaultConfig })
    expect(w.text()).not.toContain('/')
  })
})

describe('GhrmBreadcrumb — catalogue page (root + category)', () => {
  it('renders separator between root and category', () => {
    const w = mountBreadcrumb({
      config: defaultConfig,
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    expect(w.text()).toContain('/')
    expect(w.text()).toContain('Backend')
  })

  it('uses custom separator', () => {
    const w = mountBreadcrumb({
      config: { ...defaultConfig, separator: '›' },
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    expect(w.text()).toContain('›')
  })

  it('category is a router-link when categoryTo is provided', () => {
    const w = mountBreadcrumb({
      config: defaultConfig,
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    const links = w.findAll('a')
    expect(links.some((a) => a.attributes('href') === '/category/backend')).toBe(true)
  })

  it('hides category crumb when show_category is false', () => {
    const w = mountBreadcrumb({
      config: { ...defaultConfig, show_category: false },
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    expect(w.text()).not.toContain('Backend')
  })
})

describe('GhrmBreadcrumb — detail page (root + category + package)', () => {
  it('renders three crumbs: root, category, package', () => {
    const w = mountBreadcrumb({
      config: defaultConfig,
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
      packageName: 'LoopAI Core',
    })
    expect(w.text()).toContain('Home')
    expect(w.text()).toContain('Backend')
    expect(w.text()).toContain('LoopAI Core')
  })

  it('package name is not a link (current page)', () => {
    const w = mountBreadcrumb({
      config: defaultConfig,
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
      packageName: 'LoopAI Core',
    })
    const current = w.findAll('.ghrm-breadcrumb__current')
    expect(current.some((el) => el.text() === 'LoopAI Core')).toBe(true)
  })
})

describe('GhrmBreadcrumb — truncation', () => {
  it('truncates labels longer than max_label_length', () => {
    const longName = 'A'.repeat(50)
    const w = mountBreadcrumb({
      config: { ...defaultConfig, max_label_length: 20 },
      packageName: longName,
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    const text = w.text()
    expect(text).toContain('…')
    // truncated to 20 chars + ellipsis
    expect(text).not.toContain('A'.repeat(21))
  })

  it('does not truncate when label fits', () => {
    const w = mountBreadcrumb({
      config: { ...defaultConfig, max_label_length: 40 },
      packageName: 'Short',
      categoryLabel: 'Backend',
      categoryTo: '/category/backend',
    })
    expect(w.text()).toContain('Short')
    expect(w.text()).not.toContain('…')
  })
})

describe('GhrmBreadcrumb — CSS injection', () => {
  it('injects scoped style tag when css is provided', () => {
    const w = mountBreadcrumb({
      config: { ...defaultConfig, css: '.ghrm-breadcrumb { color: red; }' },
    })
    expect(w.html()).toContain('color: red')
  })

  it('omits style tag when css is empty', () => {
    const w = mountBreadcrumb({ config: { ...defaultConfig, css: '' } })
    expect(w.html()).not.toContain('<style')
  })
})
