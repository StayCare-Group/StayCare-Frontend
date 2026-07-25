<template>
  <div :class="showTimeWindow ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''">
    <div>
      <label v-if="showLabel" class="block text-sm font-medium text-gray-600 mb-1">
        {{ label || t('admin.pickupDate') }}
      </label>
      <input
        :value="pickupDate"
        @input="onDateInput($event.target.value)"
        type="date"
        required
        :min="minDate"
        :disabled="disabled"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
    <div v-if="showTimeWindow">
      <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('admin.timeWindow') }}</label>
      <select
        :value="pickupTimeWindow"
        @change="emit('update:pickupTimeWindow', $event.target.value)"
        required
        :disabled="disabled"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{{ t('admin.selectTimeWindow') }}</option>
        <option v-for="tw in availableTimeWindows" :key="tw" :value="tw">{{ tw }}</option>
      </select>
      <p v-if="!availableTimeWindows.length && !isAdminOrStaff" class="text-xs text-amber-500 mt-1">
        {{ t('admin.noTimeWindows') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTodayDateString, normalizeDateString } from '../../utils/date'

const ALL_TIME_WINDOWS = ['08:00 - 10:00', '09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00', '14:00 - 16:00', '15:00 - 17:00']

const props = defineProps({
  pickupDate: {
    type: String,
    default: '',
  },
  pickupTimeWindow: {
    type: String,
    default: '',
  },
  minDate: {
    type: String,
    default: () => getTodayDateString(),
  },
  isAdminOrStaff: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  showTimeWindow: {
    type: Boolean,
    default: true,
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:pickupDate', 'update:pickupTimeWindow'])

const { t } = useI18n()

const todayStr = computed(() => getTodayDateString())

const availableTimeWindows = computed(() => {
  if (!props.showTimeWindow) return []
  if (props.isAdminOrStaff) return ALL_TIME_WINDOWS
  const normalizedSelected = normalizeDateString(props.pickupDate)
  if (normalizedSelected && normalizedSelected !== todayStr.value) {
    return ALL_TIME_WINDOWS
  }
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return ALL_TIME_WINDOWS.filter(tw => {
    const [startStr] = tw.split(' - ')
    const [h, m] = startStr.split(':').map(Number)
    return (h * 60 + m + 30) > nowMinutes
  })
})

function onDateInput(newDateVal) {
  emit('update:pickupDate', newDateVal)
}

watch(availableTimeWindows, (windows) => {
  if (props.showTimeWindow && props.pickupTimeWindow && !windows.includes(props.pickupTimeWindow)) {
    emit('update:pickupTimeWindow', '')
  }
})
</script>
