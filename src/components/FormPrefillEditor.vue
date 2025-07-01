<template>
  <div class="prefill-editor">
    <h3>Prefill Mapping for {{ formNode.data.name }}</h3>
    <table class="fields-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Prefill Source</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.fieldName">
          <td>
            <strong>{{ field.fieldSchema.title || field.fieldName }}</strong>
            <span class="field-type">[{{ field.fieldSchema.type }}]</span>
          </td>
          <td>
            <span v-if="prefillMappings[field.fieldName]">
              <template v-if="prefillMappings[field.fieldName]?.type === 'formField'">
                Prefilled from {{ prefillMappings[field.fieldName]?.formName || prefillMappings[field.fieldName]?.formId }}:{{ prefillMappings[field.fieldName]?.fieldName }}
              </template>
              <template v-else-if="prefillMappings[field.fieldName]?.type === 'global'">
                Global: {{ prefillMappings[field.fieldName]?.label || prefillMappings[field.fieldName]?.globalKey }}
              </template>
            </span>
            <span v-else class="none">None</span>
          </td>
          <td>
            <button class="edit-btn" @click="openSourceSelector(field.fieldName)">Edit</button>
            <button v-if="prefillMappings[field.fieldName]" class="clear-btn" @click="$emit('clear', field.fieldName)">X</button>
          </td>
        </tr>
      </tbody>
    </table>
    <PrefillSourceSelector
      :visible="showSourceSelector"
      :fieldName="editingFieldName"
      :sources="sourceOptions"
      :onSelect="onSelectSource"
      :onClose="closeSourceSelector"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getFieldsForFormNode, getPrefillSourcesForFormNode, type GraphNode } from '../services/api'
import type { PrefillMapping, PrefillSource } from '../types/prefill'
import PrefillSourceSelector from './PrefillSourceSelector.vue'

const props = defineProps<{
  formNode: GraphNode,
  forms: any[],
  graphData: any,
  prefillMappings: PrefillMapping
}>()

const emit = defineEmits(['edit', 'clear', 'updateMapping'])

const fields = computed(() => getFieldsForFormNode(props.formNode, props.forms))

// Modal state
const showSourceSelector = ref(false)
const editingFieldName = ref('')

// Compute real source options for the field being edited
const sourceOptions = computed(() => {
  if (!showSourceSelector.value || !editingFieldName.value) return []
  return getPrefillSourcesForFormNode(
    props.formNode,
    props.graphData.nodes,
    props.forms,
    props.graphData.edges
  )
})

function openSourceSelector(fieldName: string) {
  editingFieldName.value = fieldName
  showSourceSelector.value = true
}

function closeSourceSelector() {
  showSourceSelector.value = false
  editingFieldName.value = ''
}

function onSelectSource(source: PrefillSource) {
  emit('updateMapping', { fieldName: editingFieldName.value, source })
  closeSourceSelector()
}
</script>

<style scoped>
.prefill-editor {
  margin: 20px 0;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  color: #213547;
}
.prefill-editor h3 {
  margin-top: 0;
  color: #1976d2;
}
.fields-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
.fields-table th, .fields-table td {
  padding: 8px 12px;
  text-align: left;
}
.fields-table th {
  background: #e3eafc;
  color: #1976d2;
}
.fields-table tr:nth-child(even) {
  background: #f9f9fb;
}
.field-type {
  color: #888;
  font-size: 0.95em;
  margin-left: 8px;
}
.none {
  color: #bdbdbd;
  font-style: italic;
}
.edit-btn, .clear-btn {
  padding: 4px 10px;
  border-radius: 4px;
  border: none;
  margin-right: 4px;
  font-size: 0.95em;
  cursor: pointer;
}
.edit-btn {
  background: #1976d2;
  color: #fff;
}
.edit-btn:hover {
  background: #1251a3;
}
.clear-btn {
  background: #e57373;
  color: #fff;
}
.clear-btn:hover {
  background: #b71c1c;
}
</style> 