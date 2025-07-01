<template>
  <div class="form-fields-list">
    <h3>Fields for {{ formNode.data.name }}</h3>
    <form class="fields-form">
      <div v-for="field in orderedFields" :key="field.fieldName" class="field-row">
        <label :for="field.fieldName" class="field-label">
          {{ field.fieldSchema.title || field.fieldName }}
        </label>
        <template v-if="field.fieldName === 'button' && field.fieldSchema.avantos_type === 'button'">
          <button type="button" class="field-btn">{{ field.fieldSchema.title || field.fieldName }}</button>
        </template>
        <template v-else-if="field.fieldName === 'dynamic_checkbox_group' && field.fieldSchema.type === 'array' && field.fieldSchema.items && field.fieldSchema.items.enum">
          <div class="checkbox-group">
            <label v-for="option in field.fieldSchema.items.enum" :key="option" class="checkbox-label">
              <input type="checkbox" :value="option" :name="field.fieldName" />
              {{ option }}
            </label>
          </div>
        </template>
        <template v-else-if="field.fieldSchema.type === 'string'">
          <input :id="field.fieldName" type="text" class="field-input" :placeholder="field.fieldSchema.title || field.fieldName" />
        </template>
        <template v-else-if="field.fieldName === 'multi_select' && field.fieldSchema.type === 'array' && field.fieldSchema.items && field.fieldSchema.items.enum">
          <select :id="field.fieldName" class="field-input" multiple>
            <option v-for="option in field.fieldSchema.items.enum" :key="option" :value="option">{{ option }}</option>
          </select>
        </template>
        <template v-else-if="field.fieldSchema.type === 'object'">
          <div class="object-placeholder">[Object Field]</div>
        </template>
        <template v-else>
          <input :id="field.fieldName" type="text" class="field-input" :placeholder="field.fieldSchema.title || field.fieldName" />
        </template>
        <span class="field-type">[{{ field.fieldSchema.type }}]</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getFieldsForFormNode, type GraphNode } from '../services/api'

const props = defineProps<{
  formNode: GraphNode,
  forms: any[]
}>()

const fields = computed(() => getFieldsForFormNode(props.formNode, props.forms))

// Specify the desired order of fields
const fieldOrder = [
  'id',
  'name',
  'email',
  'notes',
  'multi_select',
  'dynamic_checkbox_group',
  'dynamic_object',
  'button',
]

const orderedFields = computed(() => {
  // Sort fields by the specified order, then append any others
  const fieldMap = Object.fromEntries(fields.value.map(f => [f.fieldName, f]))
  const ordered = fieldOrder
    .map(name => fieldMap[name])
    .filter(Boolean)
  // Add any fields not in the order list
  const remaining = fields.value.filter(f => !fieldOrder.includes(f.fieldName))
  return [...ordered, ...remaining]
})
</script>

<style scoped>
.form-fields-list {
  margin: 20px 0;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  color: #213547;
}
.form-fields-list h3 {
  margin-top: 0;
  color: #1976d2;
}
.fields-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.field-label {
  min-width: 120px;
  font-weight: 500;
  color: #1976d2;
}
.field-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  font-size: 1em;
  color: #213547;
  background: #f9f9fb;
}
.field-type {
  color: #888;
  font-size: 0.95em;
  margin-left: 8px;
}
.field-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  background: #1976d2;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.field-btn:hover {
  background: #1251a3;
}
.object-placeholder {
  color: #666;
  font-style: italic;
  padding: 4px 0;
}
.checkbox-group {
  display: flex;
  gap: 16px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  color: #213547;
}
</style> 