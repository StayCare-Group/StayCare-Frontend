import { ref, computed } from 'vue'

export function getItemCategoryKeyword(name) {
  const str = String(name || '').toLowerCase()
  if (str.includes('towel')) return 'Towel'
  if (str.includes('sheet')) return 'Sheet'
  if (str.includes('cover')) return 'Cover'
  if (str.includes('pillow')) return 'Pillow'
  if (str.includes('mat')) return 'Mat'
  if (str.includes('cloth')) return 'Cloth'
  if (str.includes('duvet')) return 'Duvet'
  return name || ''
}

export function useItemSorter(itemsRef, initialOrder = 'categoryAsc') {
  const sortOrder = ref(initialOrder)

  const sortedItems = computed(() => {
    const list = [...(itemsRef.value || [])]
    if (sortOrder.value === 'nameAsc') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    if (sortOrder.value === 'nameDesc') {
      return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    }
    if (sortOrder.value === 'categoryDesc') {
      return list.sort((a, b) => {
        const catA = getItemCategoryKeyword(a.name)
        const catB = getItemCategoryKeyword(b.name)
        const cmp = catB.localeCompare(catA)
        return cmp !== 0 ? cmp : (b.name || '').localeCompare(a.name || '')
      })
    }
    return list.sort((a, b) => {
      const catA = getItemCategoryKeyword(a.name)
      const catB = getItemCategoryKeyword(b.name)
      const cmp = catA.localeCompare(catB)
      return cmp !== 0 ? cmp : (a.name || '').localeCompare(b.name || '')
    })
  })

  return {
    sortOrder,
    sortedItems,
  }
}
