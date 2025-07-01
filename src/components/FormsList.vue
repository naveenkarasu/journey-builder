<template>
  <div class="forms-list">
    <h2>Forms List</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Loading forms...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>Error: {{ error }}</p>
      <button @click="fetchForms" class="retry-btn">Retry</button>
    </div>
    
    <!-- Forms list -->
    <div v-else-if="forms.length > 0" class="forms-container">
      <div 
        v-for="form in forms" 
        :key="form.id" 
        class="form-item"
      >
        <h3>{{ form.data.name }}</h3>
        <p class="form-id">ID: {{ form.id }}</p>
        
        <!-- Dependencies -->
        <div v-if="form.data.prerequisites.length > 0" class="dependencies">
          <strong>Depends on:</strong>
          <ul>
            <li v-for="prereq in form.data.prerequisites" :key="prereq">
              {{ getFormNameById(prereq) }}
            </li>
          </ul>
        </div>
        
        <div v-else class="no-dependencies">
          <em>No dependencies</em>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-else class="empty">
      <p>No forms found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService, type GraphNode, type GraphData } from '../services/api'

// Reactive data
const forms = ref<GraphNode[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const graphData = ref<GraphData | null>(null)

// Helper: map error to user-friendly message
function getFriendlyErrorMessage(err: any): string {
  if (err.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }
  if (err.response) {
    // Server responded with a status code outside 2xx
    switch (err.response.status) {
      case 404:
        return 'The requested forms data was not found (404).';
      case 500:
        return 'The server encountered an error (500). Please try again later.';
      default:
        return `Server error (${err.response.status}): ${err.response.statusText}`;
    }
  } else if (err.request) {
    // No response received
    return 'Could not connect to the server. Please check your network connection.'
  } else if (typeof err === 'string') {
    return err;
  } else {
    return 'An unexpected error occurred. Please try again.'
  }
}

// Fetch forms from the API with timeout
const fetchForms = async () => {
  loading.value = true
  error.value = null

  // Timeout logic (8 seconds)
  const timeoutMs = 8000
  let timeoutHandle: any
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject({ code: 'ECONNABORTED' })
    }, timeoutMs)
  })

  try {
    // Using the tenant_id and blueprint_id from the graph.json file
    const data = await Promise.race([
      apiService.getActionBlueprintGraph('1', 'bp_01jk766tckfwx84xjcxazggzyc'),
      timeoutPromise
    ])
    clearTimeout(timeoutHandle)
    graphData.value = data as GraphData
    forms.value = apiService.getFormsFromGraph(data as GraphData)
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err)
    console.error('Error fetching forms:', err)
  } finally {
    loading.value = false
  }
}

// Helper function to get form name by ID
const getFormNameById = (formId: string): string => {
  const form = graphData.value?.nodes.find(node => node.id === formId)
  return form ? form.data.name : formId
}

// Fetch forms when component mounts
onMounted(() => {
  fetchForms()
})
</script>

<style scoped>
.forms-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.forms-list h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #d32f2f;
}

.retry-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background-color: #1565c0;
}

.forms-container {
  display: grid;
  gap: 20px;
}

.form-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.form-item:hover {
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.15), 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-4px) scale(1.025);
}

.form-item:hover h3 {
  color: #0d47a1;
  text-decoration: underline;
}

.form-item h3 {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-size: 1.2em;
}

.form-id {
  color: #666;
  font-size: 0.9em;
  margin: 5px 0;
}

.dependencies {
  margin-top: 15px;
}

.dependencies strong {
  color: #333;
}

.dependencies ul {
  margin: 5px 0;
  padding-left: 20px;
}

.dependencies li {
  color: #666;
  margin: 2px 0;
}

.no-dependencies {
  margin-top: 15px;
  color: #999;
  font-style: italic;
}
</style> 