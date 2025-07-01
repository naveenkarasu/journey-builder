<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal scrollable-modal">
      <h4>Select Prefill Source for <span class="field-name">{{ fieldName }}</span></h4>
      <div class="selector-step">
        <label>Dependency Type:</label>
        <select v-model="selectedType" class="selector-dropdown">
          <option disabled value="">Select type</option>
          <option value="direct">Direct Dependencies</option>
          <option value="transitive">Transitive Dependencies</option>
          <option value="global">Global Sources</option>
        </select>
      </div>
      <div v-if="selectedType === 'direct' || selectedType === 'transitive'" class="selector-step">
        <label>Form:</label>
        <select v-model="selectedFormId" class="selector-dropdown">
          <option disabled value="">Select form</option>
          <option v-for="form in filteredForms" :key="form.formId" :value="form.formId">
            {{ form.formName }}
          </option>
        </select>
      </div>
      <div v-if="(selectedType === 'direct' || selectedType === 'transitive') && selectedFormId" class="selector-step">
        <label>Field:</label>
        <select v-model="selectedFieldName" class="selector-dropdown">
          <option disabled value="">Select field</option>
          <option v-for="field in filteredFields" :key="field.fieldName" :value="field.fieldName">
            {{ field.fieldName }}
          </option>
        </select>
      </div>
      <div v-if="selectedType === 'global'" class="selector-step">
        <label>Global Source:</label>
        <select v-model="selectedGlobalKey" class="selector-dropdown">
          <option disabled value="">Select global source</option>
          <option v-for="source in globalSources" :key="source.globalKey" :value="source.globalKey">
            {{ source.label || source.globalKey }}
          </option>
        </select>
      </div>
      <div class="selector-actions">
        <button class="confirm-btn" :disabled="!canConfirm" @click="confirmSelection">Confirm</button>
        <button class="close-btn" @click="onClose">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PrefillSource } from '../types/prefill'

const props = defineProps<{
  visible: boolean,
  fieldName: string,
  sources: PrefillSource[],
  onSelect: (source: PrefillSource) => void,
  onClose: () => void
}>()

const selectedType = ref('')
const selectedFormId = ref('')
const selectedFieldName = ref('')
const selectedGlobalKey = ref('')

const directForms = computed(() => props.sources.filter(s => s.type === 'formField' && s.formName?.startsWith('Direct:')))
const transitiveForms = computed(() => props.sources.filter(s => s.type === 'formField' && s.formName?.startsWith('Transitive:')))
const globalSources = computed(() => props.sources.filter(s => s.type === 'global'))

const filteredForms = computed(() => {
  if (selectedType.value === 'direct') return uniqueForms(directForms.value)
  if (selectedType.value === 'transitive') return uniqueForms(transitiveForms.value)
  return []
})

const filteredFields = computed(() => {
  if (!selectedFormId.value) return []
  const forms = selectedType.value === 'direct' ? directForms.value : transitiveForms.value
  return forms.filter(f => f.formId === selectedFormId.value)
})

const canConfirm = computed(() => {
  if (selectedType.value === 'global') return !!selectedGlobalKey.value
  if ((selectedType.value === 'direct' || selectedType.value === 'transitive')) return !!selectedFormId.value && !!selectedFieldName.value
  return false
})

function uniqueForms(sources: PrefillSource[]) {
  const seen = new Set<string>()
  const forms: { formId: string, formName: string }[] = []
  for (const s of sources) {
    if (s.type === 'formField' && !seen.has(s.formId)) {
      forms.push({ formId: s.formId, formName: s.formName || s.formId })
      seen.add(s.formId)
    }
  }
  return forms
}

function confirmSelection() {
  if (selectedType.value === 'global') {
    const source = globalSources.value.find(s => s.type === 'global' && s.globalKey === selectedGlobalKey.value)
    if (source) props.onSelect(source)
  } else if ((selectedType.value === 'direct' || selectedType.value === 'transitive') && selectedFormId.value && selectedFieldName.value) {
    const forms = selectedType.value === 'direct' ? directForms.value : transitiveForms.value
    const source = forms.find(f => f.formId === selectedFormId.value && f.fieldName === selectedFieldName.value)
    if (source) props.onSelect(source)
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    selectedType.value = ''
    selectedFormId.value = ''
    selectedFieldName.value = ''
    selectedGlobalKey.value = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.scrollable-modal {
  max-height: 80vh;
  overflow-y: auto;
}
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 28px 24px 18px 24px;
  min-width: 340px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  color: #213547;
}
.field-name {
  color: #1976d2;
  font-weight: 600;
}
.selector-step {
  margin: 16px 0 0 0;
  display: flex;
  flex-direction: column;
}
.selector-dropdown {
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #bdbdbd;
  font-size: 1em;
  color: #213547;
  background: #f9f9fb;
  max-width: 100%;
}
.selector-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.confirm-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-btn:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}
.confirm-btn:not(:disabled):hover {
  background: #1251a3;
}
.close-btn {
  background: #e57373;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 1em;
  cursor: pointer;
}
.close-btn:hover {
  background: #b71c1c;
}
</style> 