<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FormsList from './components/FormsList.vue'
import FormFieldsList from './components/FormFieldsList.vue'
import FormPrefillEditor from './components/FormPrefillEditor.vue'
import { apiService, type GraphNode, type GraphData } from './services/api'
import type { PrefillMapping, PrefillSource } from './types/prefill'

const graphData = ref<GraphData | null>(null)
const forms = ref<any[]>([])
const formNodes = ref<GraphNode[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedFormId = ref<string | null>(null)

// Prefill mapping state (per form id)
const prefillMappings = ref<Record<string, PrefillMapping>>({})

const fetchGraphData = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await apiService.getActionBlueprintGraph('1', 'bp_01jk766tckfwx84xjcxazggzyc')
    graphData.value = data
    forms.value = data.forms
    formNodes.value = data.nodes.filter(n => n.type === 'form')
    if (formNodes.value.length > 0) {
      selectedFormId.value = formNodes.value[0].id
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load forms graph.'
  } finally {
    loading.value = false
  }
}

const selectedFormNode = computed(() =>
  formNodes.value.find(n => n.id === selectedFormId.value) || null
)

// Handlers for prefill mapping
function handleUpdateMapping({ fieldName, source }: { fieldName: string, source: PrefillSource }) {
  if (!selectedFormId.value) return
  if (!prefillMappings.value[selectedFormId.value]) {
    prefillMappings.value[selectedFormId.value] = {}
  }
  prefillMappings.value[selectedFormId.value][fieldName] = source
}

function handleClearMapping(fieldName: string) {
  if (!selectedFormId.value) return
  if (prefillMappings.value[selectedFormId.value]) {
    prefillMappings.value[selectedFormId.value][fieldName] = null
  }
}

onMounted(() => {
  fetchGraphData()
})
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>Journey Builder</h1>
      <p>Forms and Dependencies Viewer</p>
    </header>
    <main class="app-main">
      <div v-if="loading" class="loading">Loading forms...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div class="form-select-container">
          <label for="form-select">Select a form:</label>
          <select id="form-select" v-model="selectedFormId">
            <option v-for="node in formNodes" :key="node.id" :value="node.id">
              {{ node.data.name }}
            </option>
          </select>
        </div>
        <FormFieldsList v-if="selectedFormNode && forms.length > 0" :formNode="selectedFormNode" :forms="forms" />
        <FormPrefillEditor
          v-if="selectedFormNode && forms.length > 0 && graphData"
          :formNode="selectedFormNode"
          :forms="forms"
          :graphData="graphData"
          :prefillMappings="prefillMappings[selectedFormId] || {}"
          @updateMapping="handleUpdateMapping"
          @clear="handleClearMapping"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  text-align: center;
  padding: 40px 20px 20px;
  color: white;
}

.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-header p {
  margin: 0;
  font-size: 1.1em;
  opacity: 0.9;
}

.app-main {
  padding: 0 20px 40px;
}

.form-select-container {
  margin: 24px 0 16px 0;
  text-align: center;
}

label[for="form-select"] {
  font-weight: 500;
  margin-right: 8px;
  color: #213547;
}

select#form-select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #bdbdbd;
  font-size: 1em;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #fff;
}

.error {
  background: #d32f2f;
  border-radius: 8px;
}
</style>
